
import AdminShell from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import StatCard from "@/components/dashboard/StatCard";
import AttendanceChart, {
  type AttendanceDay,
} from "@/components/dashboard/AttendanceChart";
import GradeDistributionChart from "@/components/dashboard/GradeDistributionChart";
import RecentActivity, {
  type ActivityItem,
} from "@/components/dashboard/RecentActivity";

function getLimaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");
}

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();

  // ==========================================
  // 1. INDICADORES PRINCIPALES
  // ==========================================

  const [
    studentsResult,
    teachersResult,
    classroomsResult,
    enrollmentsResult,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("teachers")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("classrooms")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  // ==========================================
  // 2. ÚLTIMOS SIETE DÍAS DE ASISTENCIA
  // ==========================================

  const today = getLimaDate();

  const dateCursor = new Date(`${today}T12:00:00Z`);

  const dateKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(dateCursor);

    date.setUTCDate(dateCursor.getUTCDate() - (6 - index));

    return date.toISOString().slice(0, 10);
  });

  const startDate = dateKeys[0];
  const endDate = dateKeys[dateKeys.length - 1];

  const { data: attendanceData, error: attendanceError } =
    await supabase
      .from("attendance")
      .select("attendance_date, status")
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .order("attendance_date", { ascending: true });

  const attendanceByDate = new Map<string, AttendanceDay>(
    dateKeys.map((date) => [
      date,
      {
        date: formatDayLabel(date),
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      },
    ])
  );

  for (const record of attendanceData ?? []) {
    const day = attendanceByDate.get(record.attendance_date);

    if (!day) continue;

    switch (record.status) {
      case "present":
        day.present++;
        break;

      case "absent":
        day.absent++;
        break;

      case "late":
        day.late++;
        break;

      case "excused":
        day.excused++;
        break;
    }
  }

  const attendanceChartData = dateKeys.map(
    (date) => attendanceByDate.get(date)!
  );

  // ==========================================
  // 3. DISTRIBUCIÓN DE CALIFICACIONES
  // ==========================================

  const { data: gradesData, error: gradesError } =
    await supabase
      .from("grades")
      .select("score, max_score");

  const gradeScores = (gradesData ?? [])
    .map((grade) => {
      const score = Number(grade.score);
      const maxScore = Number(grade.max_score);

      if (
        !Number.isFinite(score) ||
        !Number.isFinite(maxScore) ||
        maxScore <= 0 ||
        score < 0 ||
        score > maxScore
      ) {
        return null;
      }

      // Normalizar las notas a la escala de 0 a 20.
      return Number(((score / maxScore) * 20).toFixed(2));
    })
    .filter((score): score is number => score !== null);

  // ==========================================
  // 4. ACTIVIDAD RECIENTE
  // ==========================================

  const [
    attendanceRecentResult,
    gradesRecentResult,
    enrollmentsRecentResult,
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("attendance_date, enrollment_id, status")
      .order("attendance_date", { ascending: false })
      .limit(5),

    supabase
      .from("grades")
      .select("evaluation_date, enrollment_id, score, evaluation_name")
      .order("evaluation_date", { ascending: false })
      .limit(5),

    supabase
      .from("enrollments")
      .select("enrollment_date, student_id, academic_year")
      .order("enrollment_date", { ascending: false })
      .limit(5),
  ]);

  const recentAttendance = attendanceRecentResult.data ?? [];
  const recentGrades = gradesRecentResult.data ?? [];
  const recentEnrollments = enrollmentsRecentResult.data ?? [];

  const enrollmentIds = Array.from(
    new Set([
      ...recentAttendance.map((item) => item.enrollment_id),
      ...recentGrades.map((item) => item.enrollment_id),
    ])
  );

  type EnrollmentLookup = {
    id: string;
    student_id: string;
  };

  let enrollmentLookup: EnrollmentLookup[] = [];
  let relationError: string | null = null;

  if (enrollmentIds.length > 0) {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, student_id")
      .in("id", enrollmentIds);

    enrollmentLookup = data ?? [];
    relationError = error?.message ?? null;
  }

  const studentIds = Array.from(
    new Set([
      ...enrollmentLookup.map((item) => item.student_id),
      ...recentEnrollments.map((item) => item.student_id),
    ])
  );

  type StudentLookup = {
    id: string;
    first_name: string;
    last_name: string;
  };

  let studentLookup: StudentLookup[] = [];

  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .in("id", studentIds);

    studentLookup = data ?? [];

    if (error) {
      relationError = error.message;
    }
  }

  const enrollmentMap = new Map(
    enrollmentLookup.map((item) => [item.id, item.student_id])
  );

  const studentMap = new Map(
    studentLookup.map((item) => [
      item.id,
      `${item.first_name} ${item.last_name}`,
    ])
  );

  function studentNameFromEnrollment(enrollmentId: string) {
    const studentId = enrollmentMap.get(enrollmentId);

    return studentId
      ? studentMap.get(studentId) ?? "Estudiante no disponible"
      : "Estudiante no disponible";
  }

  const activityItems: ActivityItem[] = [];

  const attendanceLabels: Record<string, string> = {
    present: "Presente",
    absent: "Ausente",
    late: "Tardanza",
    excused: "Justificado",
  };

  for (const item of recentAttendance) {
    activityItems.push({
      date: item.attendance_date,
      studentName: studentNameFromEnrollment(item.enrollment_id),
      type: "attendance",
      description: `Asistencia: ${attendanceLabels[item.status] ?? item.status}`,
    });
  }

  for (const item of recentGrades) {
    activityItems.push({
      date: item.evaluation_date,
      studentName: studentNameFromEnrollment(item.enrollment_id),
      type: "grade",
      description: `Nota: ${Number(item.score).toFixed(2)} - ${item.evaluation_name}`,
    });
  }

  for (const item of recentEnrollments) {
    activityItems.push({
      date: item.enrollment_date,
      studentName:
        studentMap.get(item.student_id) ?? "Estudiante no disponible",
      type: "enrollment",
      description: `Matrícula registrada - Año ${item.academic_year}`,
    });
  }

  activityItems.sort((a, b) => b.date.localeCompare(a.date));

  const recentActivities = activityItems.slice(0, 5);

  // ==========================================
  // 5. COMPROBAR ERRORES DE CONSULTA
  // ==========================================

  const queryErrors = [
    studentsResult.error?.message,
    teachersResult.error?.message,
    classroomsResult.error?.message,
    enrollmentsResult.error?.message,
    attendanceError?.message,
    gradesError?.message,
    attendanceRecentResult.error?.message,
    gradesRecentResult.error?.message,
    enrollmentsRecentResult.error?.message,
    relationError,
  ].filter(Boolean);

  // ==========================================
  // 6. MOSTRAR DASHBOARD
  // ==========================================

  return (
    <AdminShell>
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Panel principal
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Resumen general de la gestión escolar.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          Año académico {new Date().getFullYear()}
        </div>
      </div>

      {queryErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Algunas estadísticas no pudieron cargarse. Revisa los registros
          de errores del servidor para identificar las consultas afectadas.
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de estudiantes"
          value={studentsResult.count ?? 0}
        />

        <StatCard
          title="Total de docentes"
          value={teachersResult.count ?? 0}
        />

        <StatCard
          title="Total de aulas"
          value={classroomsResult.count ?? 0}
        />

        <StatCard
          title="Matrículas activas"
          value={enrollmentsResult.count ?? 0}
        />
      </section>

      {/* GRÁFICOS */}
      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Estadísticas de asistencia
            </h3>

            <p className="text-sm text-gray-500">
              Comportamiento de los últimos siete días.
            </p>
          </div>

          {attendanceError ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-red-600">
              No se pudo consultar la asistencia.
            </p>
          ) : (
            <AttendanceChart data={attendanceChartData} />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Distribución de calificaciones
            </h3>

            <p className="text-sm text-gray-500">
              Resultados normalizados a una escala de 0 a 20.
            </p>
          </div>

          {gradesError ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-red-600">
              No se pudieron consultar las calificaciones.
            </p>
          ) : (
            <GradeDistributionChart grades={gradeScores} />
          )}
        </div>
      </section>

      {/* ACTIVIDAD RECIENTE */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Actividad reciente
          </h3>

          <p className="text-sm text-gray-500">
            Últimos movimientos registrados en EduSchool.
          </p>
        </div>

        {queryErrors.length > 0 ? (
          <p className="py-8 text-center text-sm text-red-600">
            No se pudo completar la consulta de actividad.
          </p>
        ) : (
          <RecentActivity items={recentActivities} />
        )}
      </section>
    </AdminShell>
  );
}
