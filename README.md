# 🎨 Nudge - Creative Inspiration System

A comprehensive system for AI-powered design inspiration, combining a Chrome extension, web application, and Supabase backend.

## 🔐 Security First!

**⚠️ IMPORTANT: This project contains sensitive API keys. Follow the security setup before pushing to Git!**

## 📁 Project Structure

```
nudge/
├── creative-assistant-extension/  # Chrome extension
├── webapp/                        # Team web application
├── supabase/                      # Backend functions & database
├── sample_projects.sql           # Sample data
└── README.md                     # This file
```

## 🚀 Quick Setup

### 1. 🔒 Security Setup (REQUIRED FIRST STEP)

**For Web App:**
```bash
cd webapp
chmod +x setup.sh
./setup.sh
```

**For Supabase Functions:**
```bash
cd supabase
chmod +x setup-security.sh
./setup-security.sh
```

**For Chrome Extension:**
```bash
cd creative-assistant-extension
chmod +x setup-security.sh
./setup-security.sh
```

### 2. 🔑 Configure Environment Variables

**Web App (`webapp/config.js`):**
```javascript
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Supabase Functions (`.env`):**
```bash
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Chrome Extension (`creative-assistant-extension/config.js`):**
```javascript
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. 🚀 Deploy

**Web App:** Deploy to Netlify, Vercel, or GitHub Pages
**Supabase Functions:** Use Supabase CLI or dashboard

## 🔒 Security Features

- ✅ **API Keys Protected**: All sensitive data in `.gitignore`
- ✅ **Environment Variables**: Secure configuration management
- ✅ **Template System**: Safe templates for team members
- ✅ **Automatic Validation**: Functions validate configuration on startup
- ✅ **Team Safe**: New members can set up securely

## 📚 Documentation

- **Web App**: See `webapp/README.md`
- **Supabase Functions**: See `supabase/README-SECURITY.md`
- **Chrome Extension**: See `creative-assistant-extension/`

## 🎯 Features

- **Chrome Extension**: Screenshot-based inspiration generation
- **Web App**: Team project and asset management
- **AI Analysis**: OpenAI-powered metadata extraction
- **Vector Search**: Semantic similarity search
- **Image Generation**: DALL-E 3 integration
- **Team Collaboration**: Multi-user project management

## 🔄 Team Workflow

1. **Designers** upload inspiration via web app
2. **Project Managers** create briefs via web app
3. **AI System** generates embeddings and metadata
4. **Chrome Extension** provides inspiration to users

## 🚨 Before Pushing to Git

Verify security setup:
- ✅ `.env` files are in `.gitignore`
- ✅ `config.js` is in `.gitignore`
- ✅ No API keys in committed files
- ✅ Security setup scripts have been run

## 📞 Support

For issues:
1. Check function logs in Supabase dashboard
2. Review browser console for web app errors
3. Verify environment variable configuration
4. Test locally before deploying

---

**Ready to create amazing design inspiration!** 🚀✨

Your system is now secure and ready for team collaboration.
