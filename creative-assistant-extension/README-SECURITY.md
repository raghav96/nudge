# 🔐 Chrome Extension Security Guide

This guide explains how to securely configure your Chrome extension with Supabase credentials.

## 🚨 Security First!

**⚠️ IMPORTANT: Never commit API keys or sensitive data to Git!**

Your Chrome extension contains sensitive information:
- Supabase project URL
- Supabase anon key
- API endpoints

## 🔧 Quick Security Setup

### 1. Run the Security Setup Script

```bash
cd creative-assistant-extension
chmod +x setup-security.sh
./setup-security.sh
```

This will:
- ✅ Create `config.js` file with your Supabase credentials
- ✅ Add `config.js` to `.gitignore` (prevents Git commits)
- ✅ Create `env.template` for team members
- ✅ Set up proper security structure

### 2. Configure Your Supabase Credentials

Edit the `config.js` file with your actual values:

```javascript
window.SUPABASE_URL = 'https://your-actual-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-actual-anon-key-here';
```

### 3. Test Your Extension

1. Load the extension in Chrome (`chrome://extensions/`)
2. Open the side panel
3. Verify it connects to your Supabase backend

## 🔒 What's Protected

### ✅ **Safe to Commit:**
- `env.template` - Template showing what needs configuration
- `sidepanel.js` - Extension logic (no sensitive data)
- `manifest.json` - Extension manifest
- `sidepanel.html` - Extension interface
- `README-SECURITY.md` - This security guide
- `setup-security.sh` - Security setup script

### ❌ **Never Commit:**
- `config.js` - Contains your actual Supabase credentials
- `.env` - Any environment files
- Build artifacts (`.crx`, `.zip`, etc.)

## 🌍 Configuration in Chrome Extensions

### **Local Development:**
- Use `config.js` file for configuration
- Load extension in Chrome with "Load unpacked"
- Test functionality locally

### **Production Distribution:**
- Package extension with `config.js` included
- Distribute to team members securely
- Each team member can have their own `config.js`

### **Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://...supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |

## 🚀 Extension Workflow

### **1. Development:**
```bash
# Set up security
./setup-security.sh

# Edit config.js with your credentials
# Load extension in Chrome
# Test functionality
```

### **2. Team Distribution:**
1. **You** run `./setup-security.sh` and add your credentials
2. **Push to Git** - Only safe files are committed
3. **Team members** copy `env.template` to `config.js`
4. **Team members** add their own Supabase credentials
5. **Everyone** can load and use the extension

### **3. Production Use:**
- Extension automatically loads configuration from `config.js`
- Connects to Supabase backend using configured credentials
- Provides AI-powered design inspiration

## 🔍 Security Validation

Your extension now includes automatic validation:

```javascript
// Configuration is validated on extension load
const SUPABASE_CONFIG = (() => {
    if (typeof window.SUPABASE_URL !== 'undefined' && 
        typeof window.SUPABASE_ANON_KEY !== 'undefined') {
        return {
            url: window.SUPABASE_URL,
            anonKey: window.SUPABASE_ANON_KEY
        };
    }
    
    // Show configuration error if missing
    return {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    };
})();

// Constructor validates configuration
constructor() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
        SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        this.showConfigurationError();
        return;
    }
    // ... rest of initialization
}
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Configuration Error" message**
   - Check `config.js` exists and has correct values
   - Verify `config.js` is loaded before `sidepanel.js`
   - Ensure no typos in variable names

2. **Extension doesn't connect to Supabase**
   - Check `SUPABASE_URL` format (should start with `https://`)
   - Verify `SUPABASE_ANON_KEY` is valid
   - Check browser console for errors

3. **Extension loads but shows errors**
   - Check Supabase function logs
   - Verify anon key has proper permissions
   - Test Supabase connection separately

### **Debug Mode:**

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for configuration and connection messages
4. Check for any error messages

## 🔄 Team Collaboration

### **For New Team Members:**

1. **Clone the repository**
2. **Run security setup:**
   ```bash
   cd creative-assistant-extension
   ./setup-security.sh
   ```
3. **Copy `env.template` to `config.js`:**
   ```bash
   cp env.template config.js
   ```
4. **Add their own Supabase credentials to `config.js`**
5. **Test extension locally**

### **Sharing Configuration:**

- **Never share `config.js` files**
- **Share `env.template` for reference**
- **Each team member uses their own Supabase project**
- **Document any new required variables**

## 🔐 Security Best Practices

1. **Use different Supabase projects for development/production**
2. **Rotate anon keys regularly**
3. **Monitor API usage and costs**
4. **Set up alerts for unusual activity**
5. **Regular security audits**
6. **Keep extension updated**

## 📋 Security Checklist

Before pushing to Git:
- ✅ `config.js` is in `.gitignore`
- ✅ `config.js` contains your actual Supabase credentials
- ✅ No sensitive data in other files
- ✅ `env.template` shows placeholder values
- ✅ Security setup script has been run
- ✅ Extension works with configuration

Before distributing to team:
- ✅ Extension loads without configuration errors
- ✅ Connects to Supabase backend successfully
- ✅ All functionality works as expected
- ✅ No hardcoded secrets in code

## 🎯 Extension Features

Your secure extension provides:
- **Screenshot Analysis**: AI-powered design inspiration
- **Project Integration**: Connect to your project briefs
- **Asset Search**: Find similar design inspiration
- **AI Generation**: Create new design ideas with DALL-E
- **Team Collaboration**: Share inspiration across projects

---

**Your Chrome extension is now secure and ready for team use!** 🚀🔒

All sensitive data is protected, and your extension will automatically validate its configuration on load.
