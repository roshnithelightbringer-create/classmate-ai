import OpenAI from 'openai'
import { Subject, Difficulty } from '@/types'

let client: OpenAI | null = null

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  if (!client) client = new OpenAI({ apiKey: key })
  return client
}

export async function getChatResponse(
  subject: Subject,
  topic: string | undefined,
  difficulty: string,
  quickMode: boolean,
  history: { role: string; content: string }[],
  message: string
): Promise<string> {
  const openai = getClient()
  if (!openai) {
    return getFallbackReply(subject)
  }

  const { buildClassmatePrompt } = await import('./classmate-prompt')
  const systemPrompt = buildClassmatePrompt(subject, topic, difficulty as Difficulty, quickMode)

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.8,
    max_tokens: 200,
  })

  return response.choices[0]?.message?.content || getFallbackReply(subject)
}

export async function getEvaluation(
  subject: Subject,
  topic: string | undefined,
  difficulty: Difficulty,
  conversation: string
): Promise<string> {
  const openai = getClient()
  if (!openai) return '{}'

  const { buildEvaluatorPrompt } = await import('./evaluator-prompt')
  const prompt = buildEvaluatorPrompt(subject, topic, difficulty, conversation)

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      { role: 'system', content: 'You are an expert educational evaluator. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ],
  })

  return response.choices[0]?.message?.content || '{}'
}

function getFallbackReply(subject: Subject): string {
  const replies: Record<string, string> = {
    physics: "Hmm, I'm still confused about forces. Like, if I push something, why does it move? Can you explain that?",
    chemistry: "Okay but like... how do I know which atoms will bond with each other? I'm so confused.",
    biology: "I think I get it a little. But what about mitochondria? I always forget what they do.",
    maths: "I'm trying to follow but I got lost at the formula part. Can you break it down more?",
    'computer-science': "Wait, I still don't get why we need that. Can you explain it differently?",
    history: "Okay but when exactly did that happen? And why? I keep mixing up the timeline.",
    general: "I'm still not sure I understand. Can you explain it in a different way?",
  }
  return replies[subject] || replies.general
}
