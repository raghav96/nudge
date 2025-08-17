// supabase/functions/projects/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface CreateProjectRequest {
  name: string;
  brief?: string;
  keywords?: string;
  emotion?: string;
  look_and_feel?: string;
  auto_analyze?: boolean; // Default true - analyze brief with AI
}

interface UpdateProjectRequest {
  name?: string;
  brief?: string;
  keywords?: string;
  emotion?: string;
  look_and_feel?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const projectId = url.pathname.split('/').pop()

    switch (req.method) {
      case 'POST':
        return await createProject(req, supabase)
      case 'GET':
        if (projectId && projectId !== 'projects') {
          return await getProject(projectId, supabase)
        } else {
          return await listProjects(req, supabase)
        }
      case 'PUT':
        if (projectId) {
          return await updateProject(projectId, req, supabase)
        }
        break
      case 'DELETE':
        if (projectId) {
          return await deleteProject(projectId, supabase)
        }
        break
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Projects function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createProject(req: Request, supabase: any) {
  const { 
    name, 
    brief = '', 
    keywords, 
    emotion, 
    look_and_feel,
    auto_analyze = true 
  }: CreateProjectRequest = await req.json()

  // Validate required fields
  if (!name) {
    throw new Error('Project name is required')
  }

  let finalKeywords = keywords
  let finalEmotion = emotion
  let finalLookAndFeel = look_and_feel

  // Auto-analyze brief if metadata not provided and brief exists
  if (auto_analyze && brief && (!keywords || !emotion || !look_and_feel)) {
    console.log('Auto-analyzing project brief')
    try {
      const analysis = await analyzeBrief(brief)
      finalKeywords = keywords || analysis.keywords
      finalEmotion = emotion || analysis.emotion
      finalLookAndFeel = look_and_feel || analysis.look_and_feel
    } catch (analysisError) {
      console.warn('Auto-analysis failed:', analysisError.message)
      // Use provided values or defaults
      finalKeywords = keywords || 'business, professional, modern'
      finalEmotion = emotion || 'trustworthy, innovative, reliable'
      finalLookAndFeel = look_and_feel || 'clean, organized, contemporary'
    }
  } else if (!keywords || !emotion || !look_and_feel) {
    // Set defaults if no brief to analyze
    finalKeywords = keywords || 'business, professional, modern'
    finalEmotion = emotion || 'trustworthy, innovative, reliable'
    finalLookAndFeel = look_and_feel || 'clean, organized, contemporary'
  }

  // Generate combined metadata for embedding
  const combinedMetadata = `${finalKeywords} ${finalEmotion} ${finalLookAndFeel}`
  const embedding = await generateEmbedding(combinedMetadata)

  // Insert project into database
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name,
      brief,
      keywords: finalKeywords,
      emotion: finalEmotion,
      look_and_feel: finalLookAndFeel,
      combined_vector: embedding,
      user_id: null // For demo purposes, set to null. In production, get from auth
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return new Response(JSON.stringify({
    project,
    message: 'Project created successfully',
    auto_analyzed: auto_analyze && brief && (!keywords || !emotion || !look_and_feel)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function listProjects(req: Request, supabase: any) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('projects')
    .select('id, name, brief, keywords, emotion, look_and_feel, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Add search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,brief.ilike.%${search}%,keywords.ilike.%${search}%`)
  }

  const { data: projects, error, count } = await query

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return new Response(JSON.stringify({
    projects: projects || [],
    total: count || 0,
    limit,
    offset,
    hasMore: (count || 0) > offset + limit
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getProject(projectId: string, supabase: any) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    throw new Error(`Project not found: ${error.message}`)
  }

  return new Response(JSON.stringify({ project }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateProject(projectId: string, req: Request, supabase: any) {
  const { name, brief, keywords, emotion, look_and_feel }: UpdateProjectRequest = await req.json()

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (brief !== undefined) updates.brief = brief
  if (keywords !== undefined) updates.keywords = keywords
  if (emotion !== undefined) updates.emotion = emotion
  if (look_and_feel !== undefined) updates.look_and_feel = look_and_feel

  // Regenerate embedding if metadata changed
  if (keywords !== undefined || emotion !== undefined || look_and_feel !== undefined) {
    // Get current values for unchanged fields
    const { data: currentProject } = await supabase
      .from('projects')
      .select('keywords, emotion, look_and_feel')
      .eq('id', projectId)
      .single()

    const finalKeywords = keywords !== undefined ? keywords : currentProject.keywords
    const finalEmotion = emotion !== undefined ? emotion : currentProject.emotion
    const finalLookAndFeel = look_and_feel !== undefined ? look_and_feel : currentProject.look_and_feel

    const combinedMetadata = `${finalKeywords} ${finalEmotion} ${finalLookAndFeel}`
    updates.combined_vector = await generateEmbedding(combinedMetadata)
  }

  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    throw new Error(`Update failed: ${error.message}`)
  }

  return new Response(JSON.stringify({
    project,
    message: 'Project updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteProject(projectId: string, supabase: any) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  return new Response(JSON.stringify({
    message: 'Project deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function analyzeBrief(brief: string) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
  const prompt = `Analyze this project brief and extract:
1. Keywords (max 120 chars): Main themes, industry, style preferences, requirements
2. Emotion (max 120 chars): Desired feelings and brand personality
3. Look and feel (max 120 chars): Visual style, aesthetic direction, design approach

Brief: "${brief}"

Respond in JSON format: {"keywords": "...", "emotion": "...", "look_and_feel": "..."}`
  
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
        content: prompt
      }],
      max_tokens: 300
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenAI response')
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
    
    console.log('Extracted brief analysis JSON content:', jsonContent)
    
    const analysis = JSON.parse(jsonContent)
    
    // Validate the response structure
    if (!analysis.keywords || !analysis.emotion || !analysis.look_and_feel) {
      throw new Error('Invalid analysis response structure - missing required fields')
    }
    
    return analysis
  } catch (error) {
    console.error('Failed to parse brief analysis response:', result.choices[0].message.content)
    throw new Error(`Failed to parse analysis response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`)
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')!
  
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
    throw new Error(`OpenAI Embeddings API error: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.data?.[0]?.embedding) {
    throw new Error('Invalid embeddings response')
  }

  return result.data[0].embedding
}