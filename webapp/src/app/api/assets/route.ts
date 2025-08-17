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
    const formData = await request.formData()
    const keywords = formData.get('keywords') as string
    const emotion = formData.get('emotion') as string
    const lookAndFeel = formData.get('lookAndFeel') as string
    const userEmail = formData.get('userEmail') as string
    const imageFile = formData.get('imageFile') as File

    // Validate input
    if (!userEmail || !imageFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
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

    // Generate filename
    const timestamp = Date.now()
    const fileExtension = imageFile.name.split('.').pop()
    const filename = `asset-${timestamp}.${fileExtension}`

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('nudge-assets')
      .upload(filename, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nudge-assets')
      .getPublicUrl(filename)

    // Generate AI metadata if not provided
    let finalKeywords = keywords
    let finalEmotion = emotion
    let finalLookAndFeel = lookAndFeel

    if (!keywords || !emotion || !lookAndFeel) {
      try {
        // Convert image to base64 for OpenAI analysis
        const arrayBuffer = await imageFile.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = imageFile.type

        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image and extract: 1) Keywords (comma-separated, max 120 chars), 2) Emotion (comma-separated, max 120 chars), 3) Look and feel (comma-separated, max 120 chars). Return as JSON only.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        })

        const aiResponse = completion.choices[0]?.message?.content
        if (aiResponse) {
          const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '')
          const metadata = JSON.parse(cleanedResponse)
          
          finalKeywords = keywords || metadata.keywords || ''
          finalEmotion = emotion || metadata.emotion || ''
          finalLookAndFeel = lookAndFeel || metadata.look_and_feel || ''
        }
      } catch (aiError) {
        console.warn('AI analysis failed, using provided metadata:', aiError)
      }
    }

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert([{
        user_id: user.id,
        filename,
        file_url: publicUrl,
        file_type: imageFile.type,
        keywords: finalKeywords,
        emotion: finalEmotion,
        look_and_feel: finalLookAndFeel,
        is_public: true,
      }])
      .select()
      .single()

    if (assetError) {
      return NextResponse.json(
        { error: 'Failed to create asset record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      asset,
      message: 'Asset uploaded successfully with AI analysis'
    })

  } catch (error) {
    console.error('Asset creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Assets fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
