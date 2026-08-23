import OpenAI from 'openai';
import { Subject, Difficulty } from '@/types';

export async function getEvaluation(subject: Subject, topic: string | undefined, difficulty: Difficulty, conversation: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '{}';
  const openai = new OpenAI({ apiKey });
  const { buildEvaluatorPrompt } = await import('./evaluator-prompt');
  const prompt = buildEvaluatorPrompt(subject, topic, difficulty, conversation);
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.3, max_tokens: 800,
    messages: [
      { role: 'system', content: 'You are an expert educational evaluator. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0]?.message?.content || '{}';
}