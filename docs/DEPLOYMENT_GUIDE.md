# AUTOMATA Deployment Guide

## Production Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase project configured
- ComfyUI instance accessible via public URL

### Step 1: Prepare Repository

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial AUTOMATA commit"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/automata.git
git branch -M main
git push -u origin main
```

### Step 2: Configure Environment Variables

Create these environment variables in your Vercel project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ComfyUI Configuration (Production)
COMFYUI_API_URL=https://your-comfyui-server.com
NEXT_PUBLIC_COMFYUI_API_URL=https://your-comfyui-server.com

# Security
COMFYUI_WEBHOOK_SECRET=your_production_webhook_secret

# Application URLs
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Step 3: Deploy to Vercel

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables:**
   - Copy all variables from your `.env.local`
   - Update URLs to production values

4. **Deploy:**
   - Click "Deploy"
   - Wait for build completion

### Step 4: Configure Production ComfyUI

Update your ComfyUI WebhookNode configuration:

```python
# In your ComfyUI environment
export COMFYUI_BASE_URL="https://your-comfyui-server.com"
export COMFYUI_WEBHOOK_SECRET="your_production_webhook_secret"
```

Update the WebhookNode default webhook URL:
```python
"webhook_url": ("STRING", {"default": "https://your-app-name.vercel.app/api/webhook/comfyui"})
```

### Step 5: Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Allow webhook uploads" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (true);

-- Create database webhook (optional)
-- Configure in Supabase Dashboard → Database → Webhooks
-- URL: https://your-app-name.vercel.app/api/webhook/generation-completed
```

## Development vs Production

### Development Environment
- **ComfyUI:** `http://localhost:8188`
- **Database:** Supabase cloud
- **Storage:** Supabase Storage with localhost ComfyUI fallback
- **Webhooks:** Local webhook endpoints
- **Authentication:** Supabase Auth

### Production Environment
- **ComfyUI:** Public HTTPS endpoint
- **Database:** Supabase cloud (same instance)
- **Storage:** Supabase Storage with CDN
- **Webhooks:** Vercel serverless functions
- **Authentication:** Supabase Auth (same instance)

## Performance Optimization

### Vercel Optimizations
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
  compress: true,
};
```

### Database Optimizations
```sql
-- Add indexes for better query performance
CREATE INDEX idx_generations_user_status ON generations(user_id, status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_models_user_id ON models(user_id);
```

## Monitoring & Analytics

### Error Tracking
```bash
# Add to package.json
npm install @sentry/nextjs

# Configure in next.config.mjs
const { withSentryConfig } = require('@sentry/nextjs');
```

### Performance Monitoring
```bash
# Add Vercel Analytics
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
```

## Security Considerations

### Production Security Checklist
- [ ] **Environment Variables:** All secrets in Vercel environment
- [ ] **Webhook Secrets:** Unique production webhook secrets
- [ ] **HTTPS Only:** Force HTTPS in production
- [ ] **CORS Configuration:** Proper CORS headers
- [ ] **Rate Limiting:** API route protection
- [ ] **Input Validation:** Comprehensive input sanitization

### Storage Security
- [ ] **Bucket Policies:** Proper RLS policies
- [ ] **File Validation:** Type and size restrictions
- [ ] **CDN Security:** Proper cache headers
- [ ] **Access Control:** User-based file access

## Troubleshooting

### Common Deployment Issues

**1. Environment Variables Not Loading**
```bash
# Check Vercel environment variables
vercel env ls

# Test environment in development
vercel dev
```

**2. ComfyUI Connection Issues**
```bash
# Test ComfyUI connectivity
curl https://your-comfyui-server.com/system_stats

# Check webhook endpoint
curl -X POST https://your-app.vercel.app/api/webhook/comfyui
```

**3. Database Connection Issues**
```bash
# Test Supabase connection
npx supabase status

# Check database policies
# Go to Supabase Dashboard → Authentication → Policies
```

### Performance Issues

**1. Slow Texture Loading**
- Check CDN cache headers
- Optimize image formats
- Use Next.js Image optimization

**2. High Database Usage**
- Add database indexes
- Optimize query patterns
- Implement connection pooling

**3. Memory Issues**
- Monitor Vercel function memory usage
- Optimize texture processing
- Implement streaming for large files

## Maintenance

### Regular Tasks
- **Monitor Error Rates:** Check Vercel Analytics
- **Database Cleanup:** Archive old generations
- **Storage Cleanup:** Remove unused files
- **Security Updates:** Keep dependencies updated

### Backup Strategy
- **Database Backups:** Supabase automatic backups
- **Storage Backups:** Supabase Storage replication
- **Code Backups:** GitHub repository
- **Configuration Backups:** Environment variable documentation

## Scaling Considerations

### Traffic Scaling
- **Vercel Edge Functions:** Global distribution
- **Database Scaling:** Supabase auto-scaling
- **Storage Scaling:** Unlimited Supabase Storage
- **ComfyUI Scaling:** Load balancer for multiple instances

### Feature Scaling
- **Multi-Model Support:** Additional file format handlers
- **Batch Processing:** Queue management system
- **Real-Time Features:** WebSocket integration
- **Analytics:** Advanced usage tracking

## Cost Optimization

### Vercel Costs
- **Function Duration:** Optimize webhook processing time
- **Bandwidth Usage:** Implement proper caching
- **Build Minutes:** Optimize build process

### Supabase Costs
- **Database Usage:** Optimize queries and indexes
- **Storage Usage:** Implement cleanup policies
- **Bandwidth Usage:** CDN optimization

### ComfyUI Costs
- **GPU Usage:** Optimize generation parameters
- **Processing Time:** Workflow optimization
- **Resource Management:** Auto-scaling policies
