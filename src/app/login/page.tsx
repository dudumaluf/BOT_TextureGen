"use client";

import AuthForm from "@/components/auth/AuthForm";
import IntroAnimation from "@/components/layout/IntroAnimation";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => setShowAuth(true), 300);
  };
  
  return (
    <div className="min-h-screen bg-black">
      {/* Intro Animation */}
      {showIntro && (
        <IntroAnimation onComplete={handleIntroComplete} type="pre-login" />
      )}

      {/* Auth Form */}
      {showAuth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex min-h-screen items-center justify-center"
        >
          <AuthForm />
        </motion.div>
      )}
    </div>
  );
}
