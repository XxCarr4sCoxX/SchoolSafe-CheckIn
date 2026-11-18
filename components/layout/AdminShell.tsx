
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface AdminShellProps {
    children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] md:flex">
            <Sidebar />

            <div className="min-w-0 flex-1">
                <Header />

                <main className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
