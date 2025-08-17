const { createClient } = require('@supabase/supabase-js');

// Configuration - Update these values with your actual credentials
// DO NOT commit this file with real credentials to Git!
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Project data from your table - Update with your actual project IDs
const projects = [
  {
    id: "your-project-id-1",
    name: "Outdoor Adventure Apparel Brand",
    keywords: "mountains, hiking boots, climbing ropes, durable jackets, all-weather gear, outdoor adventure, hiking, climbing, exploration, wilderness",
    emotion: "adventure, resilience, freedom, rugged, bold, empowering, aspirational, inspiring, determined, courageous",
    look_and_feel: "earthy, textured, functional, weatherproof, natural, durable, rugged, accessible, outdoor-inspired, wilderness-ready"
  },
  {
    id: "your-project-id-2",
    name: "Sustainable Streetwear Clothing Brand",
    keywords: "hoodies, oversized fits, eco fabrics, graffiti-inspired graphics, monochrome, neon, streetwear, sustainable, urban, edgy",
    emotion: "authentic, expressive, rebellious, eco-conscious, ethical, bold, modern, conscious",
    look_and_feel: "minimalistic, bold graphic accents, urban, edgy, modern, sustainable, street culture, monochrome with neon pops"
  },
  {
    id: "your-project-id-3",
    name: "Personal Audio Electronics Brand",
    keywords: "headphones, earbuds, sound waves, circuit design, polished aluminum, audio devices, personal electronics, sound quality, wireless technology",
    emotion: "innovation, clarity, trustworthiness, sleek, futuristic, high-tech, professional, cutting-edge, reliable",
    look_and_feel: "minimalistic, geometric, metallic, futuristic interfaces, sleek, modern, high-tech, polished, sophisticated"
  },
  {
    id: "your-project-id-4",
    name: "Modular Home Furniture Company",
    keywords: "sofa, modular shelving, natural wood, soft fabric, compact living solutions, small apartments, home furniture, modular design, Scandinavian style",
    emotion: "warmth, comfort, practicality, sophisticated, modern, calming, inviting, functional, cozy",
    look_and_feel: "Scandinavian, minimalistic, wooden textures, neutral tones, clean, functional, inviting, warm, natural materials"
  },
  {
    id: "your-project-id-5",
    name: "Custom Car Body Parts Company",
    keywords: "carbon fiber, speed, automotive, performance upgrades, aftermarket styling, custom parts, motorsport, body kits, racing, precision engineering",
    emotion: "power, precision, confidence, bold, rugged, masculine, adrenaline-fueled, innovative, tough",
    look_and_feel: "industrial, geometric, metallic, clean lines, technical edge, bold, rugged, motorsport culture, adrenaline-inspired"
  }
];

// Asset to project mapping based on thematic similarity - Update with your actual filenames
const assetProjectMapping = {
  // Outdoor/Adventure themed assets
  "image 5.jpg": "your-project-id-1", // lotus pond - natural, botanical, outdoor
  "image 6.jpg": "your-project-id-1", // Asian art - traditional, natural materials
  
  // Tech/Modern themed assets
  "image 3.png": "your-project-id-3", // weather app - functional, modern, tech
  "image 4.png": "your-project-id-3", // fitness app - modern, sleek, tech
  "image 11.png": "your-project-id-3", // tech website - futuristic, high-tech
  
  // Streetwear/Urban themed assets
  "image 7.png": "your-project-id-2", // travel app - urban, modern, vibrant
  "image 8.png": "your-project-id-2", // movie streaming - modern, bold, urban
  "image 9.png": "your-project-id-2", // film listing - modern, cultural, urban
  "image 14.png": "your-project-id-2", // digital ad - bright, modern, urban
  
  // Home/Furniture themed assets
  "image 10.png": "your-project-id-4", // kirigami art - artistic, handcrafted, home decor
  "image 13.png": "your-project-id-4", // tea packaging - cozy, home lifestyle
  "image 12.png": "your-project-id-4", // fabric poster - artisanal, home textiles
};

// Function to calculate simple text similarity score
function calculateSimilarity(assetText, projectText) {
  const assetWords = assetText.toLowerCase().split(/[,\s]+/);
  const projectWords = projectText.toLowerCase().split(/[,\s]+/);
  
  let matches = 0;
  assetWords.forEach(word => {
    if (projectWords.includes(word) && word.length > 2) {
      matches++;
    }
  });
  
  return matches / Math.max(assetWords.length, projectWords.length);
}

// Function to find best project match for an asset
function findBestProjectMatch(asset) {
  let bestMatch = null;
  let bestScore = 0;
  
  projects.forEach(project => {
    const combinedProjectText = `${project.keywords} ${project.emotion} ${project.look_and_feel}`;
    const combinedAssetText = `${asset.keywords} ${asset.emotion} ${asset.look_and_feel}`;
    
    const score = calculateSimilarity(combinedAssetText, combinedProjectText);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = project;
    }
  });
  
  return bestMatch;
}

// Main function to assign project IDs to assets
async function assignProjectIdsToAssets() {
  try {
    console.log('🔍 Fetching assets from database...');
    
    // Fetch all assets from the database
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch assets: ${error.message}`);
    }
    
    console.log(`✅ Found ${assets.length} assets`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const asset of assets) {
      // Skip if asset already has a project_id
      if (asset.project_id) {
        console.log(`⏭️  Skipping ${asset.filename} - already has project_id`);
        skippedCount++;
        continue;
      }
      
      // Check if we have a hardcoded mapping for this asset
      if (assetProjectMapping[asset.filename]) {
        const projectId = assetProjectMapping[asset.filename];
        console.log(`🎯 Using hardcoded mapping for ${asset.filename} -> ${projectId}`);
        
        // Update the asset with the project_id
        const { error: updateError } = await supabase
          .from('assets')
          .update({ project_id: projectId })
          .eq('id', asset.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${asset.filename}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${asset.filename} with project_id: ${projectId}`);
          updatedCount++;
        }
        continue;
      }
      
      // If no hardcoded mapping, find the best match using AI similarity
      console.log(`🤖 Finding best project match for ${asset.filename}...`);
      const bestMatch = findBestProjectMatch(asset);
      
      if (bestMatch) {
        console.log(`🎯 Best match for ${asset.filename}: ${bestMatch.name} (score: ${calculateSimilarity(
          `${asset.keywords} ${asset.emotion} ${asset.look_and_feel}`,
          `${bestMatch.keywords} ${bestMatch.emotion} ${bestMatch.look_and_feel}`
        ).toFixed(3)})`);
        
        // Update the asset with the best matching project_id
        const { error: updateError } = await supabase
          .from('assets')
          .update({ project_id: bestMatch.id })
          .eq('id', asset.id);
        
        if (updateError) {
          console.error(`❌ Failed to update ${asset.filename}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${asset.filename} with project_id: ${bestMatch.id}`);
          updatedCount++;
        }
      } else {
        console.log(`⚠️  No suitable project match found for ${asset.filename}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} assets`);
    console.log(`⏭️  Skipped: ${skippedCount} assets (already had project_id)`);
    console.log(`🎯 Total processed: ${assets.length} assets`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  assignProjectIdsToAssets();
}

module.exports = { assignProjectIdsToAssets };
