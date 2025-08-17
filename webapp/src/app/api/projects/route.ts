import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import OpenAI from 'openai'

// Initialize OpenAI client only when needed
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  try {
    const { name, brief, userEmail } = await request.json()
    
    // Validate input
    if (!name || !brief || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get or create user
    let user = null
    
    // Try to get existing user
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      user = existingUser
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ email: userEmail }])
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }
      user = newUser
    }

    // Generate AI metadata using OpenAI
    const prompt = `Analyze this project brief and extract:
1. Keywords (comma-separated, max 120 chars)
2. Emotion (comma-separated, max 120 chars)  
3. Look and feel (comma-separated, max 120 chars)

Brief: ${brief}

Return as JSON:
{
  "keywords": "keyword1, keyword2, keyword3",
  "emotion": "emotion1, emotion2, emotion3",
  "look_and_feel": "style1, style2, style3"
}`

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('Failed to get AI response')
    }

    // Parse AI response and clean markdown
    const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '')
    const metadata = JSON.parse(cleanedResponse)

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        name,
        brief,
        user_id: user.id,
        keywords: metadata.keywords,
        emotion: metadata.emotion,
        look_and_feel: metadata.look_and_feel,
      }])
      .select()
      .single()

    if (projectError) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      project,
      message: 'Project created successfully with AI analysis'
    })

  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
