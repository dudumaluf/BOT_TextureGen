# TextureGen Complete Deployment Guide

## 🎯 Live Application

**✅ Production Ready:** [https://bot-texturegen.vercel.app](https://bot-texturegen.vercel.app)

## 🏗️ Deployment Options

### **🌉 Hybrid (Recommended - Currently Working)**
- **App**: Vercel (global access)
- **AI**: Local ComfyUI + Cloudflare Tunnel (free)
- **Benefits**: Global access + local GPU power + zero cost

### **🏠 Local Development**
- **App**: Local Next.js server
- **AI**: Local ComfyUI
- **Benefits**: Complete control, no external dependencies

### **☁️ Full Cloud**
- **App**: Vercel
- **AI**: Cloud ComfyUI instance
- **Benefits**: Scalable, no local dependencies

## 🚀 Current Working Setup (Hybrid)

### **Quick Start After PC Restart**

#### **Step 1: Start ComfyUI**
```bash
cd C:\ComfyUI_Windows_portable_cu126\ComfyUI_Windows_portable\ComfyUI
python main.py --enable-cors-header --listen 0.0.0.0 --port 8188
```

#### **Step 2: Start Tunnel**
```bash
# New terminal
cloudflared tunnel --url localhost:8188
# Copy the HTTPS URL (changes each restart)
```

#### **Step 3: Update Vercel**
1. Go to [Vercel Environment Variables](https://vercel.com/dashboard)
2. Update both:
   - `COMFYUI_API_URL` → new tunnel URL
   - `NEXT_PUBLIC_COMFYUI_API_URL` → new tunnel URL
3. Redeploy

#### **Step 4: Update WebhookNode**
```bash
# Edit WebhookNode.py line 135 with new tunnel URL
copy WebhookNode.py "C:\ComfyUI_Windows_portable_cu126\ComfyUI_Windows_portable\ComfyUI\custom_nodes\WebhookNode.py"
# Restart ComfyUI
```

### **Environment Variables (Current Working)**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bnstnamdtlveluavjkcy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key]

# ComfyUI Tunnel (update with current tunnel URL)
COMFYUI_API_URL=https://your-tunnel.trycloudflare.com
NEXT_PUBLIC_COMFYUI_API_URL=https://your-tunnel.trycloudflare.com

# App Config
COMFYUI_WEBHOOK_SECRET=54321
NEXTAUTH_URL=https://bot-texturegen.vercel.app
```

## 🔧 Technical Details

### **Architecture**
```
User → Vercel App → Cloudflare Tunnel → Local ComfyUI → RTX 4090
```

### **File Locations**
- **WebhookNode**: `C:\ComfyUI_Windows_portable_cu126\ComfyUI_Windows_portable\ComfyUI\custom_nodes\WebhookNode.py`
- **Project**: `C:\Users\O2\Documents\BotApps\Automata`

### **Required Processes**
- **Terminal 1**: ComfyUI server
- **Terminal 2**: Cloudflare tunnel
- **Keep both running** for production access

## 🚨 Troubleshooting

### **Upload Fails (500 Error)**
- Check both terminals running
- Verify tunnel URL updated in Vercel
- Redeploy Vercel app

### **Images Don't Load (Mixed Content)**
- Update WebhookNode.py with tunnel URL
- Restart ComfyUI
- Test generation again

### **Slow Generation**
- Restart PC to clear GPU memory
- Close unnecessary applications
- Monitor GPU usage

## 🎉 Success Verification

**✅ Working when:**
- Upload succeeds without errors
- Generation completes in normal time
- Textures display properly
- No localhost:8188 errors in browser

---

**🏆 Your TextureGen is production-ready with hybrid architecture!**
