import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
      <span className="text-sm text-gray-500 mb-2">{title}</span>
      <span className="text-2xl font-bold text-blue-900">{value}</span>
    </div>
  );
}
