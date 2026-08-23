import { NextRequest, NextResponse } from 'next/server'
import { getEvaluation } from '@/lib/openai'
import { extractEvaluation } from '@/lib/evaluator-prompt'
import { Subject, Difficulty } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, topic, difficulty, conversation } = body as {
      subject: Subject
      topic?: string
      difficulty: Difficulty
      conversation: string
    }

    if (!subject || !difficulty || !conversation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const evaluationText = await getEvaluation(subject, topic, difficulty, conversation)
    const evaluation = extractEvaluation(evaluationText)

    if (!evaluation) {
      return NextResponse.json({
        understood: [],
        struggled: [],
        weakSpots: ['Session was too short for a detailed analysis'],
        misconceptions: [],
        overallScore: 0,
        suggestions: ['Try a longer session next time so I can better assess your understanding'],
      })
    }

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Evaluate API error:', error)
    return NextResponse.json(
      { error: 'Could not complete the detailed analysis this time.' },
      { status: 500 }
    )
  }
}
