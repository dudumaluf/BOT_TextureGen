// Global type definitions for the TextureGen application

declare global {
  interface Window {
    // Custom events
    addEventListener(type: 'app-notification', listener: (event: CustomEvent) => void): void;
    removeEventListener(type: 'app-notification', listener: (event: CustomEvent) => void): void;
    dispatchEvent(event: CustomEvent): boolean;
  }
}

// ComfyUI related types
export interface ComfyUINode {
  inputs: Record<string, any>;
  class_type: string;
  _meta?: {
    title?: string;
  };
}

export interface ComfyUIWorkflow {
  [nodeId: string]: ComfyUINode;
}

// Supabase query result types
export interface SupabaseQueryResult<T = any> {
  data: T | null;
  error: any;
}

// Custom event types
export interface AppNotificationEvent extends CustomEvent {
  detail: {
    message: string;
    duration?: number;
    type?: 'info' | 'success' | 'error' | 'warning';
  };
}

// Three.js related types for better compatibility
export interface ThreeJSMaterial {
  map?: any;
  normalMap?: any;
  displacementMap?: any;
  metalness?: number;
  roughness?: number;
  normalScale?: any;
  displacementScale?: number;
  color?: any;
  emissive?: any;
  transparent?: boolean;
  opacity?: number;
  side?: any;
  dispose?: () => void;
}

export {};
