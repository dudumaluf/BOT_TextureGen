"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/appStore";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { Dices, Library } from "lucide-react";
import { useEffect, useState } from "react";

export default function ControlPanel() {
  const { 
    modelUrl,
    modelId,
    modelFileName,
    referenceImageUrl,
    referenceImageName,
    stylePrompt,
    subjectPrompt,
    seed,
    isLoading,
    setModelUrl, 
    setIsLoading,
    setStylePrompt,
    setSubjectPrompt,
    setGeneratedTextures,
    setModelId,
    setReferenceImageUrl,
    setReferenceImageName,
    setModelFileName,
    setSeed,
    toggleGallery,
  } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Store the current generation ID for tracking
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  
  // Generation-specific polling system
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isLoading && currentGenerationId) {
      console.log(`Polling: Starting check for generation ${currentGenerationId}`);
      
      let pollCount = 0;
      pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          // Check specifically for the current generation
          const { data: generation, error } = await supabase
            .from('generations')
            .select('*')
            .eq('id', currentGenerationId)
            .single();
          
          if (!error && generation && generation.status === 'completed') {
            console.log(`Polling: Current generation ${currentGenerationId} completed!`);
            
            const textureData = {
              diffuse: generation.diffuse_storage_path,
              normal: generation.normal_storage_path,
              height: generation.height_storage_path,
              thumbnail: generation.thumbnail_storage_path
            };
            
            setGeneratedTextures(textureData);
            setIsLoading(false);
            setCurrentGenerationId(null);
            toast.success("🎉 Textures generated successfully! (auto-detected)");
            clearInterval(pollInterval);
          }
          
          // Show progress every minute
          if (pollCount % 4 === 0) { // Every 4 polls = 1 minute
            const minutes = Math.floor(pollCount / 4);
            console.log(`Polling: Generation ${currentGenerationId} in progress... ${minutes} minute(s) elapsed`);
            if (minutes > 0 && minutes % 5 === 0) { // Every 5 minutes
              toast.info(`Generation in progress... ${minutes} minutes elapsed`);
            }
          }
          
          // Safety timeout after 45 minutes
          if (pollCount >= 180) { // 180 * 15 seconds = 45 minutes
            console.log(`Polling: Generation ${currentGenerationId} timeout after 45 minutes`);
            toast.error("Generation timeout after 45 minutes. Check ComfyUI status or try 'Check Latest Generation'");
            setIsLoading(false);
            setCurrentGenerationId(null);
            clearInterval(pollInterval);
          }
          
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 15000); // Check every 15 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isLoading, currentGenerationId, supabase, setGeneratedTextures, setIsLoading]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      if (result.success && result.publicUrl) {
        setModelUrl(result.publicUrl);
        setModelId(result.modelId);
        setModelFileName(result.comfyFileName);
        toast.success("Model uploaded successfully!");
      } else {
        throw new Error(result.error || 'File upload failed');
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload model.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const result = await response.json();
      if (result.success && result.publicUrl) {
        setReferenceImageUrl(result.publicUrl);
        setReferenceImageName(result.comfyFileName);
        toast.success("Reference image uploaded!");
      } else {
        throw new Error(result.error || 'Image upload failed');
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!modelUrl || !modelId || !modelFileName) {
      toast.error("Please upload a model first.");
      return;
    }
    if (!referenceImageName) {
      toast.error("Please upload a reference image first.");
      return;
    }

    setIsLoading(true);
    toast.info("Starting texture generation...");
    
    try {
      // 1. Start the generation
      const startResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelFileName,
          modelId,
          referenceImageUrl,
          referenceImageName,
          stylePrompt,
          subjectPrompt,
          seed,
        }),
      });

      const startResult = await startResponse.json();
      if (!startResult.success) {
        throw new Error(startResult.error || 'Failed to start generation.');
      }
      const { generationId } = startResult;

      // 2. Set the current generation ID and start polling
      setCurrentGenerationId(generationId);
      toast.info("Generation started! Automatic detection every 15 seconds.");
      console.log(`Generation: Started generation ${generationId} - specific polling active`);

    } catch (error: any) {
      console.error("Error starting generation:", error);
      toast.error(error.message || "Failed to generate textures.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      <div className="space-y-2">
        <label htmlFor="model-upload" className="block text-sm font-medium text-gray-700">
          Upload 3D Model (.glb)
        </label>
        <Input id="model-upload" type="file" accept=".glb" onChange={handleFileChange} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <label htmlFor="reference-image-upload" className="block text-sm font-medium text-gray-700">
          Upload Reference Image
        </label>
        <Input id="reference-image-upload" type="file" accept="image/*" onChange={handleReferenceImageChange} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <label htmlFor="style-prompt" className="block text-sm font-medium text-gray-700">
          Style Prompt
        </label>
        <textarea
          id="style-prompt"
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
          placeholder="e.g., ultra-realistic photography, high-resolution detail..."
          rows={3}
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject-prompt" className="block text-sm font-medium text-gray-700">
          Subject Prompt
        </label>
        <textarea
          id="subject-prompt"
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
          placeholder="e.g., brown bomber jacket, displayed front-facing..."
          rows={3}
          value={subjectPrompt}
          onChange={(e) => setSubjectPrompt(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="seed" className="block text-sm font-medium text-gray-700">
          Seed
        </label>
        <div className="flex items-center gap-2">
          <Input 
            id="seed" 
            type="number" 
            value={seed} 
            onChange={(e) => setSeed(parseInt(e.target.value, 10))}
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
            disabled={isLoading}
          >
            <Dices className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button className="w-full" onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Generate Textures'}
      </Button>
      
      {isLoading && (
        <Button variant="outline" className="w-full" onClick={() => {
          setIsLoading(false);
          toast.info("Generation cancelled - you can start a new one");
        }}>
          Cancel Generation
        </Button>
      )}
      
      <Button variant="outline" className="w-full" onClick={async () => {
        try {
          // Find the latest completed generation dynamically
          const { data: generations, error } = await supabase
            .from('generations')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error || !generations || generations.length === 0) {
            toast.info("No completed generations found");
            return;
          }
          
          const latest = generations[0];
          console.log("Latest completed generation:", latest);
          
          const textureData = {
            diffuse: latest.diffuse_storage_path,
            normal: latest.normal_storage_path,
            height: latest.height_storage_path,
            thumbnail: latest.thumbnail_storage_path
          };
          
          console.log("Setting textures:", textureData);
          setGeneratedTextures(textureData);
          setIsLoading(false);
          toast.success(`Loaded: ${latest.subject_prompt || 'Latest generation'}`);
          
        } catch (error: any) {
          console.error("Error checking latest generation:", error);
          toast.error("Failed to check latest generation");
        }
      }}>
        Check Latest Generation
      </Button>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        Sign Out
      </Button>

      <Button variant="outline" className="w-full flex items-center gap-2" onClick={toggleGallery}>
        <Library className="h-4 w-4" />
        Toggle Gallery
      </Button>
      
      {/* App Title */}
      <div className="border-t pt-4 mt-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">AUTOMATA</h1>
        <p className="text-xs text-gray-500">AI-Powered Texture Generation</p>
      </div>
    </div>
  );
}
