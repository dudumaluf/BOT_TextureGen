"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Model from "./Model";
import { Suspense } from "react";
import { useAppStore } from "@/store/appStore";

export default function Viewer() {
  const environment = useAppStore((state) => state.environment);

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <Canvas>
        <Suspense fallback={null}>
          <Model />
          <Environment files={`/${environment}`} background />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
