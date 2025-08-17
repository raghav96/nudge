# 🔐 Supabase Functions Security Guide

This guide explains how to securely configure your Supabase Edge Functions with environment variables.

## 🚨 Security First!

**⚠️ IMPORTANT: Never commit API keys or sensitive data to Git!**

Your functions contain sensitive information:
- OpenAI API keys
- Supabase service role keys
- Database connection details

## 🔧 Quick Security Setup

### 1. Run the Security Setup Script

```bash
cd supabase
chmod +x setup-security.sh
./setup-security.sh
```

This will:
- ✅ Create `.env` file with your API keys
- ✅ Add `.env` to `.gitignore` (prevents Git commits)
- ✅ Create `env.template` for team members
- ✅ Set up proper security structure

### 2. Configure Your Environment Variables

Edit the `.env` file with your actual values:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Optional: Environment-specific settings
APP_ENV=production
```

### 3. Deploy Your Functions

```bash
# Using Supabase CLI
supabase functions deploy

# Or deploy from Supabase dashboard
```

## 🔒 What's Protected

### ✅ **Safe to Commit:**
- `env.template` - Template showing what needs configuration
- `functions/*/index.ts` - Function code (no sensitive data)
- `README-SECURITY.md` - This security guide
- `setup-security.sh` - Security setup script

### ❌ **Never Commit:**
- `.env` - Contains your actual API keys
- `.env.local` - Local development overrides
- `.env.production` - Production environment variables
- Any files with actual API keys

## 🌍 Environment Variables in Supabase

### **Local Development:**
- Use `.env` file for local testing
- Run `supabase start` to test locally

### **Production Deployment:**
- Set environment variables in Supabase dashboard
- Go to Settings → Edge Functions → Environment Variables
- Add each variable from your `.env` file

### **Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://...supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |

## 🚀 Deployment Workflow

### **1. Local Testing:**
```bash
# Start local Supabase
supabase start

# Test functions locally
supabase functions serve
```

### **2. Production Deployment:**
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy explore
supabase functions deploy assets
supabase functions deploy projects
```

### **3. Environment Variables in Production:**
1. Go to Supabase Dashboard
2. Navigate to Settings → Edge Functions
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 🔍 Security Validation

Your functions now include automatic validation:

```typescript
// Environment variables are validated on every request
const requiredEnvVars = {
  'OPENAI_API_KEY': Deno.env.get('OPENAI_API_KEY'),
  'SUPABASE_URL': Deno.env.get('SUPABASE_URL'),
  'SUPABASE_SERVICE_ROLE_KEY': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

// Missing variables return clear error messages
if (missingVars.length > 0) {
  return new Response(
    JSON.stringify({ 
      error: 'Server configuration error: Missing environment variables',
      missing: missingVars 
    }),
    { status: 500 }
  )
}
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Missing environment variables" error**
   - Check `.env` file exists and has correct values
   - Verify variables are set in Supabase dashboard
   - Ensure no typos in variable names

2. **Functions work locally but fail in production**
   - Environment variables not set in Supabase dashboard
   - Check Supabase function logs for errors
   - Verify variable names match exactly

3. **OpenAI API errors**
   - Check `OPENAI_API_KEY` is valid and has credits
   - Verify API key format starts with `sk-`
   - Check OpenAI account status

### **Debug Mode:**

Check Supabase function logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on function name
4. View "Logs" tab

## 🔄 Team Collaboration

### **For New Team Members:**

1. **Clone the repository**
2. **Run security setup:**
   ```bash
   cd supabase
   ./setup-security.sh
   ```
3. **Copy `env.template` to `.env`:**
   ```bash
   cp env.template .env
   ```
4. **Add their own API keys to `.env`**
5. **Test locally before deploying**

### **Sharing Configuration:**

- **Never share `.env` files**
- **Share `env.template` for reference**
- **Use Supabase dashboard for production variables**
- **Document any new required variables**

## 🔐 Security Best Practices

1. **Rotate API keys regularly**
2. **Use different keys for development/production**
3. **Monitor API usage and costs**
4. **Set up alerts for unusual activity**
5. **Regular security audits**
6. **Keep dependencies updated**

## 📋 Security Checklist

Before pushing to Git:
- ✅ `.env` is in `.gitignore`
- ✅ `.env` contains your actual API keys
- ✅ No sensitive data in function code
- ✅ `env.template` shows placeholder values
- ✅ Security setup script has been run
- ✅ Functions work with environment variables

Before deploying to production:
- ✅ Environment variables set in Supabase dashboard
- ✅ API keys are valid and have sufficient credits
- ✅ Functions tested locally with `.env`
- ✅ No hardcoded secrets in code

---

**Your Supabase functions are now secure and ready for production!** 🚀🔒

All sensitive data is protected, and your functions will automatically validate their configuration on every request.
