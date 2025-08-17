#!/bin/bash

echo "🚀 Deploying Nudge to Vercel"
echo "=============================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please run ./setup.sh first to configure your environment variables."
    exit 1
fi

# Check if required environment variables are set
if ! grep -q "your_supabase_project_url_here" .env.local; then
    echo "✅ Environment variables appear to be configured"
else
    echo "❌ Warning: Environment variables still contain placeholder values!"
    echo "Please update .env.local with your actual credentials before deploying."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔐 Don't forget to set your environment variables in Vercel:"
echo "   - Go to your Vercel project dashboard"
echo "   - Navigate to Settings > Environment Variables"
echo "   - Add all variables from your .env.local file"
echo ""
echo "📱 Your app should now be live at the URL provided above!"
