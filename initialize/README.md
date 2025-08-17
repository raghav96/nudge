# Initialize Folder - Database Population Scripts

This folder contains scripts to populate your Supabase database with initial data for the Creative Assistant project.

## ⚠️ **IMPORTANT SECURITY NOTICE**

**NEVER commit the actual `.js` files with real credentials to Git!** 

This folder contains:
- **Template files** (`.template.js`) - Safe to commit
- **Configuration files** (`.js`) - **NOT safe to commit** (contain real credentials)

## 📁 **File Structure**

| File | Purpose | Safe to Commit? |
|------|---------|------------------|
| `assign_project_ids_to_assets.template.js` | Template for assigning project IDs to assets | ✅ **YES** |
| `generate_and_insert_assets.template.js` | Template for populating assets table | ✅ **YES** |
| `generate_and_insert_projects.template.js` | Template for populating projects table | ✅ **YES** |
| `ASSETS_POPULATION_GUIDE.md` | Detailed setup and usage guide | ✅ **YES** |
| `README.md` | This file | ✅ **YES** |

## 🚀 **Getting Started**

### 1. **Copy Template Files**
```bash
# Copy template files to create your working copies
cp assign_project_ids_to_assets.template.js assign_project_ids_to_assets.js
cp generate_and_insert_assets.template.js generate_and_insert_assets.js
cp generate_and_insert_projects.template.js generate_and_insert_projects.js
```

### 2. **Update Configuration**
Edit each `.js` file and update these values:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key
- Project IDs and User IDs - Your actual database IDs

### 3. **Install Dependencies**
```bash
npm install @supabase/supabase-js openai
```

### 4. **Run Scripts**
```bash
# Populate projects first
node generate_and_insert_projects.js

# Then populate assets
node generate_and_insert_assets.js

# Finally assign project IDs to assets
node assign_project_ids_to_assets.js
```

## 🔑 **Required Credentials**

### **Supabase**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" and "anon public" key

### **OpenAI**
- Go to [OpenAI Platform](https://platform.openai.com/)
- Navigate to API Keys
- Create a new API key

### **Database IDs**
- Get your actual project IDs from the database
- Get your actual user IDs from the auth.users table

## 📊 **What Each Script Does**

### **`generate_and_insert_projects.js`**
- Creates 5 sample projects with detailed briefs
- Generates OpenAI embeddings for semantic search
- Inserts projects into the `projects` table

### **`generate_and_insert_assets.js`**
- Creates 12 sample assets with metadata
- Generates OpenAI embeddings for each asset
- Inserts assets into the `assets` table

### **`assign_project_ids_to_assets.js`**
- Matches assets to projects based on thematic similarity
- Uses both hardcoded mappings and AI similarity scoring
- Updates assets with appropriate `project_id` values

## 🛡️ **Security Best Practices**

1. **Never commit `.js` files** with real credentials
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Monitor API usage** in your dashboards
5. **Check `.gitignore`** to ensure sensitive files are excluded

## 🔍 **Troubleshooting**

### **Common Issues**
- **Configuration Error**: Ensure all credentials are set correctly
- **API Rate Limits**: Add delays between API calls if needed
- **Database Errors**: Check your Supabase function permissions
- **Missing Dependencies**: Run `npm install` to install required packages

### **Getting Help**
- Check the browser console for error messages
- Verify Supabase function logs in your project dashboard
- Ensure all required environment variables are set

## 📚 **Additional Resources**

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **OpenAI API Documentation**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Creative Assistant Guide**: See `ASSETS_POPULATION_GUIDE.md`

---

**Remember**: Keep your credentials secure and never share them in version control! 🔐
