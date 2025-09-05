"use client";

import { useGLTF, useAnimations } from "@react-three/drei";
import { useAppStore } from "@/store/appStore";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Model() {
  const modelUrl = useAppStore((state: any) => state.modelUrl);

  if (!modelUrl) {
    return null;
  }

  return <ModelRenderer modelUrl={modelUrl} />;
}

function ModelRenderer({ modelUrl }: { modelUrl: string }) {
  const { scene, animations } = useGLTF(modelUrl);
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, group);
  
  const generatedTextures = useAppStore((state) => state.generatedTextures);
  const materialSettings = useAppStore((state) => state.materialSettings);
  const objectScale = useAppStore((state) => state.objectScale);
  const objectPosition = useAppStore((state) => state.objectPosition);
  const objectRotation = useAppStore((state) => state.objectRotation);
  const resetCameraTrigger = useAppStore((state) => state.resetCameraTrigger);
  const { setCameraDistance, setObjectScale, setObjectPosition } = useAppStore();
  
  // Animation state
  const {
    hasAnimations,
    animationNames,
    currentAnimation,
    animationTime,
    isAnimationPlaying,
    animationDuration,
    animationPlaybackSpeed,
    setHasAnimations,
    setAnimations,
    setAnimationNames,
    setCurrentAnimation,
    setAnimationTime,
    setIsAnimationPlaying,
    setAnimationDuration,
    setShowAnimationTimeline
  } = useAppStore();

  // We'll apply textures directly to the scene since we need animations to work

  // Initialize animations when model loads
  useEffect(() => {
    if (animations && animations.length > 0) {
      // Create unique animation names with indices for duplicates
      const animNames: string[] = [];
      const nameCount: { [key: string]: number } = {};
      
      animations.forEach((anim) => {
        let name = anim.name;
        if (nameCount[name]) {
          nameCount[name]++;
          name = `${anim.name} ${nameCount[name]}`;
        } else {
          nameCount[name] = 1;
        }
        animNames.push(name);
      });
      
      console.log("Model: Found", animNames.length, "animations for new model");
      
      setHasAnimations(true);
      setAnimations(animations);
      setAnimationNames(animNames);
      
      // Always reset animation state for new model
      setCurrentAnimation(animNames[0]);
      setAnimationDuration(animations[0].duration);
      setAnimationTime(0); // Reset time to beginning
      
      // Auto-start the first animation after a brief delay
      setTimeout(() => {
        setIsAnimationPlaying(true);
        console.log("Model: Auto-started animation:", animNames[0]);
      }, 100);
      
    } else {
      console.log("Model: No animations found");
      setHasAnimations(false);
      setAnimations(null);
      setAnimationNames([]);
      setCurrentAnimation(null);
      setIsAnimationPlaying(false);
      setAnimationTime(0);
    }
  }, [animations, modelUrl, setHasAnimations, setAnimations, setAnimationNames, setCurrentAnimation, setAnimationDuration, setAnimationTime, setIsAnimationPlaying]);

  // Auto-framing function - centers and scales the model itself (not just camera)
  const autoFrameModel = () => {
    if (!scene || !group.current) return;

    console.log("🎯 Auto-framing: Centering and scaling model at origin");

    // Create a bounding box for the entire scene
    const box = new THREE.Box3().setFromObject(scene);
    
    if (box.isEmpty()) {
      console.warn("Auto-framing: Model has no geometry, using default values");
      setObjectScale(1);
      setCameraDistance(5);
      return;
    }

    // Get the size and center of the bounding box
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    console.log("🎯 Auto-framing: Original model state", {
      size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
      center: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
      maxDimension: maxDimension.toFixed(2)
    });

    // STEP 1: Center the model at origin by adjusting the group position
    // Move the entire group so the model's bounding box center is at (0, 0, 0)
    if (group.current) {
      group.current.position.set(-center.x, -center.y, -center.z);
    }
    
    // STEP 2: Calculate optimal scale to normalize the model size
    // Target: make the largest dimension about 2 units for consistent viewing
    const targetSize = 2;
    const optimalScale = maxDimension > 0 ? targetSize / maxDimension : 1;
    const finalScale = Math.max(0.01, Math.min(50, optimalScale)); // Allow much more aggressive scaling
    
    // STEP 3: Set optimal camera distance for the normalized model
    // Since model is now centered and scaled, we can use a predictable camera distance
    const optimalDistance = targetSize * 2.5; // 2.5x the target size for good framing
    const finalDistance = Math.max(2, Math.min(200, optimalDistance)); // Allow up to 200 units
    
    console.log("🎯 Auto-framing: Applied transformations", {
      modelPosition: { x: -center.x.toFixed(2), y: -center.y.toFixed(2), z: -center.z.toFixed(2) },
      optimalScale: optimalScale.toFixed(3),
      finalScale: finalScale.toFixed(3),
      finalDistance: finalDistance.toFixed(2),
      scaleChange: `${objectScale.toFixed(3)} → ${finalScale.toFixed(3)}`,
      wasScaleClamped: optimalScale !== finalScale
    });

    // Apply the calculated values
    setObjectScale(finalScale);
    setCameraDistance(finalDistance);
    
    // Trigger camera update by incrementing the reset trigger
    useAppStore.setState((state) => ({ 
      resetCameraTrigger: state.resetCameraTrigger + 1 
    }));
    
    console.log("🎯 Auto-framing: Model centered at origin and optimally scaled");
  };

  // Reset model position function - restores original position and scale
  const resetModelPosition = () => {
    if (!group.current) return;

    console.log("🔄 Resetting model to original position and scale");
    
    // Reset group position to origin
    group.current.position.set(0, 0, 0);
    
    // Reset scale and camera to defaults
    setObjectScale(1);
    setCameraDistance(5);
    
    // Trigger camera update by incrementing the reset trigger
    useAppStore.setState((state) => ({ 
      resetCameraTrigger: state.resetCameraTrigger + 1 
    }));
    
    console.log("🔄 Model reset to original state");
  };

  // Update model position when store value changes
  useEffect(() => {
    if (group.current) {
      group.current.position.set(objectPosition.x, objectPosition.y, objectPosition.z);
    }
  }, [objectPosition]);

  // Update model rotation when store value changes
  useEffect(() => {
    if (group.current) {
      group.current.rotation.set(objectRotation.x, objectRotation.y, objectRotation.z);
    }
  }, [objectRotation]);

  // Expose auto-frame and reset functions to the store
  useEffect(() => {
    const store = useAppStore.getState();
    // Replace the store's functions with our implementations
    useAppStore.setState({
      autoFrameModel: autoFrameModel,
      resetModelPosition: resetModelPosition
    });
  }, [scene, setCameraDistance, setObjectScale]);

  // Control animation playback
  useEffect(() => {
    if (!currentAnimation || !mixer || !animations) return;

    const animIndex = animationNames.indexOf(currentAnimation);
    const animation = animations[animIndex];
    
    if (!animation || !actions[animation.name]) {
      return;
    }

    const action = actions[animation.name];
    if (!action) return; // Additional null check for TypeScript

    // Stop all other animations first
    Object.values(actions).forEach((otherAction) => {
      if (otherAction && otherAction !== action) {
        otherAction.stop();
        otherAction.reset();
        otherAction.weight = 0;
      }
    });

    // Only reset if this is a new animation, not just play/pause
    if (!action.isRunning()) {
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.weight = 1.0;
      action.enabled = true;
      action.play(); // Always start the action
    }
    
    // Control play/pause state
    action.paused = !isAnimationPlaying;
    
    if (isAnimationPlaying) {
      console.log(`Animation: Playing "${currentAnimation}"`);
    } else {
      console.log(`Animation: Paused "${currentAnimation}"`);
    }

    return () => {
      // Don't stop the action on cleanup, let it continue
    };
  }, [currentAnimation, isAnimationPlaying, actions, mixer, animations, animationNames]);

  // Update animation time when scrubbing
  useEffect(() => {
    if (!currentAnimation || !mixer || !animations || !actions) return;

    const animIndex = animationNames.indexOf(currentAnimation);
    const animation = animations[animIndex];
    
    if (!animation || animationDuration <= 0) return;

    const action = actions[animation.name];
    if (action) {
      // Calculate target time in seconds
      const targetTime = animationTime * animationDuration;
      
      // Set the time directly without changing play state
      action.time = targetTime;
      
      // Force mixer to update to the new time
      mixer.update(0);
      
      console.log(`Scrubbing: Set animation time to ${targetTime.toFixed(2)}s (${(animationTime * 100).toFixed(1)}%)`);
    }
  }, [animationTime, currentAnimation, actions, mixer, animationDuration, animations, animationNames]);

  // Animation frame update
  useFrame((state, delta) => {
    if (mixer) {
      // Always update mixer, even when paused (for scrubbing)
      // Apply playback speed multiplier when playing
      const adjustedDelta = isAnimationPlaying ? delta * animationPlaybackSpeed : 0;
      mixer.update(adjustedDelta);
      
      // Update the timeline position when playing
      if (currentAnimation && animations && animationDuration > 0) {
        const animIndex = animationNames.indexOf(currentAnimation);
        const animation = animations[animIndex];
        
        if (animation) {
          const action = actions[animation.name];
          if (action && isAnimationPlaying) {
            const newTime = (action.time % animationDuration) / animationDuration;
            if (Math.abs(newTime - animationTime) > 0.01) { // Avoid infinite loops
              const { setAnimationTime } = useAppStore.getState();
              setAnimationTime(newTime);
            }
          }
        }
      }
    }
  });

  useEffect(() => {
    if (!generatedTextures.diffuse) {
      return;
    }

    console.log("🎨 Model: Starting texture replacement process", {
      diffuse: generatedTextures.diffuse,
      normal: generatedTextures.normal,
      height: generatedTextures.height,
      sceneChildren: scene.children.length
    });

    // First, let's see what we're working with
    console.log("🔍 Model: Analyzing scene structure...");
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material, index) => {
          console.log(`🔍 Found mesh "${child.name}" with material:`, {
            materialType: material.constructor.name,
            materialName: material.name,
            hasMap: !!material.map,
            mapUrl: material.map?.image?.src || 'none',
            uuid: material.uuid
          });
        });
      }
    });

    const textureLoader = new THREE.TextureLoader();
    
    // Load textures with callbacks to ensure they're ready
    const loadTextures = async () => {
      return new Promise<{diffuseMap: THREE.Texture, normalMap?: THREE.Texture, heightMap?: THREE.Texture}>((resolve) => {
        let loadedCount = 0;
        const totalTextures = 1 + (generatedTextures.normal ? 1 : 0) + (generatedTextures.height ? 1 : 0);
        
        const diffuseMap = textureLoader.load(
          generatedTextures.diffuse!, 
          (texture) => {
            texture.flipY = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            console.log("✅ Diffuse texture loaded:", texture.image.width, 'x', texture.image.height);
            loadedCount++;
            if (loadedCount === totalTextures) resolve({ diffuseMap, normalMap, heightMap });
          },
          undefined,
          (error) => {
            console.error("❌ Failed to load diffuse texture:", error);
            console.log("🔄 Creating fallback red material to test");
            // Create a fallback texture
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ff0000'; // Red fallback
            ctx.fillRect(0, 0, 256, 256);
            const fallbackTexture = new THREE.CanvasTexture(canvas);
            fallbackTexture.flipY = false;
            loadedCount++;
            if (loadedCount === totalTextures) resolve({ diffuseMap: fallbackTexture, normalMap, heightMap });
          }
        );
        
        const normalMap = generatedTextures.normal ? textureLoader.load(generatedTextures.normal, (texture) => {
          texture.flipY = false;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          console.log("✅ Normal texture loaded");
          loadedCount++;
          if (loadedCount === totalTextures) resolve({ diffuseMap, normalMap, heightMap });
        }) : undefined;
        
        const heightMap = generatedTextures.height ? textureLoader.load(generatedTextures.height, (texture) => {
          texture.flipY = false;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          console.log("✅ Height texture loaded");
          loadedCount++;
          if (loadedCount === totalTextures) resolve({ diffuseMap, normalMap, heightMap });
        }) : undefined;
        
        if (totalTextures === 1) resolve({ diffuseMap, normalMap, heightMap });
      });
    };

    loadTextures().then(({ diffuseMap, normalMap, heightMap }) => {
      console.log("🚀 All textures loaded, applying to materials...");
      
      let materialsProcessed = 0;
      
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((material, index) => {
            // Process ALL material types, not just MeshStandardMaterial
            if (material && typeof material === 'object') {
              console.log(`🔧 Processing material on mesh "${child.name}":`, {
                materialType: material.constructor.name,
                hasMap: !!(material as any).map,
                originalMapUrl: (material as any).map?.image?.src
              });
              
              // Create a completely new MeshStandardMaterial with safe defaults
              const newMaterial = new THREE.MeshStandardMaterial({
                map: diffuseMap,
                normalMap: normalMap || undefined,
                displacementMap: heightMap || undefined,
                metalness: materialSettings.metalness,
                roughness: materialSettings.roughness,
                normalScale: new THREE.Vector2(materialSettings.normalScale, materialSettings.normalScale),
                displacementScale: materialSettings.displacementScale,
                // Ensure proper color and lighting
                color: new THREE.Color(1, 1, 1), // Pure white base color
                emissive: new THREE.Color(0, 0, 0), // No emission
                transparent: false,
                opacity: 1.0,
                side: THREE.FrontSide,
                // Copy some properties from original if it's a standard material
                ...(material instanceof THREE.MeshStandardMaterial && {
                  transparent: material.transparent,
                  opacity: material.opacity,
                  side: material.side
                })
              });
              
              // Debug the texture loading
              console.log("🖼️ Texture debug info:", {
                diffuseMapLoaded: !!diffuseMap.image,
                diffuseMapSize: diffuseMap.image ? `${diffuseMap.image.width}x${diffuseMap.image.height}` : 'not loaded',
                diffuseMapUrl: generatedTextures.diffuse,
                normalMapLoaded: !!normalMap?.image,
                heightMapLoaded: !!heightMap?.image,
                materialMetalness: newMaterial.metalness,
                materialRoughness: newMaterial.roughness
              });
              
              // Dispose old material and textures
              if ((material as any).map) {
                console.log("🗑️ Disposing old texture");
                (material as any).map.dispose();
              }
              if (material instanceof THREE.Material) {
                material.dispose();
              }
              
              // Replace the material directly - smooth transition
              if (Array.isArray(child.material)) {
                child.material[index] = newMaterial;
              } else {
                child.material = newMaterial;
              }
              
              materialsProcessed++;
              
              console.log(`✅ Applied new textures to mesh "${child.name}"`, {
                newMapUrl: newMaterial.map?.image?.src,
                hasNormal: !!newMaterial.normalMap,
                hasHeight: !!newMaterial.displacementMap
              });
            }
          });
        }
      });
      
      console.log(`🎉 Texture replacement complete! Processed ${materialsProcessed} materials`);
    });
  }, [generatedTextures, scene, materialSettings]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={objectScale} />
    </group>
  );
}
