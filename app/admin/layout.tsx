import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
