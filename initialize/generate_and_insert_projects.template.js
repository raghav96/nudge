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

// Project data - Update with your actual project information
const projects = [
  {
    name: 'Custom Car Body Parts Company',
    brief: 'We are launching a premium line of custom car body parts for performance enthusiasts. The brand should communicate power, precision, and confidence. We want the identity to feel bold, rugged, and masculine, appealing to drivers who see cars as an extension of personality. The look and feel should lean toward industrial, geometric, and metallic, with clean lines and a technical edge. Keywords might include carbon fiber, speed, automotive, performance upgrades, aftermarket styling. Deliverables: a strong logo that reflects innovation and toughness, a color palette that invokes adrenaline (reds, blacks, metallic grays), and brand visuals that fit motorsport culture.',
    keywords: 'carbon fiber, speed, automotive, performance upgrades, aftermarket styling, custom parts, motorsport, body kits, racing, precision engineering',
    emotion: 'power, precision, confidence, bold, rugged, masculine, adrenaline-fueled, innovative, tough',
    lookAndFeel: 'industrial, geometric, metallic, clean lines, technical edge, bold, rugged, motorsport culture, adrenaline-inspired'
  },
  {
    name: 'Sustainable Streetwear Clothing Brand',
    brief: 'We are building a sustainable streetwear clothing brand aimed at Gen Z and millennials. The brand should feel authentic, expressive, and rebellious, yet also eco-conscious and ethical. Look and feel should be minimalistic with bold graphic accents, urban, edgy, and modern. Keywords include hoodies, oversized fits, eco fabrics, graffiti-inspired graphics, monochrome with pops of neon. Deliverables: logo design, typography system, and mood board that capture the tension between self-expression and sustainability.',
    keywords: 'hoodies, oversized fits, eco fabrics, graffiti-inspired graphics, monochrome, neon, streetwear, sustainable, urban, edgy',
    emotion: 'authentic, expressive, rebellious, eco-conscious, ethical, bold, modern, conscious',
    lookAndFeel: 'minimalistic, bold graphic accents, urban, edgy, modern, sustainable, street culture, monochrome with neon pops'
  },
  {
    name: 'Modular Home Furniture Company',
    brief: 'We\'re creating a new line of modular home furniture designed for small apartments. The brand should convey warmth, comfort, and practicality while also feeling sophisticated and modern. The look and feel should be Scandinavian, minimalistic, wooden textures, neutral tones. Keywords: sofa, modular shelving, natural wood, soft fabric, compact living solutions. Deliverables: a calming logo, typography, and a mood board that feels inviting yet functional.',
    keywords: 'sofa, modular shelving, natural wood, soft fabric, compact living solutions, small apartments, home furniture, modular design, Scandinavian style',
    emotion: 'warmth, comfort, practicality, sophisticated, modern, calming, inviting, functional, cozy',
    lookAndFeel: 'Scandinavian, minimalistic, wooden textures, neutral tones, clean, functional, inviting, warm, natural materials'
  },
  {
    name: 'Personal Audio Electronics Brand',
    brief: 'We\'re launching a consumer electronics brand focused on personal audio devices. The identity should evoke innovation, clarity, and trustworthiness. Emotions: sleek, futuristic, high-tech. Look and feel: minimalistic, geometric, metallic, futuristic interfaces. Keywords: headphones, earbuds, sound waves, circuit design, polished aluminum. Deliverables: logo, product branding, and a brand story that resonates with young tech-savvy professionals.',
    keywords: 'headphones, earbuds, sound waves, circuit design, polished aluminum, audio devices, personal electronics, sound quality, wireless technology',
    emotion: 'innovation, clarity, trustworthiness, sleek, futuristic, high-tech, professional, cutting-edge, reliable',
    lookAndFeel: 'minimalistic, geometric, metallic, futuristic interfaces, sleek, modern, high-tech, polished, sophisticated'
  },
  {
    name: 'Outdoor Adventure Apparel Brand',
    brief: 'We are creating an outdoor apparel brand for hikers and climbers. The brand should inspire adventure, resilience, and freedom. Emotions: rugged, bold, empowering, aspirational. Look and feel: earthy, textured, functional, weatherproof. Keywords: mountains, hiking boots, climbing ropes, durable jackets, all-weather gear. Deliverables: logo, typography, and mood board that captures the spirit of exploration while still feeling accessible.',
    keywords: 'mountains, hiking boots, climbing ropes, durable jackets, all-weather gear, outdoor adventure, hiking, climbing, exploration, wilderness',
    emotion: 'adventure, resilience, freedom, rugged, bold, empowering, aspirational, inspiring, determined, courageous',
    lookAndFeel: 'earthy, textured, functional, weatherproof, natural, durable, rugged, accessible, outdoor-inspired, wilderness-ready'
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

// Hardcoded user IDs from your auth.users table - Update with your actual user IDs
const USER_IDS = {
  'designer@example.com': 'your-user-id-1',
  'creative@example.com': 'your-user-id-2'
};

// Function to get user ID by email
async function getUserId(email) {
  const userId = USER_IDS[email];
  if (!userId) {
    throw new Error(`User ID not found for email: ${email}`);
  }
  return userId;
}

// Function to insert project with vector
async function insertProject(project, userId) {
  try {
    // Generate embedding from combined text
    const combinedText = `${project.keywords} ${project.emotion} ${project.lookAndFeel}`;
    console.log(`Generating embedding for: ${project.name}`);
    
    const embedding = await generateEmbedding(combinedText);
    console.log(`✅ Generated embedding (${embedding.length} dimensions)`);
    
    // Insert project with vector
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: project.name,
        brief: project.brief,
        keywords: project.keywords,
        emotion: project.emotion,
        look_and_feel: project.lookAndFeel,
        combined_vector: embedding,
        is_public: true
      });
    
    if (error) {
      throw new Error(`Failed to insert project: ${error.message}`);
    }
    
    console.log(`✅ Inserted project: ${project.name}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error inserting ${project.name}:`, error.message);
    throw error;
  }
}

// Main function to populate projects
async function populateProjects() {
  try {
    console.log('🚀 Starting projects population...');
    console.log(`📊 Processing ${projects.length} projects`);
    
    // Use a default user ID for all projects (you can modify this logic)
    const defaultUserId = Object.values(USER_IDS)[0];
    if (!defaultUserId) {
      throw new Error('No user ID found. Please update USER_IDS with your actual user IDs.');
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const project of projects) {
      try {
        await insertProject(project, defaultUserId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to process ${project.name}:`, error.message);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully processed: ${successCount} projects`);
    console.log(`❌ Failed: ${errorCount} projects`);
    console.log(`🎯 Total: ${projects.length} projects`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All projects processed successfully!');
    } else {
      console.log('\n⚠️  Some projects failed to process. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateProjects();
}

module.exports = { populateProjects };
