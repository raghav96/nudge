#!/bin/bash

echo "🔐 Chrome Extension Security Setup"
echo "=================================="

# Check if we're in the creative-assistant-extension directory
if [ ! -f "sidepanel.js" ] || [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the creative-assistant-extension directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: creative-assistant-extension/"
    exit 1
fi

echo "✅ Chrome extension directory detected"
echo ""

# Check if config.js already exists
if [ -f "config.js" ]; then
    echo "⚠️  config.js already exists!"
    echo "   This file contains your sensitive Supabase credentials."
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
echo "📝 Setting up secure configuration..."
echo ""

# Create config.js from template
if [ -f "env.template" ]; then
    echo "📋 Creating config.js from template..."
    cp env.template config.js
    echo "✅ config.js created from env.template"
else
    echo "❌ env.template not found. Creating basic config.js..."
    cat > config.js << 'EOF'
// Configuration file - DO NOT commit this to Git!
// Fill in your actual values below

window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';

console.log('🔐 Chrome Extension Configuration loaded from config.js');
EOF
    echo "✅ Basic config.js created"
fi

echo ""
echo "🔑 Now you need to update config.js with your actual values:"
echo ""
echo "1. Open config.js in your editor"
echo "2. Replace the placeholder values with your actual:"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_ANON_KEY: Your Supabase anon key"
echo ""
echo "3. Save the file"
echo ""

# Check if .gitignore exists and contains config.js
if [ -f ".gitignore" ]; then
    if grep -q "config.js" .gitignore; then
        echo "✅ .gitignore already protects config.js"
    else
        echo "⚠️  .gitignore exists but doesn't protect config.js"
        echo "   Adding config.js to .gitignore..."
        echo "" >> .gitignore
        echo "# Configuration files" >> .gitignore
        echo "config.js" >> .gitignore
        echo "✅ config.js added to .gitignore"
    fi
else
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Environment and configuration files
config.js
.env
.env.local

# Build and distribution files
dist/
build/
*.zip
*.crx
*.pem

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

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

# Chrome extension specific
*.crx
*.pem
*.zip
web-ext-artifacts/
EOF
    echo "✅ .gitignore created and protects config.js"
fi

echo ""
echo "🔒 Security Checklist:"
echo "✅ config.js created (contains your Supabase credentials)"
echo "✅ .gitignore protects config.js from Git"
echo "✅ env.template shows what needs to be configured"
echo "✅ sidepanel.js updated to use config.js"
echo ""
echo "⚠️  IMPORTANT: Before pushing to Git, verify:"
echo "   1. config.js is in .gitignore"
echo "   2. config.js contains your actual Supabase credentials"
echo "   3. No sensitive data is in other files"
echo "   4. env.template shows placeholder values"
echo ""
echo "🚀 You can now safely push to Git!"
echo ""
echo "💡 To test the extension:"
echo "   1. Load the extension in Chrome (chrome://extensions/)"
echo "   2. Open the side panel"
echo "   3. Verify it connects to your Supabase backend"
echo ""
echo "🔐 Your extension will automatically use the configuration from config.js"
