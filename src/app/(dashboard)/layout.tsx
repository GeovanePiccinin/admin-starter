import { Sidebar } from "@/components/layout/sidebar";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="pl-64 transition-[padding] duration-200 [aside.w-16+&]:pl-16 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center border-b px-6">
          <div>
            <p className="text-sm font-medium">{user.name}</p>

            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
