export function detectCopiedContent(text: string): boolean {
  const patterns = [
    /^[A-Z][a-z]+'s [A-Z][a-z]+ is a/,
    /^In conclusion,/i, /^As we have seen,/i,
    /^The concept of/i, /^According to/i,
    /^It is important to note that/i,
    /^Furthermore,/i, /^Moreover,/i,
  ];
  for (const p of patterns) {
    if (p.test(text.trim())) return true;
  }
  const sc = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avg = text.length / Math.max(sc, 1);
  if (avg > 150 && sc > 2) return true;
  return false;
}