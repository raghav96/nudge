#!/bin/bash

echo "🔐 Supabase Functions Security Setup"
echo "===================================="

# Check if we're in the supabase directory
if [ ! -f "functions/explore/index.ts" ]; then
    echo "❌ Error: Please run this script from the supabase directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: supabase/"
    exit 1
fi

echo "✅ Supabase functions directory detected"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    echo "   This file contains your sensitive API keys."
    echo "   Make sure it's in .gitignore before pushing to Git."
    echo ""
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo ""
echo "📝 Setting up secure environment configuration..."
echo ""

# Create .env from template
if [ -f "env.template" ]; then
    echo "📋 Creating .env from template..."
    cp env.template .env
    echo "✅ .env created from env.template"
else
    echo "❌ env.template not found. Creating basic .env..."
    cat > .env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Environment-specific settings
APP_ENV=development
EOF
    echo "✅ Basic .env created"
fi

echo ""
echo "🔑 Now you need to update .env with your actual values:"
echo ""
echo "1. Open .env in your editor"
echo "2. Replace the placeholder values with your actual:"
echo "   - OPENAI_API_KEY: Your OpenAI API key"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key"
echo ""
echo "3. Save the file"
echo ""

# Check if .gitignore exists and contains .env
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo "✅ .gitignore already protects .env files"
    else
        echo "⚠️  .gitignore exists but doesn't protect .env files"
        echo "   Adding .env protection to .gitignore..."
        echo "" >> .gitignore
        echo "# Environment files" >> .gitignore
        echo ".env" >> .gitignore
        echo ".env.*" >> .gitignore
        echo "✅ .env protection added to .gitignore"
    fi
else
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Environment and configuration files
.env
.env.local
.env.production
.env.development
.env.*.local

# Supabase specific
.supabase/

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tgz
*.tar.gz

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary folders
tmp/
temp/
EOF
    echo "✅ .gitignore created and protects .env files"
fi

echo ""
echo "🔒 Security Checklist:"
echo "✅ .env created (contains your API keys)"
echo "✅ .gitignore protects .env files from Git"
echo "✅ env.template shows what needs to be configured"
echo ""
echo "⚠️  IMPORTANT: Before pushing to Git, verify:"
echo "   1. .env is in .gitignore"
echo "   2. .env contains your actual API keys"
echo "   3. No sensitive data is in other files"
echo "   4. env.template shows placeholder values"
echo ""
echo "🚀 You can now safely push to Git!"
echo ""
echo "💡 To deploy your functions:"
echo "   - Use Supabase CLI: supabase functions deploy"
echo "   - Or deploy from Supabase dashboard"
echo ""
echo "🔐 Your functions will automatically use the environment variables from .env"
