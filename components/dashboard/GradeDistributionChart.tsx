
"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface GradeDistributionChartProps {
    grades: number[];
}

export default function GradeDistributionChart({
    grades,
}: GradeDistributionChartProps) {
    const ranges = [
        { label: "0 - 10", count: 0 },
        { label: ">10 - 13", count: 0 },
        { label: ">13 - 17", count: 0 },
        { label: ">17 - 20", count: 0 },
    ];

    grades.forEach((grade) => {
        if (grade < 0 || grade > 20 || !Number.isFinite(grade)) {
            return;
        }

        if (grade <= 10) {
            ranges[0].count++;
        } else if (grade <= 13) {
            ranges[1].count++;
        } else if (grade <= 17) {
            ranges[2].count++;
        } else {
            ranges[3].count++;
        }
    });

    const hasData = grades.length > 0;

    if (!hasData) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center text-gray-400">
                <BarChart3 className="mb-3 h-10 w-10" />
                <p>No hay calificaciones registradas.</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranges}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="label" />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Bar
                        dataKey="count"
                        name="Cantidad de calificaciones"
                        fill="#2563EB"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
