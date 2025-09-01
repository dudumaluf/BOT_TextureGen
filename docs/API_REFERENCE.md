# AUTOMATA API Reference

## Overview

AUTOMATA provides a RESTful API for texture generation, file management, and user operations. All endpoints require authentication unless otherwise specified.

## Authentication

All API routes use Supabase Auth for authentication:

```typescript
// Client-side authentication check
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}

// Server-side authentication (API routes)
const supabase = createServer();
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
```

## Core API Endpoints

### POST /api/generate

Starts a new texture generation process.

**Request Body:**
```typescript
{
  modelFileName: string;      // ComfyUI filename for the 3D model
  modelId: string;           // Database ID of the model
  referenceImageUrl: string; // Public URL of reference image
  referenceImageName: string; // ComfyUI filename for reference image
  stylePrompt: string;       // AI style description
  subjectPrompt: string;     // AI subject description
  seed: number;              // Random seed for generation
}
```

**Response:**
```typescript
{
  success: boolean;
  generationId: string;      // ID for tracking generation status
  message?: string;
}
```

**Example:**
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelFileName: 'jacket.glb',
    modelId: 'uuid-here',
    referenceImageUrl: 'https://...',
    referenceImageName: 'reference.png',
    stylePrompt: 'ultra-realistic photography',
    subjectPrompt: 'brown leather jacket',
    seed: 12345
  })
});
```

### GET /api/generations/[id]

Retrieves the status and results of a specific generation.

**Parameters:**
- `id`: Generation UUID

**Response:**
```typescript
{
  success: boolean;
  generation: {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    created_at: string;
    user_id: string;
    model_id: string;
    style_prompt: string;
    subject_prompt: string;
    seed: number;
    reference_image_path: string;
    diffuse_storage_path?: string;
    normal_storage_path?: string;
    height_storage_path?: string;
    thumbnail_storage_path?: string;
    error_message?: string;
  };
}
```

### POST /api/upload-model

Uploads a 3D model file for texture generation.

**Request:** FormData with file

**Response:**
```typescript
{
  success: boolean;
  publicUrl: string;         // Supabase Storage public URL
  modelId: string;          // Database record ID
  comfyFileName: string;    // ComfyUI filename for workflows
}
```

**Example:**
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload-model', {
  method: 'POST',
  body: formData
});
```

### POST /api/upload-image

Uploads a reference image for style conditioning.

**Request:** FormData with image file

**Response:**
```typescript
{
  success: boolean;
  publicUrl: string;         // Supabase Storage public URL
  comfyFileName: string;    // ComfyUI filename for workflows
}
```

## Webhook Endpoints

### POST /api/webhook/comfyui

Receives completion notifications from ComfyUI WebhookNode.

**Headers:**
```
Content-Type: application/json
X-Webhook-Secret: your_webhook_secret (optional)
```

**Request Body:**
```typescript
{
  generationId: string;
  textures: {
    diffuse?: string;     // ComfyUI texture URL
    normal?: string;      // ComfyUI texture URL
    height?: string;      // ComfyUI texture URL
    thumbnail?: string;   // ComfyUI texture URL
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### POST /api/webhook/generation-completed

Receives database change notifications from Supabase.

**Request Body:**
```typescript
{
  record: {
    id: string;
    status: string;
    user_id: string;
    // ... other generation fields
  };
  old_record: {
    status: string;
    // ... previous values
  };
}
```

## Database Schema

### Models Table
```sql
CREATE TABLE public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    storage_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
```

### Generations Table
```sql
CREATE TABLE public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    status generation_status DEFAULT 'processing',
    subject_prompt TEXT,
    style_prompt TEXT,
    seed BIGINT,
    reference_image_path TEXT,
    diffuse_storage_path TEXT,
    normal_storage_path TEXT,
    height_storage_path TEXT,
    thumbnail_storage_path TEXT,
    comfyui_prompt_id TEXT,
    error_message TEXT
);
```

### Generation Status Enum
```sql
CREATE TYPE public.generation_status AS ENUM ('processing', 'completed', 'failed');
```

## Storage Buckets

### Models Bucket
- **Name:** `models`
- **Access:** Private (user-specific)
- **File Types:** .glb, .fbx (3D models)
- **Max Size:** 50MB per file

### Reference Images Bucket
- **Name:** `reference-images`
- **Access:** Private (user-specific)
- **File Types:** .png, .jpg, .jpeg, .webp
- **Max Size:** 10MB per file

### Generated Textures Bucket
- **Name:** `generated_textures`
- **Access:** Public read, authenticated write
- **File Types:** .png (generated textures)
- **Max Size:** 20MB per file

## Error Codes

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing parameters, invalid file format |
| 401 | Unauthorized | Not authenticated, invalid session |
| 403 | Forbidden | RLS policy violation, insufficient permissions |
| 404 | Not Found | Generation not found, file not found |
| 500 | Internal Server Error | ComfyUI connection failed, database error |

### Custom Error Messages

```typescript
// Generation errors
"Missing required parameters"
"Not authenticated"
"Failed to start generation"
"Generation timeout"
"ComfyUI connection failed"

// File upload errors
"No file provided"
"Invalid file format"
"File too large"
"Upload failed"

// Webhook errors
"Invalid webhook payload"
"Generation not found"
"Webhook authentication failed"
```

## Rate Limiting

### Current Limits
- **File Uploads:** 10 files per minute per user
- **Generation Requests:** 3 generations per hour per user
- **API Calls:** 100 requests per minute per user

### Implementation
```typescript
// Example rate limiting middleware
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later'
};
```

## Webhook Development

### Testing Webhooks Locally

```bash
# Use ngrok to expose local development server
npx ngrok http 3000

# Update ComfyUI webhook URL to ngrok URL
# Test webhook with curl
curl -X POST https://your-ngrok-url.ngrok.io/api/webhook/comfyui \
  -H "Content-Type: application/json" \
  -d '{"generationId":"test","textures":{"diffuse":"http://test.com/image.png"}}'
```

### Webhook Security

```typescript
// Webhook secret validation
import crypto from 'crypto';

export function validateWebhookSecret(providedSecret: string): boolean {
  const expectedSecret = process.env.COMFYUI_WEBHOOK_SECRET;
  if (!expectedSecret) return true; // Development mode
  
  return crypto.timingSafeEqual(
    Buffer.from(providedSecret || ''),
    Buffer.from(expectedSecret)
  );
}
```

## Integration Examples

### Frontend Integration

```typescript
// Start generation
const startGeneration = async (params: GenerationParams) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
};

// Check generation status
const checkGeneration = async (id: string) => {
  const response = await fetch(`/api/generations/${id}`);
  return response.json();
};
```

### ComfyUI Integration

```python
# WebhookNode usage in ComfyUI workflow
webhook_node = {
  "inputs": {
    "webhook_url": "https://your-app.vercel.app/api/webhook/comfyui",
    "generationId": generation_id,
    "webhook_secret": webhook_secret,
    "diffuse": ["texture_node", 0],
    "normal": ["normal_node", 0],
    "height": ["height_node", 0],
    "thumbnail": ["preview_node", 0]
  },
  "class_type": "WebhookNode"
}
```

## Performance Monitoring

### Key Metrics to Track
- **Generation Success Rate** - Percentage of successful completions
- **Average Generation Time** - Time from start to completion
- **Webhook Delivery Rate** - Percentage of successful webhook calls
- **User Engagement** - Generations per user, session duration
- **Error Rates** - Failed generations, API errors, webhook failures

### Monitoring Implementation
```typescript
// Example analytics tracking
const trackGeneration = async (generationId: string, status: string) => {
  await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'generation_status_change',
      generationId,
      status,
      timestamp: new Date().toISOString()
    })
  });
};
```
