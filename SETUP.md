# 🚀 Creative Assistant - Complete Setup Guide

This guide will walk you through setting up the entire Creative Assistant project, including the webapp and Chrome extension.

## 📋 Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (version 8 or higher)
- **Google Chrome** browser
- **Supabase** project with required functions deployed
- **OpenAI** API key

## 🎯 Quick Start

### 1. **Install All Dependencies**
```bash
npm run install-all
```

### 2. **Complete Setup (Recommended)**
```bash
npm run setup
```

This will:
- Install all dependencies
- Set up the webapp environment
- Guide you through Chrome extension setup
- Provide database population instructions

## 🖥️ Webapp Setup

### **Start Development Server**
```bash
npm start
# or
npm run webapp:dev
```

The webapp will be available at: `http://localhost:3000`

### **Manual Webapp Setup**
```bash
# Navigate to webapp directory
cd webapp

# Run setup script
npm run setup

# Start development server
npm run dev
```

### **Webapp Environment Variables**
The setup script will create `.env.local` from `env.template`. Update it with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXTAUTH_SECRET`

## 🔌 Chrome Extension Setup

### **Quick Setup**
```bash
npm run extension:setup
```

### **Manual Extension Setup**

1. **Navigate to extension directory**
   ```bash
   cd creative-assistant-extension
   ```

2. **Create configuration file**
   ```bash
   cp env.template config.js
   ```

3. **Update config.js with your credentials**
   ```javascript
   window.SUPABASE_URL = 'https://your-project-id.supabase.co';
   window.SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';
   ```

4. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `creative-assistant-extension` folder

5. **Test the extension**
   ```bash
   npm run extension:test
   ```

### **Extension Features**
- **Side Panel**: Right-click any webpage → "Creative Assistant"
- **Screenshot Analysis**: Automatically captures and analyzes web content
- **AI Inspiration**: Generates design inspiration based on visual content
- **Project Management**: View and manage project briefs and assets

## 🗄️ Database Setup

### **Populate Database**
```bash
npm run db:populate
```

### **Manual Database Setup**

1. **Navigate to initialize directory**
   ```bash
   cd initialize
   ```

2. **Copy template files**
   ```bash
   cp *.template.js *.js
   ```

3. **Update credentials in .js files**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - Project IDs and User IDs

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run population scripts**
   ```bash
   # Populate projects first
   node generate_and_insert_projects.js
   
   # Then populate assets
   node generate_and_insert_assets.js
   
   # Finally assign project IDs to assets
   node assign_project_ids_to_assets.js
   ```

## 🎨 Available Scripts

### **Webapp Scripts**
| Command | Description |
|---------|-------------|
| `npm start` | Start webapp development server |
| `npm run webapp:dev` | Start webapp in development mode |
| `npm run webapp:build` | Build webapp for production |
| `npm run webapp:start` | Start production webapp |
| `npm run webapp:setup` | Set up webapp environment |

### **Extension Scripts**
| Command | Description |
|---------|-------------|
| `npm run extension:setup` | Get extension setup instructions |
| `npm run extension:test` | Open extension test page |

### **Database Scripts**
| Command | Description |
|---------|-------------|
| `npm run db:populate` | Get database population instructions |
| `npm run db:setup` | Install database dependencies |

### **Utility Scripts**
| Command | Description |
|---------|-------------|
| `npm run install-all` | Install all project dependencies |
| `npm run setup` | Complete project setup |
| `npm run lint` | Run linting on webapp |

## 🔧 Development Workflow

### **1. Start Development**
```bash
# Terminal 1: Start webapp
npm start

# Terminal 2: Watch for changes
npm run webapp:dev
```

### **2. Test Chrome Extension**
- Load extension in Chrome
- Navigate to any webpage
- Open Creative Assistant side panel
- Test screenshot analysis and AI generation

### **3. Database Management**
```bash
# When you need to update database
npm run db:populate
```

## 🚨 Troubleshooting

### **Webapp Issues**
- **Port 3000 in use**: Change port in `webapp/package.json`
- **Environment variables**: Ensure `.env.local` is properly configured
- **Dependencies**: Run `npm run install-all` to reinstall

### **Extension Issues**
- **Configuration error**: Check `config.js` has correct credentials
- **Extension not loading**: Verify Developer mode is enabled
- **Screenshot fails**: Check extension permissions

### **Database Issues**
- **API errors**: Verify Supabase functions are deployed
- **Credential errors**: Check API keys in `.js` files
- **Missing dependencies**: Run `npm run db:setup`

### **Common Solutions**
```bash
# Reset everything
rm -rf node_modules webapp/node_modules initialize/node_modules
npm run install-all

# Rebuild webapp
npm run webapp:build

# Check extension configuration
cat creative-assistant-extension/config.js
```

## 📚 Additional Resources

- **Webapp Documentation**: See `webapp/README.md`
- **Extension Documentation**: See `creative-assistant-extension/README.md`
- **Database Guide**: See `initialize/README.md`
- **Supabase Functions**: See `supabase/functions/`

## 🎉 Success Checklist

- [ ] Webapp running at `http://localhost:3000`
- [ ] Chrome extension loaded and accessible
- [ ] Database populated with sample data
- [ ] Extension can capture screenshots
- [ ] AI inspiration generation working
- [ ] Project management features functional

## 🆘 Getting Help

1. **Check the console** for error messages
2. **Review logs** in Supabase dashboard
3. **Verify credentials** in all configuration files
4. **Check file permissions** and paths
5. **Ensure all dependencies** are installed

---

**Happy creating! 🎨✨**

For detailed documentation on each component, see the respective README files in each directory.
