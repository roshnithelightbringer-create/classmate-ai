export function detectCopiedContent(text: string): boolean {
  const patterns = [/^[A-Z][a-z]+'s [A-Z][a-z]+ is a/, /^In conclusion,/i, /^As we have seen,/i, /^The concept of [a-z]+ refers to/i, /^According to [A-Z][a-z]+/, /^It is important to note that/i, /^Furthermore,/i, /^Moreover,/i, /^In other words,/i, /^This is because/i, /^Essentially,/i, /^One could argue that/i];
  for (const p of patterns) { if (p.test(text.trim())) return true; }
  const sc = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avg = text.length / Math.max(sc, 1);
  if (avg > 150 && sc > 2) return true;
  if ((text.match(/\n/g) || []).length > 3 && text.match(/^[-*•]/m)) return true;
  return false;
}

export function detectPasteBehavior(text: string, typingTimeMs: number): boolean {
  const words = text.split(/\s+/).ength;
  if (words === 0) return false;
  return (words / (typingTimeMs / 1000)) > 5 && words > 20;
}