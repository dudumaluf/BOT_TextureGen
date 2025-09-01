"use client";

import AuthForm from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm />
    </div>
  );
}
