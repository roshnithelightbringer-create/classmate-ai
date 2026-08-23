export function detectCopiedContent(text: string): { isCopied: boolean; reason?: string } {
  const trimmed = text.trim()
  if (!trimmed) return { isCopied: false }

  const textbookPatterns = [
    { pattern: /^in conclusion,/i, label: 'starts with "In conclusion"' },
    { pattern: /^as we have seen,/i, label: 'starts with "As we have seen"' },
    { pattern: /^the concept of/i, label: 'starts with "The concept of"' },
    { pattern: /^according to/i, label: 'starts with "According to"' },
    { pattern: /^it is important to note that/i, label: 'starts with "It is important to note"' },
    { pattern: /^furthermore,/i, label: 'starts with "Furthermore"' },
    { pattern: /^moreover,/i, label: 'starts with "Moreover"' },
    { pattern: /^in other words,/i, label: 'starts with "In other words"' },
    { pattern: /^thus,/i, label: 'starts with "Thus"' },
    { pattern: /^therefore,/i, label: 'starts with "Therefore"' },
  ]

  for (const { pattern, label } of textbookPatterns) {
    if (pattern.test(trimmed)) {
      return { isCopied: true, reason: label }
    }
  }

  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgWordsPerSentence = trimmed.split(/\s+/).length / Math.max(sentences.length, 1)
  const sentenceCount = sentences.length

  if (avgWordsPerSentence > 35 && sentenceCount > 2) {
    return { isCopied: true, reason: 'very long, dense sentences' }
  }

  return { isCopied: false }
}
