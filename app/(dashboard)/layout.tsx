import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import UserStoreInitializer from "@/components/UserStoreInitializer";

import type { User } from "@/store/user";
import PageHeader from "@/components/ui/PageHeader";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const user: User | null = cookieStore.get("userDetails") ? JSON.parse(cookieStore.get("userDetails")!.value) : null;
  return (
    <SidebarProvider>
      <UserStoreInitializer user={user} />

      <AppSidebar />
      <SidebarInset>
        <PageHeader />
        <div className="flex flex-1 flex-col gap-4 pt-0 h-[calc(100vh-64px)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
