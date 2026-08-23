import { Subject, Difficulty, Evaluation } from '@/types';

export function buildEvaluatorPrompt(subject: Subject, topic: string | undefined, difficulty: Difficulty, conversation: string): string {
  return `You are an expert educational evaluator. You silently observe a conversation where a student is teaching a confused classmate.

SUBJECT: ${subject}
${topic ? `TOPIC: ${topic}` : ''}
DIFFICULTY: ${difficulty}

CONVERSATION:
${conversation}

Analyze understanding. Respond ONLY with valid JSON:
{
  "understood": ["concepts they explained well"],
  "struggled": ["concepts they had trouble with"],
  "weakSpots": ["specific areas to revise"],
  "misconceptions": [{"topic": "x", "studentSaid": "wrong", "correction": "right"}],
  "overallScore": 75,
  "suggestions": ["suggestions"]
}`;
}

export function extractEvaluation(text: string): Evaluation | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed.understood && parsed.struggled && parsed.weakSpots && parsed.overallScore !== undefined) {
      return parsed as Evaluation;
    }
    return null;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as Evaluation; }
      catch { return null; }
    }
    return null;
  }
}