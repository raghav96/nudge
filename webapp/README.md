# 🎨 Nudge - Creative Asset Management

A modern, AI-powered web application for managing creative projects and assets. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

- **Project Management**: Create and manage project briefs with AI-generated metadata
- **Asset Upload**: Upload images with automatic AI analysis and metadata extraction
- **Smart Search**: AI-powered keyword, emotion, and look-and-feel analysis
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Secure**: Server-side API key management and proper authentication
- **Vercel Ready**: Optimized for easy deployment on Vercel

## 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with server-side processing
- **Database**: Supabase (PostgreSQL) with vector search capabilities
- **Storage**: Supabase Storage for image uploads
- **AI**: OpenAI GPT-4 for metadata generation and analysis
- **Authentication**: Email-based user management

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ 
- Supabase account and project
- OpenAI API key

### 2. Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd webapp

# Run the setup script
chmod +x setup.sh
./setup.sh

# Or manually:
cp env.template .env.local
npm install
```

### 3. Environment Configuration

Edit `.env.local` with your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

Ensure your Supabase database has the required tables:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (or use auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  brief TEXT,
  keywords TEXT,
  emotion TEXT,
  look_and_feel TEXT,
  combined_metadata TEXT GENERATED ALWAYS AS (keywords || ' ' || emotion || ' ' || look_and_feel) STORED,
  combined_vector VECTOR(1536)
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  keywords TEXT,
  emotion TEXT,
  look_and_feel TEXT,
  combined_metadata TEXT GENERATED ALWAYS AS (keywords || ' ' || emotion || ' ' || look_and_feel) STORED,
  combined_vector VECTOR(1536),
  tags TEXT[],
  is_public BOOLEAN DEFAULT true
);

-- Create storage bucket
-- In Supabase Dashboard: Storage > Create bucket named 'nudge-assets'
```

### 5. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add all variables from your `.env.local`

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔐 Security Features

- **Environment Variables**: All sensitive data stored in `.env.local` (never committed)
- **Server-side Processing**: API keys only accessible on the server
- **Input Validation**: Comprehensive validation for all user inputs
- **Error Handling**: Secure error messages without exposing internals
- **CORS Protection**: Built-in Next.js CORS handling

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── projects/   # Project management API
│   │   └── assets/     # Asset management API
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/          # React components
│   ├── AddProject.tsx  # Project creation form
│   ├── AddAsset.tsx    # Asset upload form
│   ├── ProjectList.tsx # Project display
│   └── AssetList.tsx   # Asset display
├── lib/                 # Utility libraries
│   └── supabase.ts     # Supabase client
└── types/               # TypeScript types
    └── database.ts      # Database schema types
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New API Route**: Create in `src/app/api/`
2. **New Component**: Create in `src/components/`
3. **New Type**: Add to `src/types/`
4. **New Utility**: Add to `src/lib/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [Issues](../../issues) page
- Review the documentation
- Contact the development team

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
