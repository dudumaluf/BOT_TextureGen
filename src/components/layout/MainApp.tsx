"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IntroAnimation from "./IntroAnimation";
import BentoLayout from "./BentoLayout";
import { useAppStore } from "@/store/appStore";
import { createClient } from "@/lib/supabase";

export default function MainApp() {
  const [showIntro, setShowIntro] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const { setTheme, setBackgroundColor, setUserEmail } = useAppStore();
  const supabase = createClient();

  // Detect admin user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();
  }, [setUserEmail, supabase]);

  // Set black as default background
  useEffect(() => {
    setTheme('dark');
    setBackgroundColor('#000000');
  }, [setTheme, setBackgroundColor]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => setShowApp(true), 300);
  };

  return (
    <>
      {/* Post-signin intro animation with video */}
      {showIntro && (
        <IntroAnimation 
          onComplete={handleIntroComplete} 
          type="post-login"
        />
      )}

      {/* Main application */}
      {showApp && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-screen w-screen bg-black overflow-hidden"
        >
          <BentoLayout />
        </motion.main>
      )}
    </>
  );
}
