import { Subject, Difficulty, Evaluation } from '@/types';

export function buildEvaluatorPrompt(subject: Subject, topic: string | undefined, difficulty: Difficulty, conversation: string): string {
  return `You are an expert educational evaluator. You silently observe a conversation where a student is teaching a confused classmate.

SUBJECT: ${subject}
${topic ? `TOPIC: ${topic}` : ''}
DIFFICULTY LEVEL: ${difficulty}

CONVERSATION TO EVALUATE: ${conversation}

TASK: Analyze the student's understanding based on this conversation. Focus on:

1. What concepts does the student clearly understand? List them.
2. What concepts does the student struggle with? List them.
3. What specific weak spots or misconceptions did you detect?
4. Did the student make any factual errors the classmate did not catch? (misconceptions)
5. Overall understanding score (0-100).
6. Suggestions for what the student should study next.

Respond ONLY with a valid JSON object in this exact format, no other text:
{
  "understood": ["concept1", "concept2"],
  "struggled": ["concept1", "concept2"],
  "weakSpots": ["specific weak area 1", "specific weak area 2"],
  "misconceptions": [
    {
      "topic": "topic name",
      "studentSaid": "what the student said that was wrong",
      "correction": "the correct information"
    }
  ],
  "overallScore": 75,
  "suggestions": ["suggestion1", "suggestion2"]
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as Evaluation;
      } catch {
        return null;
      }
    }
    return null;
  }
}