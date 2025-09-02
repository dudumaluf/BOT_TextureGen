import { createServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import MainApp from "@/components/layout/MainApp";

export default async function Home() {
  const supabase = createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <MainApp />;
}
