import OpenAI from 'openai';
import { Subject, Difficulty } from '@/types';
import { buildClassmatePrompt } from './classmate-prompt';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function getClassmateResponse(
  subject: Subject,
  topic: string | undefined,
  difficulty: Difficulty,
  messageHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const systemPrompt = buildClassmatePrompt(subject, topic, difficulty);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messageHistory,
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || 'Hmm, I got confused by my own thoughts. Can you help me again?';
}

export async function getEvaluation(
  subject: Subject,
  topic: string | undefined,
  difficulty: Difficulty,
  conversation: string
): Promise<string> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const { buildEvaluatorPrompt } = await import('./evaluator-prompt');
  const prompt = buildEvaluatorPrompt(subject, topic, difficulty, conversation);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are an expert educational evaluator. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content || '{}';
}

export function detectCopyPaste(input: string): boolean {
  const suspiciousPatterns = [
    /^.{200,}$/,
    /^.{100,}\.\s{0,1}[A-Z]/,
    /^(The|In|This|An|A|One|There|It) .{50,}\./,
  ];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input.trim())) return true;
  }
  return false;
}