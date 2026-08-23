import { NextRequest, NextResponse } from 'next/server'
import { getChatResponse } from '@/lib/openai'
import { detectCopiedContent } from '@/lib/copy-detector'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, subject, topic, difficulty, quickMode, history } = body

    if (!message || !subject) {
      return NextResponse.json({ reply: "Hey, I didn't catch that. Can you say it again?" })
    }

    const copyCheck = detectCopiedContent(message)
    if (copyCheck.isCopied) {
      return NextResponse.json({
        warning: true,
        reply: `Whoa 😅 that sounds a little too textbook-like (${copyCheck.reason}). Try explaining it in your own words — you don't need fancy terminology! I just want to understand it the way YOU do.`
      })
    }

    const reply = await getChatResponse(
      subject,
      topic,
      difficulty || 'medium',
      quickMode || false,
      history || [],
      message
    )

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: "Oops 😭 I lost my train of thought. Try sending that again?" })
  }
}
