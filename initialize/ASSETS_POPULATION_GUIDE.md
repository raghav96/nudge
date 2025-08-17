# Assets Table Population Guide

This guide explains how to populate your Supabase assets table with the metadata you provided and generate vector embeddings using OpenAI.

## 🎯 What We've Built

I've created a complete solution that includes:

1. **Supabase Edge Function** (`supabase/functions/populate-assets/index.ts`)
2. **Deployment Script** (`deploy-populate-assets.sh`)
3. **Test Scripts** (`test-populate-assets.js` and `test-curl.sh`)
4. **Documentation** (`supabase/functions/populate-assets/README.md`)

## 🚀 Quick Start

### 1. Set Up Your Configuration

First, copy the template files and update them with your credentials:

```bash
# Copy template files
cp assign_project_ids_to_assets.template.js assign_project_ids_to_assets.js
cp generate_and_insert_assets.template.js generate_and_insert_assets.js
cp generate_and_insert_projects.template.js generate_and_insert_projects.js

# Edit each file and update with your actual credentials
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - OPENAI_API_KEY
# - User IDs and project IDs
```

### 2. Deploy the Function

```bash
# Make sure you're in the project root
./deploy-populate-assets.sh
```

### 3. Test the Function

```bash
# Update the script with your Supabase details first
./test-curl.sh
```

## 📋 What the Function Does

The `populate-assets` function will:

1. **Scan your Supabase bucket** (`nudge-assets`) for image files
2. **Match filenames** with your provided metadata
3. **Generate OpenAI embeddings** for semantic search
4. **Populate the assets table** with all the data
5. **Skip duplicates** to avoid conflicts

## 🔑 Required Setup

### Environment Variables

Make sure these are set in your Supabase project:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️  Important**: Never commit actual API keys or credentials to version control!

### Database Schema

The function expects an `assets` table with these columns:
- `id` (uuid, primary key)
- `filename` (text)
- `file_url` (text)
- `project_id` (uuid, nullable)
- `keywords` (text)
- `emotion` (text)
- `look_and_feel` (text)
- `tags` (text[])
- `combined_vector` (vector)
- `is_public` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 📊 Your Metadata Mapping

The function includes all the metadata you provided:

| Filename | Emotion | Look & Feel | Keywords |
|----------|---------|-------------|----------|
| image 3.png | informative, calm, functional | clean, minimalistic, modern | weather forecast, map, temperature, rain alert |
| image 4.png | motivational, focused, energetic | dark mode, sleek, modern | fitness app, meditation, pilates, workout classes |
| image 5.jpg | calm, serene, refreshing | botanical, natural, traditional, artistic | lotus pond, lily pads, water plants, floral art |
| image 6.jpg | elegant, peaceful, refined | oriental, geometric, traditional, artistic | swallows, bamboo, abstract circles, Asian art |
| image 7.png | welcoming, adventurous, vibrant | bright, travel-themed, modern | hotel booking, travel app, search bar, city view |
| image 8.png | cinematic, exclusive, sophisticated | modern, bold, cinematic | movie streaming app, ticket, golden text, promotional |
| image 9.png | engaging, cultural, curated | cinematic, minimalistic, modern | film listing, theater, ticket, movie details |
| image 10.png | delicate, creative, intricate | artistic, handcrafted, minimalistic | kirigami, paper cut art, floral pattern, red design |
| image 13.png | charming, cozy, delightful | whimsical, illustrative, modern packaging | tea packaging, bicycle, flowers, gift set |
| image 14.png | cheerful, vibrant, fresh | bright, floral, decorative | flowers, digital ad, shop now, pink blossoms |
| image 12.png | elegant, artisanal, inviting | minimalistic, floral, handcrafted | fabric poster, floral pattern, event promotion, Japanese textile |
| image 11.png | futuristic, mysterious, powerful | digital, abstract, sci-fi, high-tech | superintelligence, abstract waves, neon lines, technology website |

## 🔍 API Endpoints

### List Files (GET)
```
GET /functions/v1/populate-assets
```
Lists all files in your storage bucket.

### Populate Assets (POST)
```
POST /functions/v1/populate-assets
Content-Type: application/json

{
  "project_id": null,
  "bucket_name": "nudge-assets"
}
```
Populates the assets table with metadata and generates embeddings.

## 🧪 Testing

### Option 1: Using the curl script
```bash
# Update SUPABASE_URL and SUPABASE_ANON_KEY in the script first
./test-curl.sh
```

### Option 2: Using the Node.js script
```bash
# Update the variables in the script first
node test-populate-assets.js
```

### Option 3: Manual curl commands
```bash
# List files
curl -X GET "https://your-project.supabase.co/functions/v1/populate-assets" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Populate assets
curl -X POST "https://your-project.supabase.co/functions/v1/populate-assets" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": null, "bucket_name": "nudge-assets"}'
```

## 🔧 Customization

### Adding More Images

To add more images, update the `ASSET_METADATA` object in `supabase/functions/populate-assets/index.ts`:

```typescript
const ASSET_METADATA = {
  // ... existing entries ...
  "new-image.png": {
    emotion: "your emotion description",
    look_and_feel: "your look and feel description",
    keywords: "your, keywords, here"
  }
}
```

### Changing Bucket Name

The default bucket name is `nudge-assets`. You can change this by:

1. Updating the default in the function
2. Passing a different `bucket_name` in the POST request
3. Updating the test scripts

## 🚨 Troubleshooting

### Common Issues

1. **Function not found**: Make sure you've deployed the function
2. **Authentication errors**: Check your Supabase anon key
3. **OpenAI API errors**: Verify your OpenAI API key and credits
4. **Database errors**: Ensure your assets table exists with the correct schema

### Debug Mode

The function includes extensive logging. Check your Supabase function logs for detailed error information.

## 📈 Next Steps

After populating the assets:

1. **Verify the data** in your Supabase dashboard
2. **Test semantic search** using the vector embeddings
3. **Integrate with your frontend** to display the assets
4. **Add more images** by updating the metadata object

## 🎉 Success!

Once everything is working, you'll have:
- ✅ All your images populated in the assets table
- ✅ Rich metadata for each image
- ✅ Vector embeddings for semantic search
- ✅ A scalable system for adding more assets

The function is designed to be idempotent, so you can run it multiple times safely!
