import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Explore Request Interface
 * 
 * @param screenshot - Base64 encoded screenshot for analysis
 * @param projectId - ID of existing project to get metadata from
 * @param keywords - User-provided keywords for search
 * 
 * System prompts are now configurable directly in the code for easy prompt engineering.
 */

// Type definitions
interface ExploreRequest {
  screenshot?: string;
  projectId?: string; 
  keywords?: string;
}

interface ScreenshotAnalysis {
  keywords: string;
  emotion: string;
  look_and_feel: string;
}

interface ProjectMetadata {
  keywords: string;
  emotion: string;
  look_and_feel: string;
}

interface Asset {
  id: string;
  file_url: string;
  keywords: string;
  emotion: string;
  look_and_feel: string;
  similarity_score: number;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  originalUrl?: string; // Track the original Azure blob URL for reference
  filename?: string; // Store filename for potential future management
  metadataVariation?: string; // Store the metadata variation used for this image
}

interface ImageMetadata {
  keywords: string;
  emotion: string;
  look_and_feel: string;
}

interface AssetResult {
  id: string;
  type: 'asset';
  image_url: string;
  metadata: ImageMetadata;
  similarity_score: number;
}

interface GeneratedResult {
  id: string;
  type: 'generated';
  image_url: string;
  metadata: ImageMetadata;
  prompt_used: string;
  metadata_variation?: string; // Include the metadata variation used for this image
}

type ResultItem = AssetResult | GeneratedResult;

interface SourceMetadata {
  screenshot_analysis?: ScreenshotAnalysis;
  screenshot_analysis_error?: string;
  project_metadata?: ProjectMetadata;
  project_fetch_error?: string;
  project_error?: string;
  asset_search_error?: string;
  image_generation_error?: string;
  combined_search_query?: string;
  assets_found?: number;
  assets_used?: number;
  images_generated?: number;
  image_expiration_warning?: string; // Added for warning about expiring images
  temporary_solution_note?: string; // Added for note about temporary solution
  storage_success_note?: string; // Added for note about successful storage
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { screenshot, projectId, keywords }: ExploreRequest = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

    let combinedMetadata = ''
    let sourceMetadata: SourceMetadata = {}

    // 1. Analyze screenshot if provided
    if (screenshot) {
      try {
        const screenshotAnalysis: ScreenshotAnalysis = await analyzeScreenshot(screenshot)
        sourceMetadata.screenshot_analysis = screenshotAnalysis
        combinedMetadata += `keywords: ${screenshotAnalysis.keywords}, emotion: ${screenshotAnalysis.emotion}, look_and_feel: ${screenshotAnalysis.look_and_feel} `
      } catch (error) {
        console.error('Screenshot analysis failed:', error)
        // Continue without screenshot analysis
        sourceMetadata.screenshot_analysis_error = error instanceof Error ? error.message : String(error)
      }
    }

    // 2. Get project metadata if selected
    if (projectId) {
      try {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('keywords, emotion, look_and_feel')
          .eq('id', projectId)
          .single()
        
        if (projectError) {
          console.error('Project fetch error:', projectError)
          sourceMetadata.project_fetch_error = projectError.message
        } else if (project) {
          const projectMetadata: ProjectMetadata = project as ProjectMetadata
          sourceMetadata.project_metadata = projectMetadata
          combinedMetadata += `keywords: ${projectMetadata.keywords}, emotion: ${projectMetadata.emotion}, look_and_feel: ${projectMetadata.look_and_feel}, `
        }
      } catch (error) {
        console.error('Project metadata error:', error)
        sourceMetadata.project_error = error instanceof Error ? error.message : String(error)
      }
    }

    // 3. Add user keywords
    if (keywords) {
      combinedMetadata += keywords
    }

    // 4. Handle keywords-only case (no screenshot, no project)
    if (!screenshot && !projectId && keywords) {
      try {
        // Return 6 assets from semantic search only
        const assets = await searchSimilarAssets(supabase, keywords, 6)
        return new Response(JSON.stringify({
          results: assets.map((asset: Asset) => ({
            id: asset.id,
            type: 'asset',
            image_url: asset.file_url,
            metadata: {
              keywords: asset.keywords,
              emotion: asset.emotion,
              look_and_feel: asset.look_and_feel
            },
            similarity_score: asset.similarity_score
          })),
          total_count: assets.length,
          source_metadata: { combined_search_query: keywords }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } catch (error) {
        console.error('Keywords-only search failed:', error)
        return new Response(JSON.stringify({ 
          error: 'Search failed', 
          details: error.message 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
    }

    // 5. Get similar assets first, then determine image generation strategy
    let similarAssets: Asset[] = []
    try {
      similarAssets = await searchSimilarAssets(supabase, combinedMetadata.trim(), 6)
    } catch (error) {
      console.error('Asset search failed:', error)
      sourceMetadata.asset_search_error = error instanceof Error ? error.message : String(error)
      // Continue with empty assets array
    }

    // Calculate how many images to generate based on assets found
    const assetsFound = similarAssets.length
    let imagesToGenerate: number
    let assetsToUse: number

    if (assetsFound <= 3) {
      // Use all found assets, generate images to reach 6 total
      assetsToUse = assetsFound
      imagesToGenerate = 6 - assetsFound
    } else {
      // More than 3 assets found: use top 3 assets + generate 3 images
      assetsToUse = 3
      imagesToGenerate = 3
    }

    console.log(`Found ${assetsFound} similar assets, using ${assetsToUse} assets, generating ${imagesToGenerate} images`)

    // Generate the calculated number of images
    let generatedImages: GeneratedImage[] = []
    if (imagesToGenerate > 0) {
      try {
        generatedImages = await generateImages(combinedMetadata.trim(), imagesToGenerate)
      } catch (error) {
        console.error('Image generation failed:', error)
        sourceMetadata.image_generation_error = error instanceof Error ? error.message : String(error)
        // Continue with empty generated images array
      }
    }

    // 6. Combine results (always totals 6)
    const results: ResultItem[] = [
      ...similarAssets.slice(0, assetsToUse).map((asset: Asset) => ({ // Use calculated number of assets
        id: asset.id,
        type: 'asset' as const,
        image_url: asset.file_url,
        metadata: {
          keywords: asset.keywords,
          emotion: asset.emotion,
          look_and_feel: asset.look_and_feel
        },
        similarity_score: asset.similarity_score
      }))
    ]

    // Process generated images with metadata extraction
    for (const img of generatedImages) {
      try {
        const metadata = await extractMetadataFromPrompt(img.prompt)
        results.push({
          id: crypto.randomUUID(),
          type: 'generated' as const,
          image_url: img.url,
          metadata: metadata,
          prompt_used: img.prompt,
          metadata_variation: img.metadataVariation // Include the variation used
        })
      } catch (error) {
        console.error('Failed to extract metadata for generated image:', error)
        // Add image with fallback metadata
        results.push({
          id: crypto.randomUUID(),
          type: 'generated' as const,
          image_url: img.url,
          metadata: {
            keywords: img.prompt.substring(0, 120),
            emotion: 'creative, inspiring',
            look_and_feel: 'professional, artistic'
          },
          prompt_used: img.prompt,
          metadata_variation: img.metadataVariation // Include the variation used
        })
      }
    }

    console.log(`Returning ${results.length} total results: ${assetsToUse} assets + ${generatedImages.length} generated`)

    // Check if any images are using Azure blob URLs (which expire)
    const hasExpiringImages = generatedImages.some(img => img.originalUrl && img.originalUrl.includes('oaidalleapiprodscus.blob.core.windows.net'))
    
    sourceMetadata.combined_search_query = combinedMetadata.trim()
    sourceMetadata.assets_found = assetsFound
    sourceMetadata.assets_used = assetsToUse
    sourceMetadata.images_generated = generatedImages.length
    
    // Add warning about expiring images if applicable
    if (hasExpiringImages) {
      sourceMetadata.image_expiration_warning = 'Some images could not be uploaded to storage and may expire in ~2 hours. Most images are now permanently stored in Supabase.'
      sourceMetadata.temporary_solution_note = 'Images are automatically uploaded to Supabase storage for permanent access. Fallback to Azure URLs only if upload fails.'
    } else {
      sourceMetadata.storage_success_note = 'All generated images successfully uploaded to Supabase storage for permanent access.'
    }

    return new Response(JSON.stringify({
      results,
      total_count: results.length,
      source_metadata: sourceMetadata
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Explore function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Explore function failed', 
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function analyzeScreenshot(screenshot: string): Promise<ScreenshotAnalysis> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  // ===== CONFIGURABLE SYSTEM PROMPT FOR SCREENSHOT ANALYSIS =====
  // Edit this string to optimize the screenshot analysis prompt
  const DEFAULT_SCREENSHOT_PROMPT = `Analyze this design screenshot and extract:
1. Keywords (max 120 chars): Design elements, style, objects, themes
2. Emotion (max 120 chars): Feelings and mood conveyed  
3. Look and feel (max 120 chars): Visual style, aesthetic, composition

Respond in JSON format: {"keywords": "...", "emotion": "...", "look_and_feel": "..."}`
  // ===== END CONFIGURABLE PROMPT =====
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: DEFAULT_SCREENSHOT_PROMPT
            },
            {
              type: 'image_url',
              image_url: { url: screenshot }
            }
          ]
        }],
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // FIX: Add error checking for OpenAI response
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid OpenAI response format')
    }

    try {
      const content = result.choices[0].message.content
      
      // Handle responses wrapped in markdown code blocks (```json ... ```)
      let jsonContent = content.trim()
      
      // Remove markdown code block formatting if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Clean up any remaining whitespace and newlines
      jsonContent = jsonContent.trim()
      
      console.log('Extracted JSON content:', jsonContent)
      
      const analysis = JSON.parse(jsonContent)
      
      // Validate the response structure
      if (!analysis.keywords || !analysis.emotion || !analysis.look_and_feel) {
        throw new Error('Invalid analysis response structure - missing required fields')
      }
      
      return analysis
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', result.choices[0].message.content)
      throw new Error(`Failed to parse screenshot analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
    }
  } catch (error) {
    console.error('Screenshot analysis function failed:', error)
    throw error // Re-throw to be handled by the caller
  }
}

async function searchSimilarAssets(supabase: SupabaseClient, searchText: string, limit: number): Promise<Asset[]> {
  try {
    // Generate embedding for search text
    const embedding = await generateEmbedding(searchText)
    
    // Vector similarity search
    const { data: assets, error } = await supabase.rpc('search_similar_assets', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit
    })

    // FIX: Add error checking for Supabase RPC call
    if (error) {
      console.error('Supabase RPC error:', error)
      throw new Error(`Database search failed: ${error.message}`)
    }

    return assets || []
  } catch (error) {
    console.error('Asset search function failed:', error)
    throw error // Re-throw to be handled by the caller
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI Embeddings API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // FIX: Add error checking for embeddings response
    if (!result.data || !result.data[0] || !result.data[0].embedding) {
      throw new Error('Invalid embeddings response format')
    }

    return result.data[0].embedding
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw error // Re-throw to be handled by the caller
  }
}

async function generateImages(prompt: string, count: number): Promise<GeneratedImage[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  // ===== CONFIGURABLE SYSTEM PROMPT FOR DALL-E IMAGE GENERATION =====
  // Edit this string to optimize the DALL-E image generation prompt
  const DEFAULT_DALLE_PROMPT = `Create a design inspiration based on: `
  // ===== END CONFIGURABLE PROMPT =====
  
  // Initialize Supabase client for storage
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Generate semantic variations of the metadata for diverse image generation
  const metadataVariations = await generateMetadataVariations(prompt, count)
  
  // FIX: Generate multiple images properly with better error handling
  const images: GeneratedImage[] = []
  const maxRetries = 2 // Allow 2 retries per image
  
  for (let i = 0; i < count; i++) {
    let imageGenerated = false
    let retryCount = 0
    
    // Get the variation for this image
    const variation = metadataVariations[i] || metadataVariations[0] // Fallback to first variation
    
    while (!imageGenerated && retryCount <= maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: `${DEFAULT_DALLE_PROMPT}${variation}.`, // Use variation instead of original prompt
            n: 1,
            size: '1024x1024'
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`DALL-E API error for image ${i + 1} (attempt ${retryCount + 1}):`, response.status, response.statusText, errorText)
          
          if (retryCount === maxRetries) {
            console.error(`Failed to generate image ${i + 1} after ${maxRetries + 1} attempts`)
            break
          }
          
          retryCount++
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          continue
        }

        const result = await response.json()
        
        if (result.data && result.data[0] && result.data[0].url) {
          // Download the image and upload to Supabase storage
          try {
            const imageUrl = result.data[0].url
            console.log(`Downloading generated image ${i + 1} from:`, imageUrl)
            
            const imageResponse = await fetch(imageUrl)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
            }
            
            const imageBuffer = await imageResponse.arrayBuffer()
            const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
            
            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const filename = `dalle-generated-${timestamp}-${i + 1}.png`
            
            // Upload to Supabase storage
            console.log(`Uploading image ${i + 1} to Supabase storage:`, filename)
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('nudge-assets')
              .upload(filename, imageBlob, {
                contentType: 'image/png',
                cacheControl: '3600'
              })
            
            if (uploadError) {
              throw new Error(`Failed to upload to Supabase: ${uploadError.message}`)
            }
            
            // Get public URL for the uploaded image
            const { data: urlData } = supabase.storage
              .from('nudge-assets')
              .getPublicUrl(filename)
            
            const publicUrl = urlData.publicUrl
            console.log(`Successfully uploaded image ${i + 1} to:`, publicUrl)
            
            images.push({
              url: publicUrl, // Use Supabase public URL
              prompt: `${DEFAULT_DALLE_PROMPT}${variation}`,
              originalUrl: imageUrl, // Keep original URL for reference
              filename: filename, // Store filename for potential future management
              metadataVariation: variation // Store the variation used for this image
            })
            
            imageGenerated = true
            console.log(`Successfully generated and uploaded image ${i + 1} with variation:`, variation)
            
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError)
            
            // Fallback: use the original URL but warn about expiration
            console.warn(`Using original Azure blob URL for image ${i + 1} - may expire in ~2 hours`)
            images.push({
              url: result.data[0].url,
              prompt: `${DEFAULT_DALLE_PROMPT}${variation}`,
              originalUrl: result.data[0].url,
              metadataVariation: variation
            })
            
            imageGenerated = true
          }
        } else {
          console.error(`Invalid DALL-E response format for image ${i + 1}:`, result)
          if (retryCount === maxRetries) break
          retryCount++
        }
        
      } catch (error) {
        console.error(`Exception during image ${i + 1} generation (attempt ${retryCount + 1}):`, error)
        
        if (retryCount === maxRetries) {
          console.error(`Failed to generate image ${i + 1} after ${maxRetries + 1} attempts`)
          break
        }
        
        retryCount++
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
    
    // If we couldn't generate this image after all retries, log it
    if (!imageGenerated) {
      console.error(`Could not generate image ${i + 1} after all retry attempts`)
    }
  }
  
  console.log(`Successfully generated ${images.length} out of ${count} requested images`)
  return images
}

/**
 * Generates semantic variations of metadata to create diverse but thematically related images
 * @param originalMetadata - The original metadata string (keywords, emotion, look_and_feel)
 * @param count - Number of variations to generate
 * @returns Array of metadata variations
 */
async function generateMetadataVariations(originalMetadata: string, count: number): Promise<string[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  try {
    // Parse the original metadata to extract keywords, emotion, and look_and_feel
    const metadataParts = originalMetadata.split(',').map(part => part.trim())
    
    // Create a prompt for generating variations
    const variationPrompt = `Given this design metadata: "${originalMetadata}"

Generate ${count} different variations that maintain the same theme but use different words. Each variation should have:
- Keywords: Similar concepts but different specific words (e.g., if "birthday cake" → use "party hat", "balloon", "gift box")
- Emotion: Related feelings but different expressions (e.g., if "joyful" → use "excited", "cheerful", "delighted")
- Look and feel: Similar aesthetic but different descriptors (e.g., if "vibrant" → use "colorful", "energetic", "lively")

Return ONLY the variations as a JSON array of strings, each containing the full metadata for one variation. Example format:
[
  "keywords: party hat, celebration, festive, emotion: excited, cheerful, look and feel: colorful, energetic, playful",
  "keywords: balloon, party, fun, emotion: delighted, happy, look and feel: vibrant, lively, cheerful"
]`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: variationPrompt
        }],
        max_tokens: 800,
        temperature: 0.8 // Add some creativity to variations
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response format')
    }

    try {
      const content = result.choices[0].message.content
      
      // Handle responses wrapped in markdown code blocks (```json ... ```)
      let jsonContent = content.trim()
      
      // Remove markdown code block formatting if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Clean up any remaining whitespace and newlines
      jsonContent = jsonContent.trim()
      
      console.log('Extracted metadata variations JSON:', jsonContent)
      
      const variations = JSON.parse(jsonContent)
      
      // Validate the response structure
      if (!Array.isArray(variations) || variations.length === 0) {
        throw new Error('Invalid variations response structure - not an array')
      }
      
      // Ensure we have enough variations
      while (variations.length < count) {
        variations.push(variations[0]) // Duplicate first variation if needed
      }
      
      // Return only the requested number of variations
      return variations.slice(0, count)
      
    } catch (parseError) {
      console.error('Failed to parse metadata variations response:', result.choices[0].message.content)
      throw new Error(`Failed to parse metadata variations: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
    }
    
  } catch (error) {
    console.error('Metadata variations generation failed:', error)
    
    // Fallback: create simple variations by adding numbers
    console.log('Using fallback metadata variations')
    const fallbackVariations: string[] = []
    
    for (let i = 0; i < count; i++) {
      if (i === 0) {
        fallbackVariations.push(originalMetadata)
      } else {
        fallbackVariations.push(`${originalMetadata} - variation ${i + 1}`)
      }
    }
    
    return fallbackVariations
  }
}

async function extractMetadataFromPrompt(userPrompt: string): Promise<ImageMetadata> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  // ===== CONFIGURABLE SYSTEM PROMPT FOR PROMPT METADATA GENERATION =====
  // Edit this string to optimize the prompt metadata generation
  const DEFAULT_METADATA_PROMPT = `Analyze the user's design prompt and extract:
1. Keywords (max 120 chars): Design elements, style, objects, themes, colors, patterns
2. Emotion (max 120 chars): Feelings and mood conveyed, emotional response
3. Look and feel (max 120 chars): Visual style, aesthetic, composition, design approach

Respond in JSON format: {"keywords": "...", "emotion": "...", "look_and_feel": "..."}`
  // ===== END CONFIGURABLE PROMPT =====
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `${DEFAULT_METADATA_PROMPT}\n\nUser prompt: ${userPrompt}`
        }],
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // FIX: Add error checking for OpenAI response
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid OpenAI response format')
    }

    try {
      const content = result.choices[0].message.content
      
      // Handle responses wrapped in markdown code blocks (```json ... ```)
      let jsonContent = content.trim()
      
      // Remove markdown code block formatting if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Clean up any remaining whitespace and newlines
      jsonContent = jsonContent.trim()
      
      console.log('Extracted metadata JSON content:', jsonContent)
      
      const metadata = JSON.parse(jsonContent)
      
      // Validate the response structure
      if (!metadata.keywords || !metadata.emotion || !metadata.look_and_feel) {
        throw new Error('Invalid metadata response structure - missing required fields')
      }
      
      return metadata
    } catch (parseError) {
      console.error('Failed to parse metadata response:', result.choices[0].message.content)
      throw new Error(`Failed to parse metadata response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
    }
    
  } catch (error) {
    console.error('Metadata extraction failed:', error)
    
    // FIX: Provide better fallback metadata based on the user prompt
    const fallbackKeywords = userPrompt.length > 120 ? userPrompt.substring(0, 120) : userPrompt
    const fallbackEmotion = 'creative, inspiring, modern'
    const fallbackLookAndFeel = 'professional, artistic, engaging'
    
    console.log(`Using fallback metadata for prompt: "${userPrompt}"`)
    
    return {
      keywords: fallbackKeywords,
      emotion: fallbackEmotion,
      look_and_feel: fallbackLookAndFeel
    }
  }
}