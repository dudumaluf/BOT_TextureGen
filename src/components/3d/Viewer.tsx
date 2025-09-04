"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Model from "./Model";
import { Suspense, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";

function CameraController() {
  const cameraDistance = useAppStore((state) => state.cameraDistance);
  const resetCameraTrigger = useAppStore((state) => state.resetCameraTrigger);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraDistance]);

  // Handle camera reset
  useEffect(() => {
    if (resetCameraTrigger > 0) {
      console.log('Reset camera trigger activated:', resetCameraTrigger);
      
      // Reset camera position
      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      
      console.log('Camera reset completed');
    }
  }, [resetCameraTrigger, camera, cameraDistance]);

  return null;
}

function OrbitControlsWrapper() {
  const resetCameraTrigger = useAppStore((state) => state.resetCameraTrigger);
  const controlsRef = useRef<any>();

  useEffect(() => {
    if (resetCameraTrigger > 0 && controlsRef.current) {
      console.log('Resetting OrbitControls via ref');
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [resetCameraTrigger]);

  return <OrbitControls ref={controlsRef} target={[0, 0, 0]} />;
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
        <OrbitControlsWrapper />
      </Canvas>
    </div>
  );
}
