// Environment variables type definitions

declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // ComfyUI
    COMFYUI_API_URL: string;
    NEXT_PUBLIC_COMFYUI_API_URL: string;
    COMFYUI_WS_URL: string;

    // Webhooks
    WEBHOOK_SECRET: string;
    NEXT_PUBLIC_WEBHOOK_URL: string;

    // Next.js
    NODE_ENV: 'development' | 'production' | 'test';
    VERCEL_URL?: string;
    NEXT_PUBLIC_VERCEL_URL?: string;
  }
}
