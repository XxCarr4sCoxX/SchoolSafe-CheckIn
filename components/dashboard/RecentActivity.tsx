
"use client";

import {
    Clock,
    CalendarCheck,
    BookOpen,
    ClipboardList,
} from "lucide-react";

export interface ActivityItem {
    date: string;
    studentName: string;
    type: "attendance" | "grade" | "enrollment";
    description: string;
}

interface RecentActivityProps {
    items: ActivityItem[];
}

const activityIcons = {
    attendance: CalendarCheck,
    grade: BookOpen,
    enrollment: ClipboardList,
};

export default function RecentActivity({
    items,
}: RecentActivityProps) {
    if (items.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
                <Clock className="mb-3 h-9 w-9" />
                <p>No hay actividad reciente.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {items.map((item, index) => {
                const Icon = activityIcons[item.type];

                return (
                    <div
                        key={`${item.type}-${item.date}-${index}`}
                        className="flex items-center justify-between gap-4 py-4"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-800">
                                    {item.studentName}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        <time className="shrink-0 text-xs text-gray-400">
                            {new Date(
                                `${item.date}T12:00:00`
                            ).toLocaleDateString("es-PE")}
                        </time>
                    </div>
                );
            })}
        </div>
    );
}
