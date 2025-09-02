"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useAppStore } from "@/store/appStore";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export default function Model() {
  const modelUrl = useAppStore((state) => state.modelUrl);

  if (!modelUrl) {
    return null;
  }

  return <ModelRenderer modelUrl={modelUrl} />;
}

function ModelRenderer({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const generatedTextures = useAppStore((state) => state.generatedTextures);
  const materialSettings = useAppStore((state) => state.materialSettings);
  const objectScale = useAppStore((state) => state.objectScale);

  const sceneClone = useMemo(() => {
    const clone = scene.clone();
    clone.scale.setScalar(objectScale);
    return clone;
  }, [scene, objectScale]);

  useEffect(() => {
    console.log("Model: Generated textures state", generatedTextures);
    if (!generatedTextures.diffuse) {
      console.log("Model: No diffuse texture found");
      return;
    }

    console.log("Model: Loading textures", {
      diffuse: generatedTextures.diffuse,
      normal: generatedTextures.normal,
      height: generatedTextures.height
    });

    const textureLoader = new THREE.TextureLoader();
    const diffuseMap = textureLoader.load(generatedTextures.diffuse, (texture) => {
      texture.flipY = false;
    });
    const normalMap = generatedTextures.normal ? textureLoader.load(generatedTextures.normal, (texture) => {
      texture.flipY = false;
    }) : null;
    const heightMap = generatedTextures.height ? textureLoader.load(generatedTextures.height, (texture) => {
      texture.flipY = false;
    }) : null;

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.map = diffuseMap;
        if (normalMap) {
          child.material.normalMap = normalMap;
          child.material.normalScale.set(materialSettings.normalScale, materialSettings.normalScale);
        }
        if (heightMap) {
          child.material.displacementMap = heightMap;
          child.material.displacementScale = materialSettings.displacementScale;
        }
        child.material.metalness = materialSettings.metalness;
        child.material.roughness = materialSettings.roughness;
        child.material.needsUpdate = true;
      }
    });
  }, [generatedTextures, sceneClone, materialSettings]);

  return <primitive object={sceneClone} />;
}
