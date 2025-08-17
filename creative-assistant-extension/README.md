# Creative Assistant Chrome Extension

A powerful Chrome extension that provides AI-powered design inspiration and project brief management through a convenient side panel interface.

## 🚀 Features

### ✨ Explore Tab - AI-Powered Inspiration
- **Smart Screenshot Analysis**: Automatically captures and analyzes the current webpage
- **AI-Generated Inspiration**: Creates design inspiration based on visual content and context
- **Project Integration**: Select from existing projects to enhance inspiration generation
- **Keyword Extraction**: Automatically extracts relevant keywords from screenshots and project metadata
- **Permanent Storage**: All generated images are stored in Supabase for permanent access

### 📋 Brief Tab - Project Management
- **Project Overview**: View and manage project briefs, keywords, emotions, and look & feel
- **Asset Gallery**: Browse all assets associated with a specific project
- **Metadata Display**: See AI-analyzed project metadata including:
  - Project brief description
  - Extracted keywords
  - Emotional tone
  - Visual style and aesthetic direction

## 📦 Installation

### Prerequisites
- Google Chrome browser (version 88 or higher)
- A Supabase project with the required functions deployed
- Basic knowledge of Chrome extensions

### Step 1: Download the Extension
1. **Clone or download** this extension folder to your local machine
2. **Ensure all files are present**:
   - `manifest.json`
   - `sidepanel.html`
   - `sidepanel.js`
   - `background.js`
   - `icons/` folder with icon files
   - `env.template`

### Step 2: Configure Supabase
1. **Copy the template file**:
   ```bash
   cp env.template config.js
   ```

2. **Edit `config.js`** with your actual Supabase credentials:
   ```javascript
   // Configuration file - DO NOT commit this to Git!
   // Copy env.template to config.js and fill in your actual values
   
   window.SUPABASE_URL = 'https://your-actual-project-id.supabase.co';
   window.SUPABASE_ANON_KEY = 'your-actual-supabase-anon-key-here';
   
   console.log('🔐 Chrome Extension Configuration loaded from config.js');
   ```

3. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon public" key

### Step 3: Load Extension in Chrome
1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer mode** by toggling the switch in the top-right corner
3. **Click "Load unpacked"** button
4. **Select the extension folder** (the folder containing `manifest.json`)
5. **Verify installation** - you should see "Creative Assistant" in your extensions list

### Step 4: Access the Extension
1. **Click the extension icon** in your Chrome toolbar
2. **Open the side panel** by clicking "Creative Assistant" in the dropdown
3. **Alternatively**, right-click on any webpage and select "Creative Assistant" from the context menu

## 🎯 Usage Guide

### Getting Started
1. **Navigate to any webpage** you want to analyze
2. **Open the Creative Assistant side panel**
3. **Choose your tab**: Explore (for inspiration) or Brief (for project management)

### Explore Tab - Generate Inspiration
1. **Select a project** (optional):
   - Choose from the dropdown to include project context
   - This enhances AI generation with project-specific insights

2. **Add keywords** (optional):
   - Type specific terms to guide the AI generation
   - Examples: "modern", "minimalist", "vibrant colors"

3. **Take a screenshot** (automatic):
   - The extension automatically captures the current page
   - No manual action required

4. **Generate inspiration**:
   - Click "Analyze & Explore" button
   - Wait for AI processing (usually 10-30 seconds)
   - View generated inspiration images and extracted keywords

### Brief Tab - Manage Projects
1. **Select a project** from the dropdown
2. **View project details**:
   - **Brief**: Project description and requirements
   - **Keywords**: AI-extracted relevant terms
   - **Emotion**: Emotional tone and mood
   - **Look & Feel**: Visual style and aesthetic direction

3. **Browse project assets**:
   - View all images associated with the project
   - Click on any asset to open it in a new tab
   - Assets are displayed in a responsive grid

### Using Generated Results
1. **Copy keywords**: Click the copy button to copy extracted keywords to clipboard
2. **Save inspiration**: Generated images are automatically stored in Supabase
3. **Reference later**: Access all generated content through your Supabase dashboard

## 🔧 Configuration

### Environment Variables
The extension requires these Supabase settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Required Supabase Functions
Ensure these functions are deployed in your Supabase project:
- `GET /functions/v1/projects` - List all projects
- `GET /functions/v1/projects/{id}` - Get specific project details
- `GET /functions/v1/assets?project_id={id}` - Get assets for a project
- `POST /functions/v1/explore` - Generate inspiration

## 🛠️ Development

### File Structure
```
creative-assistant-extension/
├── manifest.json          # Extension configuration
├── sidepanel.html         # Main UI structure
├── sidepanel.js           # Extension logic and API calls
├── background.js          # Background service worker
├── config.js              # Supabase configuration (create from env.template)
├── env.template           # Template for configuration
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md              # This file
└── test.html              # Testing interface
```

### Testing
- **Use `test.html`** to test the extension functionality in a browser
- **Load as unpacked extension** in Chrome for development
- **Check browser console** for debugging information

### Building and Distribution
- **Development**: Load as unpacked extension
- **Production**: Package as `.crx` file for Chrome Web Store
- **Distribution**: Share the extension folder with other developers

## 🔒 Security Notes

### Important Security Practices
- **Never commit `config.js`** with real credentials to version control
- **Use environment variables** for production deployments
- **The extension uses Supabase anonymous keys** for API access
- **All API calls are made from the client side**
- **Check the `.gitignore`** file to ensure sensitive files are excluded

### Credential Management
- Keep your Supabase credentials secure
- Rotate keys regularly
- Use different keys for development and production
- Monitor API usage in your Supabase dashboard

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Configuration Errors
**Problem**: "Configuration Error" message appears
**Solution**: 
- Ensure `config.js` exists and has valid Supabase credentials
- Check that the file path is correct
- Verify your Supabase project is active

#### API Errors
**Problem**: "Failed to load projects" or similar API errors
**Solution**:
- Verify your Supabase functions are deployed and accessible
- Check your internet connection
- Ensure your Supabase project is not paused
- Verify API key permissions

#### Screenshot Issues
**Problem**: Screenshot capture fails
**Solution**:
- Ensure the extension has permission to capture screenshots
- Check that you're on a supported webpage (not `chrome://` pages)
- Refresh the page and try again
- Check browser console for error details

#### Asset Loading Problems
**Problem**: Images don't load or display
**Solution**:
- Verify that asset URLs are accessible
- Check that images exist in your Supabase storage
- Ensure proper CORS settings in Supabase
- Check browser console for network errors

#### Extension Not Loading
**Problem**: Extension doesn't appear in Chrome
**Solution**:
- Ensure Developer mode is enabled
- Check that all required files are present
- Try reloading the extension
- Verify manifest.json syntax is correct

### Debug Mode
1. **Open Chrome DevTools** (F12 or right-click → Inspect)
2. **Check the Console tab** for error messages
3. **Check the Network tab** for failed API calls
4. **Look for extension-specific errors** in the console

### Getting Help
1. **Check the browser console** for detailed error messages
2. **Verify Supabase function logs** in your project dashboard
3. **Test with the provided `test.html`** file
4. **Check file permissions** and ensure all files are readable

## 📚 API Reference

### Endpoints Used
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/functions/v1/projects` | List all available projects |
| `GET` | `/functions/v1/projects/{id}` | Get specific project details |
| `GET` | `/functions/v1/assets?project_id={id}` | Get assets for a project |
| `POST` | `/functions/v1/explore` | Generate AI inspiration |

### Request/Response Examples
See the `test.html` file for working examples of all API calls.

## 🤝 Support and Contributing

### Getting Help
- **Check this README** for common solutions
- **Review the browser console** for error details
- **Test with `test.html`** to isolate issues
- **Check Supabase function logs** for backend issues

### Contributing
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Reporting Issues
When reporting issues, please include:
- Chrome version
- Extension version
- Error messages from console
- Steps to reproduce
- Screenshots if applicable

## 📄 License

This extension is provided as-is for educational and development purposes. Please ensure compliance with Chrome Web Store policies if distributing publicly.

## 🔄 Updates and Maintenance

### Keeping Up to Date
- **Monitor Supabase function updates**
- **Check for Chrome extension policy changes**
- **Update dependencies as needed**
- **Test with new Chrome versions**

### Version History
- **v1.0.0**: Initial release with basic functionality
- Future versions will include additional features and improvements

---

**Happy designing! 🎨✨**

For technical support or questions, check the troubleshooting section above or review the Supabase function documentation.
