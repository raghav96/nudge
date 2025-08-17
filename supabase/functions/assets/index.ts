// supabase/functions/assets/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

// Validate required environment variables
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required")
}
if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required")
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
}

// Type definitions
interface CreateAssetRequest {
  filename: string;
  file_url: string;  // Direct URL to uploaded image
  project_id: string; // Required: ID of the project this asset belongs to
  keywords?: string;
  emotion?: string;
  look_and_feel?: string;
  tags?: string[];
  auto_analyze?: boolean; // Default true - analyze image with AI
}

interface UpdateAssetRequest {
  keywords?: string;
  emotion?: string;
  look_and_feel?: string;
  tags?: string[];
}

interface ImageAnalysis {
  keywords: string;
  emotion: string;
  look_and_feel: string;
}

interface Asset {
  id: string;
  filename: string;
  file_url: string;
  project_id: string; // ID of the project this asset belongs to
  keywords: string;
  emotion: string;
  look_and_feel: string;
  tags: string[];
  combined_vector: number[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use the environment variables declared at the top
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const assetId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null

    switch (req.method) {
      case 'POST':
        return await createAsset(req, supabase)
      case 'GET':
        if (assetId && assetId !== 'assets') {
          return await getAsset(assetId, supabase)
        } else {
          // Check if we're requesting assets for a specific project
          const projectId = url.searchParams.get('project_id')
          if (projectId) {
            return await getProjectAssets(projectId, supabase)
          } else {
            return await listAssets(req, supabase)
          }
        }
      case 'PUT':
        if (assetId && assetId !== 'assets') {
          return await updateAsset(assetId, req, supabase)
        }
        break
      case 'DELETE':
        if (assetId && assetId !== 'assets') {
          return await deleteAsset(assetId, supabase)
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Assets function error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.toString() : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createAsset(req: Request, supabase: SupabaseClient): Promise<Response> {
  const { 
    filename, 
    file_url, 
    project_id, 
    keywords, 
    emotion, 
    look_and_feel, 
    tags = [],
    auto_analyze = true 
  }: CreateAssetRequest = await req.json()

  // Validate required fields
  if (!filename || !file_url || !project_id) {
    throw new Error('filename, file_url, and project_id are required')
  }

  // Validate URL format
  try {
    new URL(file_url)
  } catch {
    throw new Error('Invalid file_url format')
  }

  let finalKeywords = keywords
  let finalEmotion = emotion
  let finalLookAndFeel = look_and_feel

  // Auto-analyze image if metadata not provided
  if (auto_analyze && (!keywords || !emotion || !look_and_feel)) {
    console.log('Auto-analyzing image:', file_url)
    try {
      const analysis: ImageAnalysis = await analyzeImageUrl(file_url)
      finalKeywords = keywords || analysis.keywords
      finalEmotion = emotion || analysis.emotion
      finalLookAndFeel = look_and_feel || analysis.look_and_feel
    } catch (analysisError) {
      console.warn('Auto-analysis failed:', analysisError.message)
      // Use provided values or defaults
      finalKeywords = keywords || 'design, visual, creative'
      finalEmotion = emotion || 'professional, modern'
      finalLookAndFeel = look_and_feel || 'clean, structured'
    }
  }

  // Generate combined metadata for embedding
  const combinedMetadata = `${finalKeywords} ${finalEmotion} ${finalLookAndFeel}`
  const embedding = await generateEmbedding(combinedMetadata)

  // Insert asset into database
  const { data: asset, error } = await supabase
    .from('assets')
    .insert({
      filename,
      file_url,
      project_id,
      keywords: finalKeywords,
      emotion: finalEmotion,
      look_and_feel: finalLookAndFeel,
      combined_vector: embedding,
      tags,
      is_public: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return new Response(JSON.stringify({
    asset,
    message: 'Asset created successfully',
    auto_analyzed: auto_analyze && (!keywords || !emotion || !look_and_feel)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function listAssets(req: Request, supabase: SupabaseClient): Promise<Response> {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('search')
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean)
  const projectId = url.searchParams.get('project_id') // New: filter by project

  // Validate pagination parameters
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100')
  }
  if (offset < 0) {
    throw new Error('Offset must be non-negative')
  }

  // Validate project_id if provided
  if (projectId && projectId.trim() === '') {
    throw new Error('project_id cannot be empty')
  }

  let query = supabase
    .from('assets')
    .select('id, filename, file_url, project_id, keywords, emotion, look_and_feel, tags, created_at', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filter by project_id if provided
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  // Add search filter
  if (search) {
    query = query.or(`keywords.ilike.%${search}%,emotion.ilike.%${search}%,look_and_feel.ilike.%${search}%`)
  }

  // Add tags filter
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags)
  }

  const { data: assets, error, count } = await query

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return new Response(JSON.stringify({
    assets: assets || [],
    total: count || 0,
    limit,
    offset,
    project_id: projectId || null,
    hasMore: (count || 0) > offset + limit
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getAsset(assetId: string, supabase: SupabaseClient): Promise<Response> {
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single()

  if (error) {
    throw new Error(`Asset not found: ${error.message}`)
  }

  return new Response(JSON.stringify({ asset }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getProjectAssets(projectId: string, supabase: SupabaseClient): Promise<Response> {
  // Get all assets for a specific project
  const { data: assets, error } = await supabase
    .from('assets')
    .select('id, filename, file_url, keywords, emotion, look_and_feel, tags, created_at')
    .eq('project_id', projectId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch project assets: ${error.message}`)
  }

  return new Response(JSON.stringify({
    assets: assets || [],
    project_id: projectId,
    total: assets?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateAsset(assetId: string, req: Request, supabase: SupabaseClient): Promise<Response> {
  const { keywords, emotion, look_and_feel, tags }: UpdateAssetRequest = await req.json()

  const updates: Partial<Asset> = {}
  if (keywords !== undefined) updates.keywords = keywords
  if (emotion !== undefined) updates.emotion = emotion
  if (look_and_feel !== undefined) updates.look_and_feel = look_and_feel
  if (tags !== undefined) updates.tags = tags

  // Regenerate embedding if metadata changed
  if (keywords !== undefined || emotion !== undefined || look_and_feel !== undefined) {
    try {
      // Get current values for unchanged fields
      const { data: currentAsset, error: fetchError } = await supabase
        .from('assets')
        .select('keywords, emotion, look_and_feel')
        .eq('id', assetId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch current asset: ${fetchError.message}`)
      }

      if (!currentAsset) {
        throw new Error('Asset not found')
      }

      const finalKeywords = keywords !== undefined ? keywords : currentAsset.keywords
      const finalEmotion = emotion !== undefined ? emotion : currentAsset.emotion
      const finalLookAndFeel = look_and_feel !== undefined ? look_and_feel : currentAsset.look_and_feel

      const combinedMetadata = `${finalKeywords} ${finalEmotion} ${finalLookAndFeel}`
      updates.combined_vector = await generateEmbedding(combinedMetadata)
    } catch (error) {
      console.error('Failed to regenerate embedding:', error)
      throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const { data: asset, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId)
    .select()
    .single()

  if (error) {
    throw new Error(`Update failed: ${error.message}`)
  }

  return new Response(JSON.stringify({
    asset,
    message: 'Asset updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteAsset(assetId: string, supabase: SupabaseClient): Promise<Response> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  return new Response(JSON.stringify({
    message: 'Asset deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function analyzeImageUrl(imageUrl: string): Promise<ImageAnalysis> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  // Validate image URL format
  try {
    const url = new URL(imageUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Image URL must use HTTP or HTTPS protocol')
    }
  } catch {
    throw new Error('Invalid image URL format')
  }
  
  const prompt = `Analyze this design/image and extract:
1. Keywords (max 120 chars): Design elements, style, objects, themes, colors
2. Emotion (max 120 chars): Feelings and mood conveyed
3. Look and feel (max 120 chars): Visual style, aesthetic, composition

Respond in JSON format: {"keywords": "...", "emotion": "...", "look_and_feel": "..."}`
  
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
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
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
      
      console.log('Extracted analysis JSON content:', jsonContent)
      
      const analysis = JSON.parse(jsonContent)
      
      // Validate the response structure
      if (!analysis.keywords || !analysis.emotion || !analysis.look_and_feel) {
        throw new Error('Invalid analysis response structure')
      }
      
      // Validate response content lengths
      if (analysis.keywords.length > 120 || analysis.emotion.length > 120 || analysis.look_and_feel.length > 120) {
        throw new Error('Analysis response exceeds character limits')
      }
      
      return analysis as ImageAnalysis
    } catch (parseError) {
      console.error('Failed to parse analysis response:', result.choices[0].message.content)
      throw new Error(`Failed to parse analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
    }
  } catch (error) {
    console.error('Image analysis failed:', error)
    throw error
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
      const errorText = await response.text()
      throw new Error(`OpenAI Embeddings API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    
    if (!result.data?.[0]?.embedding) {
      throw new Error('Invalid embeddings response format')
    }

    return result.data[0].embedding
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw error
  }
}