import { Subject, Difficulty, Evaluation } from '@/types'

export function buildEvaluatorPrompt(
  subject: Subject,
  topic: string | undefined,
  difficulty: Difficulty,
  conversation: string
): string {
  return `You are an expert educational evaluator. You silently observe a conversation where a student is teaching a confused classmate.

SUBJECT: ${subject}
${topic ? `TOPIC: ${topic}` : ''}
DIFFICULTY: ${difficulty}

CONVERSATION:
${conversation}

Analyze the student's understanding based on how well they explained concepts to their classmate.

Respond ONLY with valid JSON in this exact format:
{
  "understood": ["concept A they explained clearly"],
  "struggled": ["concept B they had trouble explaining"],
  "weakSpots": ["specific area to review"],
  "misconceptions": [{"topic": "concept", "studentSaid": "what they said wrong", "correction": "the correct explanation"}],
  "overallScore": 75,
  "suggestions": ["practical suggestion"]
}

The score should reflect genuine understanding shown, not perfection. Be honest. If the student did well, score 70-95. If they struggled, score 30-60.`
}

export function extractEvaluation(text: string): Evaluation | null {
  try {
    const parsed = JSON.parse(text)
    if (parsed.understood && parsed.struggled && parsed.weakSpots && parsed.overallScore !== undefined) {
      return parsed as Evaluation
    }
    return null
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as Evaluation } catch { return null }
    }
    return null
  }
}
