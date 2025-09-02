"use client";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuthAction = async () => {
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // The page will redirect automatically on auth state change
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-xs space-y-6">
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black border-gray-600 text-white placeholder:text-gray-500 focus:border-gray-400 focus:ring-0 focus:ring-offset-0"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black border-gray-600 text-white placeholder:text-gray-500 focus:border-gray-400 focus:ring-0 focus:ring-offset-0"
        />
      </div>
      <Button 
        onClick={handleAuthAction} 
        className="w-full bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
      >
        {isSignUp ? "Sign Up" : "Sign In"}
      </Button>
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <button 
        onClick={() => setIsSignUp(!isSignUp)} 
        className="w-full text-gray-500 hover:text-gray-300 transition-colors text-sm"
      >
        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}
