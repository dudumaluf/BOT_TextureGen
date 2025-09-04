import requests
import os
import json
from PIL import Image
import numpy as np
import torch
import uuid

# Import ComfyUI server - handle potential import issues
try:
    import server
except ImportError:
    print("AUTOMATA: Warning - Could not import server module, some features may not work")
    server = None

class WebhookNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "webhook_url": ("STRING", {"default": "http://localhost:3000/api/webhook/comfyui"}),
                "generationId": ("STRING", {"default": ""}),
                "webhook_secret": ("STRING", {"default": ""}),
            },
            "optional": {
                "diffuse": ("IMAGE",),
                "normal": ("IMAGE",),
                "height": ("IMAGE",),
                "thumbnail": ("IMAGE",),
                "depth_preview": ("IMAGE",),
                "front_preview": ("IMAGE",),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "send_webhook"
    OUTPUT_NODE = True
    CATEGORY = "AUTOMATA"

    def tensor_to_image_url(self, tensor, texture_type, generation_id):
        """Convert tensor to saved image and return URL"""
        try:
            # Convert tensor to PIL Image
            if tensor.dim() == 4:  # Batch dimension
                tensor = tensor.squeeze(0)  # Remove batch dimension
            
            # Convert from [H, W, C] to [C, H, W] if needed and ensure proper format
            if tensor.dim() == 3 and tensor.shape[2] in [1, 3, 4]:
                tensor = tensor.permute(2, 0, 1)
            
            # Ensure tensor is in [0, 1] range
            if tensor.max() > 1.0:
                tensor = tensor / 255.0
            
            # Convert to numpy and then PIL
            numpy_image = tensor.cpu().numpy()
            if numpy_image.shape[0] == 1:  # Grayscale
                numpy_image = numpy_image.squeeze(0)
                pil_image = Image.fromarray((numpy_image * 255).astype(np.uint8), 'L')
            else:  # RGB
                numpy_image = numpy_image.transpose(1, 2, 0)
                pil_image = Image.fromarray((numpy_image * 255).astype(np.uint8), 'RGB')
            
            # Generate filename
            filename = f"automata_{generation_id}_{texture_type}_{uuid.uuid4().hex[:8]}.png"
            
            # Save to ComfyUI output directory
            import os
            
            # Get the proper output directory
            try:
                import folder_paths
                output_dir = folder_paths.get_output_directory()
                print(f"AUTOMATA: Using folder_paths output directory: {output_dir}")
            except Exception as e:
                print(f"AUTOMATA: Could not get folder_paths directory: {e}")
                # Fallback to manual path
                output_dir = os.path.join(os.getcwd(), "output")
                print(f"AUTOMATA: Using fallback output directory: {output_dir}")
            
            # Ensure output_dir exists
            output_dir = str(output_dir)
            if not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
                print(f"AUTOMATA: Created output directory: {output_dir}")
            
            filepath = os.path.join(output_dir, filename)
            print(f"AUTOMATA: Attempting to save to: {filepath}")
            
            # Save the image
            pil_image.save(filepath, "PNG")
            
            # Verify the file was saved
            if os.path.exists(filepath):
                file_size = os.path.getsize(filepath)
                print(f"AUTOMATA: Successfully saved {texture_type} texture: {filepath} ({file_size} bytes)")
            else:
                print(f"AUTOMATA: ERROR - File was not saved: {filepath}")
                return None
            
            # Return the URL path that ComfyUI serves
            # Check if file was saved in a subfolder
            relative_path = os.path.relpath(filepath, output_dir)
            subfolder = os.path.dirname(relative_path)
            actual_filename = os.path.basename(relative_path)
            
            if subfolder and subfolder != '.':
                # File is in a subfolder
                subfolder_encoded = subfolder.replace('\\', '/')  # Convert Windows paths to URL format
                return f"/view?filename={actual_filename}&subfolder={subfolder_encoded}&type=output"
            else:
                # File is in root output directory
                return f"/view?filename={actual_filename}&subfolder=&type=output"
            
        except Exception as e:
            print(f"AUTOMATA: Error saving {texture_type} texture: {e}")
            return None



    def send_webhook(self, webhook_url, generationId, webhook_secret="", **kwargs):
        if not webhook_url or not generationId:
            print("AUTOMATA: ERROR - Missing webhook_url or generationId")
            return ()
        
        textures = {}
        
        # Process each texture type (expecting tensor inputs)
        for key, tensor in kwargs.items():
            if tensor is not None and len(tensor) > 0:
                print(f"AUTOMATA: Processing {key} tensor: {type(tensor)}")
                
                # Convert tensor to image URL
                image_url = self.tensor_to_image_url(tensor, key, generationId)
                if image_url:
                    # Use tunnel URL if available, fallback to localhost
                    base_url = os.getenv('COMFYUI_BASE_URL', 'https://employ-predictions-wednesday-trust.trycloudflare.com')
                    textures[key] = f"{base_url}{image_url}"
                    print(f"AUTOMATA: Saved {key} texture: {textures[key]}")

        if not textures:
            print("AUTOMATA: WARNING - No valid textures to send")
            return ()

        payload = {
            "generationId": generationId,
            "textures": textures
        }

        headers = {'Content-Type': 'application/json'}
        if webhook_secret:
            headers['X-Webhook-Secret'] = webhook_secret

        try:
            response = requests.post(webhook_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            print(f"AUTOMATA: Successfully sent webhook for generation {generationId}")
            print(f"AUTOMATA: Textures sent: {list(textures.keys())}")
        except requests.exceptions.RequestException as e:
            print(f"AUTOMATA: ERROR - Failed to send webhook for generation {generationId}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"AUTOMATA: Response status: {e.response.status_code}")
                print(f"AUTOMATA: Response body: {e.response.text}")

        return ()

NODE_CLASS_MAPPINGS = {
    "WebhookNode": WebhookNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WebhookNode": "Send to Webhook"
}
