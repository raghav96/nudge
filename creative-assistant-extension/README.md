# Creative Assistant Browser Extension

A Chrome extension that provides AI-powered design inspiration and project brief management.

## Features

### Explore Tab
- **AI-Powered Inspiration**: Generate design inspiration based on screenshots, project briefs, and keywords
- **Project Integration**: Select from existing projects to enhance inspiration generation
- **Keyword Extraction**: Automatically extract relevant keywords from screenshots and project metadata
- **Permanent Storage**: All generated images are stored in Supabase for permanent access

### Brief Tab
- **Project Management**: View and manage project briefs, keywords, emotions, and look & feel
- **Asset Gallery**: Browse all assets associated with a specific project
- **Metadata Display**: See AI-analyzed project metadata including:
  - Project brief description
  - Extracted keywords
  - Emotional tone
  - Visual style and aesthetic direction

## Installation

1. **Clone or download** this extension folder
2. **Configure Supabase**:
   - Copy `env.template` to `config.js`
   - Update `config.js` with your Supabase URL and anonymous key
3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

## Configuration

Update `config.js` with your Supabase credentials:

```javascript
window.SUPABASE_URL = 'https://your-project-id.supabase.co'
window.SUPABASE_ANON_KEY = 'your-supabase-anon-key-here'
```

## Usage

### Explore Tab
1. **Optional**: Select a project from the dropdown to include project context
2. **Optional**: Add keywords to guide the AI generation
3. **Required**: Take a screenshot of the current page (automatic)
4. Click "Inspire Me!" to generate AI-powered design inspiration

### Brief Tab
1. Select a project from the dropdown
2. View the project's:
   - Brief description
   - Keywords
   - Emotional tone
   - Look and feel
   - Associated assets
3. Click on any asset to open it in a new tab

## API Endpoints Used

- `GET /functions/v1/projects` - List all projects
- `GET /functions/v1/projects/{id}` - Get specific project details
- `GET /functions/v1/assets?project_id={id}` - Get assets for a project
- `POST /functions/v1/explore` - Generate inspiration

## Development

### Testing
- Use `test.html` to test the extension functionality in a browser
- The extension can be loaded as an unpacked extension in Chrome

### File Structure
- `manifest.json` - Extension configuration
- `sidepanel.html` - Main UI structure
- `sidepanel.js` - Extension logic and API calls
- `config.js` - Supabase configuration (create from env.template)
- `background.js` - Background service worker for screenshot capture

## Security Notes

- Never commit `config.js` with real credentials to version control
- The extension uses Supabase anonymous keys for API access
- All API calls are made from the client side

## Troubleshooting

- **Configuration Error**: Ensure `config.js` exists and has valid Supabase credentials
- **API Errors**: Check that your Supabase functions are deployed and accessible
- **Screenshot Issues**: Ensure the extension has permission to capture screenshots
- **Asset Loading**: Verify that asset URLs are accessible and images exist

## Support

For issues or questions, check the Supabase function logs and browser console for error details.
