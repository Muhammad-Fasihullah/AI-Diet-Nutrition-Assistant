import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <Sidebar userEmail={user.email} userName={user.user_metadata?.name} />
      <main className="ml-64 h-screen">
        <div className="h-full max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
