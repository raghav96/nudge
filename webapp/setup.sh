#!/bin/bash

echo "🎨 Setting up Nudge - Creative Asset Management"
echo "================================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.template .env.local
    echo "✅ .env.local created successfully!"
    echo ""
    echo "🔐 IMPORTANT: Please edit .env.local with your actual credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - OPENAI_API_KEY"
    echo "   - NEXTAUTH_SECRET"
    echo ""
    echo "⚠️  Never commit .env.local to Git!"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Setup complete! To start development:"
echo "   npm run dev"
echo ""
echo "🔐 Remember to configure your environment variables in .env.local"
echo "🌐 Deploy to Vercel with: vercel --prod"
