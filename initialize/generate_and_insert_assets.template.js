const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Configuration - Update these values with your actual credentials
// DO NOT commit this file with real credentials to Git!
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key-here'; // Get this from your Supabase dashboard
const OPENAI_API_KEY = 'your-openai-api-key-here'; // Your OpenAI API key

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Asset data with your provided metadata - Update with your actual file URLs
const assets = [
  {
    filename: 'image 3.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%203.png',
    emotion: 'informative, calm, functional',
    look_and_feel: 'clean, minimalistic, modern',
    keywords: 'weather forecast, map, temperature, rain alert'
  },
  {
    filename: 'image 4.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%204.png',
    emotion: 'motivational, focused, energetic',
    look_and_feel: 'dark mode, sleek, modern',
    keywords: 'fitness app, meditation, pilates, workout classes'
  },
  {
    filename: 'image 5.jpg',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%205.jpg',
    emotion: 'calm, serene, refreshing',
    look_and_feel: 'botanical, natural, traditional, artistic',
    keywords: 'lotus pond, lily pads, water plants, floral art'
  },
  {
    filename: 'image 6.jpg',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%206.jpg',
    emotion: 'elegant, peaceful, refined',
    look_and_feel: 'oriental, geometric, traditional, artistic',
    keywords: 'swallows, bamboo, abstract circles, Asian art'
  },
  {
    filename: 'image 7.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%207.png',
    emotion: 'welcoming, adventurous, vibrant',
    look_and_feel: 'bright, travel-themed, modern',
    keywords: 'hotel booking, travel app, search bar, city view'
  },
  {
    filename: 'image 8.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%208.png',
    emotion: 'cinematic, exclusive, sophisticated',
    look_and_feel: 'modern, bold, cinematic',
    keywords: 'movie streaming app, ticket, golden text, promotional'
  },
  {
    filename: 'image 9.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%209.png',
    emotion: 'engaging, cultural, curated',
    look_and_feel: 'cinematic, minimalistic, modern',
    keywords: 'film listing, theater, ticket, movie details'
  },
  {
    filename: 'image 10.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%2010.png',
    emotion: 'delicate, creative, intricate',
    look_and_feel: 'artistic, handcrafted, minimalistic',
    keywords: 'kirigami, paper cut art, floral pattern, red design'
  },
  {
    filename: 'image 13.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%2013.png',
    emotion: 'charming, cozy, delightful',
    look_and_feel: 'whimsical, illustrative, modern packaging',
    keywords: 'tea packaging, bicycle, flowers, gift set'
  },
  {
    filename: 'image 14.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%2014.png',
    emotion: 'cheerful, vibrant, fresh',
    look_and_feel: 'bright, floral, decorative',
    keywords: 'flowers, digital ad, shop now, pink blossoms'
  },
  {
    filename: 'image 12.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%2012.png',
    emotion: 'elegant, artisanal, inviting',
    look_and_feel: 'minimalistic, floral, handcrafted',
    keywords: 'fabric poster, floral pattern, event promotion, Japanese textile'
  },
  {
    filename: 'image 11.png',
    file_url: 'https://your-project-id.supabase.co/storage/v1/object/public/your-bucket/image%2011.png',
    emotion: 'futuristic, mysterious, powerful',
    look_and_feel: 'digital, abstract, sci-fi, high-tech',
    keywords: 'superintelligence, abstract waves, neon lines, technology website'
  }
];

// Function to generate embedding using OpenAI
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to insert asset with vector
async function insertAsset(asset) {
  try {
    // Generate embedding from combined text
    const combinedText = `${asset.keywords} ${asset.emotion} ${asset.look_and_feel}`;
    console.log(`Generating embedding for: ${asset.filename}`);
    
    const embedding = await generateEmbedding(combinedText);
    console.log(`✅ Generated embedding (${embedding.length} dimensions)`);
    
    // Insert asset with vector
    const { data, error } = await supabase
      .from('assets')
      .insert({
        filename: asset.filename,
        file_url: asset.file_url,
        keywords: asset.keywords,
        emotion: asset.emotion,
        look_and_feel: asset.look_and_feel,
        combined_vector: embedding,
        is_public: true
      });
    
    if (error) {
      throw new Error(`Failed to insert asset: ${error.message}`);
    }
    
    console.log(`✅ Inserted asset: ${asset.filename}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error inserting ${asset.filename}:`, error.message);
    throw error;
  }
}

// Main function to populate assets
async function populateAssets() {
  try {
    console.log('🚀 Starting assets population...');
    console.log(`📊 Processing ${assets.length} assets`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const asset of assets) {
      try {
        await insertAsset(asset);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process ${asset.filename}:`, error.message);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully processed: ${successCount} assets`);
    console.log(`❌ Failed: ${errorCount} assets`);
    console.log(`🎯 Total: ${assets.length} assets`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All assets processed successfully!');
    } else {
      console.log('\n⚠️  Some assets failed to process. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateAssets();
}

module.exports = { populateAssets };
