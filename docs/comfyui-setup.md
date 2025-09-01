# ComfyUI Setup for AUTOMATA Integration

This document describes how to set up ComfyUI to work with the AUTOMATA texture generation system.

## Prerequisites

- ComfyUI installed and running
- Python environment with required packages
- Network access between ComfyUI and the AUTOMATA web application

## Installation Steps

### 1. Install the WebhookNode

Copy the `WebhookNode.py` file from the AUTOMATA project root to your ComfyUI custom nodes directory:

```bash
# Windows
copy WebhookNode.py "C:\ComfyUI_Windows_portable_cu126\ComfyUI_Windows_portable\ComfyUI\custom_nodes\"

# Linux/Mac
cp WebhookNode.py /path/to/ComfyUI/custom_nodes/
```

**Important:** The WebhookNode.py file must be placed directly in the custom_nodes directory, not in a subfolder.

### 2. Install Python Dependencies

The WebhookNode requires additional Python packages. Install them in your ComfyUI environment:

```bash
# If using conda/virtual environment, activate it first
conda activate comfyui  # or your environment name

# Install required packages
pip install requests pillow numpy torch
```

### 3. Environment Configuration

Set the following environment variables for your ComfyUI instance:

```bash
# Base URL where ComfyUI is accessible (used for image URLs)
export COMFYUI_BASE_URL="http://localhost:8188"

# Optional: Set webhook secret for security (should match AUTOMATA config)
export COMFYUI_WEBHOOK_SECRET="your-secret-key-here"
```

### 4. Restart ComfyUI

Restart your ComfyUI instance to load the new custom node:

```bash
python main.py
```

### 5. Verify Installation

1. Open ComfyUI in your browser
2. Look for the "AUTOMATA" category in the node menu
3. You should see a "Send to Webhook" node available

## AUTOMATA Configuration

On the AUTOMATA side, configure these environment variables:

```bash
# ComfyUI API endpoints
COMFYUI_API_URL="http://localhost:8188"
COMFYUI_WS_URL="ws://localhost:8188/ws"

# Webhook security (should match ComfyUI setting)
COMFYUI_WEBHOOK_SECRET="your-secret-key-here"

# Base URL for webhook callbacks (where AUTOMATA is running)
NEXTAUTH_URL="http://localhost:3000"
```

## Network Configuration

Ensure that:

1. **ComfyUI → AUTOMATA**: ComfyUI can reach the AUTOMATA webhook endpoint
   - Default: `http://localhost:3000/api/webhook/comfyui`
   
2. **AUTOMATA → ComfyUI**: AUTOMATA can reach ComfyUI API endpoints
   - API: `http://localhost:8188`
   - WebSocket: `ws://localhost:8188/ws`

3. **Client → ComfyUI**: Users can access generated images
   - Images served at: `http://localhost:8188/view?filename=...`

## Troubleshooting

### WebhookNode Not Appearing

1. Check that `WebhookNode.py` is in the `custom_nodes` directory
2. Verify Python dependencies are installed
3. Check ComfyUI console for import errors
4. Restart ComfyUI completely

### Webhook Calls Failing

1. Check network connectivity between ComfyUI and AUTOMATA
2. Verify webhook URL is accessible from ComfyUI
3. Check webhook secret configuration
4. Monitor AUTOMATA logs for webhook errors

### Image URLs Not Working

1. Verify `COMFYUI_BASE_URL` environment variable
2. Check that ComfyUI is serving images at `/view` endpoint
3. Ensure generated images are saved to the output directory
4. Check file permissions on the output directory

### Generation Timeout

1. Monitor ComfyUI console for execution errors
2. Check workflow complexity and available GPU memory
3. Verify all required models and checkpoints are available
4. Consider increasing webhook timeout in the node

## Workflow Integration

The AUTOMATA system automatically adds a WebhookNode to your workflow with these connections:

- **diffuse**: Connected to node 104 (CV2 Inpaint Texture output)
- **normal**: Connected to node 373 (Normal Map output) 
- **height**: Connected to node 454 (Deep Bump height output)
- **thumbnail**: Connected to node 181 (Front view render)

The webhook node will:
1. Convert tensor outputs to PNG images
2. Save images to ComfyUI output directory
3. Generate accessible URLs
4. Send webhook notification to AUTOMATA

## Security Considerations

1. **Webhook Secret**: Always set a webhook secret in production
2. **Network Isolation**: Consider running ComfyUI in a private network
3. **Access Control**: Restrict access to ComfyUI endpoints
4. **File Cleanup**: Implement cleanup for generated images to prevent disk space issues

## Performance Optimization

1. **GPU Memory**: Ensure adequate GPU memory for the workflow
2. **Concurrent Generations**: Limit concurrent generations to prevent resource exhaustion
3. **Image Cleanup**: Implement automated cleanup of old generated images
4. **Caching**: Consider caching frequently used models and checkpoints
