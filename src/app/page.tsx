import { createServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import BentoLayout from "@/components/layout/BentoLayout";

export default async function Home() {
  const supabase = createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="h-screen w-screen bg-gray-900 overflow-hidden">
      <BentoLayout />
    </main>
  );
}
