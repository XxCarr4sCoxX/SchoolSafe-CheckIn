
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CalendarDays } from "lucide-react";

export interface AttendanceDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface AttendanceChartProps {
  data: AttendanceDay[];
}

export default function AttendanceChart({
  data,
}: AttendanceChartProps) {
  const hasData = data.some(
    (day) =>
      day.present + day.absent + day.late + day.excused > 0
  );

  if (!hasData) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-gray-400">
        <CalendarDays className="mb-3 h-10 w-10" />
        <p className="font-medium">
          No hay asistencias registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
          />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="present"
            name="Presentes"
            stroke="#16A34A"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="absent"
            name="Ausentes"
            stroke="#DC2626"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="late"
            name="Tardanzas"
            stroke="#D97706"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="excused"
            name="Justificados"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
