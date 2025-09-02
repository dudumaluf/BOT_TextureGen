"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Model from "./Model";
import { Suspense, useEffect } from "react";
import { useAppStore } from "@/store/appStore";

function CameraController() {
  const cameraDistance = useAppStore((state) => state.cameraDistance);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraDistance]);

  return null;
}

export default function Viewer() {
  const environment = useAppStore((state) => state.environment);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const showEnvironmentBackground = useAppStore((state) => state.showEnvironmentBackground);

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <Canvas>
        <Suspense fallback={null}>
          <CameraController />
          <Model />
          {/* HDRI for lighting only or lighting + background */}
          <Environment 
            files={`/${environment}`} 
            background={showEnvironmentBackground}
          />
          {/* Solid color background when HDRI background is disabled */}
          {!showEnvironmentBackground && (
            <color attach="background" args={[backgroundColor]} />
          )}
        </Suspense>
        <OrbitControls target={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
