'use client'

import { useState, useEffect } from 'react'
import { Subject, Difficulty, SUBJECT_LABELS, SUBJECT_EMOJIS, SessionRecord, Evaluation } from '@/types'

const SUBJECTS: Subject[] = ['physics', 'chemistry', 'biology', 'maths', 'computer-science', 'history', 'general']
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

type Step = 'setup' | 'chat' | 'report'

interface Message {
  id: string
  role: 'user' | 'classmate'
  content: string
  timestamp: number
}

export default function Home() {
  const [step, setStep] = useState<Step>('setup')
  const [subject, setSubject] = useState<Subject>('physics')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [quickMode, setQuickMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningText, setWarningText] = useState('')
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('classmate-sessions')
    if (stored) {
      try { setSessions(JSON.parse(stored)) } catch {}
    }
  }, [])

  const saveSession = (score: number, understood: string[], struggled: string[]) => {
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      subject,
      topic: topic || 'General',
      difficulty,
      date: Date.now(),
      score,
      understood,
      struggled,
    }
    const updated = [record, ...sessions].slice(0, 20)
    setSessions(updated)
    localStorage.setItem('classmate-sessions', JSON.stringify(updated))
  }

  const getOpeningLine = (): string => {
    const openings = [
      `Hey... I'm really nervous about my ${SUBJECT_LABELS[subject]} test 😰 Can you help me understand? I'm so confused.`,
      `Okay so I'm panicking a bit. ${topic || SUBJECT_LABELS[subject]} is NOT clicking for me. Can you explain it like I'm dumb? 😅`,
      `I have a ${SUBJECT_LABELS[subject]} test soon and I keep mixing everything up. Can you help me figure it out? 🙏`,
      `Hey! I've been trying to study ${topic || SUBJECT_LABELS[subject]} but I'm stuck. Can you teach me? I promise I'll try to keep up!`,
    ]
    if (quickMode) {
      return `Okay, speed mode! ⚡ I'm short on time. Teach me the most important things about ${topic || SUBJECT_LABELS[subject]} that I NEED to remember for my test!`
    }
    return openings[Math.floor(Math.random() * openings.length)]
  }

  const startSession = () => {
    setMessages([{ id: crypto.randomUUID(), role: 'classmate', content: getOpeningLine(), timestamp: Date.now() }])
    setStep('chat')
    setShowWarning(false)
    setWarningText('')
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    setShowWarning(false)

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const historyForApi = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          subject,
          topic: topic || undefined,
          difficulty,
          quickMode,
          history: historyForApi,
        }),
      })
      const data = await res.json()

      if (data.warning) {
        setWarningText(data.reply)
        setShowWarning(true)
        setIsLoading(false)
        return
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'classmate',
        content: data.reply || "Hmm, I'm still confused. Can you explain that again?",
        timestamp: Date.now(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'classmate',
        content: "Oops 😭 I lost my train of thought. Try sending that again?",
        timestamp: Date.now(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = async () => {
    setEvaluating(true)
    setStep('report')

    const conversation = messages
      .map(m => `${m.role === 'user' ? 'Student' : 'Classmate'}: ${m.content}`)
      .join('\n\n')

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic: topic || undefined, difficulty, conversation }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      const evalData = await res.json()
      setEvaluation(evalData)
      saveSession(evalData.overallScore || 0, evalData.understood || [], evalData.struggled || [])
    } catch {
      setEvaluation({
        understood: [],
        struggled: [],
        weakSpots: ['Could not analyze this session deeply'],
        misconceptions: [],
        overallScore: 0,
        suggestions: ['Try a longer session next time for a detailed analysis'],
      })
    } finally {
      setEvaluating(false)
    }
  }

  const resetSession = () => {
    setStep('setup')
    setMessages([])
    setEvaluation(null)
    setInput('')
    setShowWarning(false)
    setWarningText('')
  }

  const continueTeaching = () => {
    setStep('chat')
    setEvaluation(null)
    setMessages([{
      id: crypto.randomUUID(),
      role: 'classmate',
      content: `Hey! I still need more help with ${SUBJECT_LABELS[subject]}${topic ? `, especially ${topic}` : ''}. Can we go again? 🙏`,
      timestamp: Date.now(),
    }])
  }

  const retryWarning = () => {
    setShowWarning(false)
    setWarningText('')
    setIsLoading(false)
  }

  if (step === 'setup') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-slideUp">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3 tracking-tight">Teach to Learn.</h1>
            <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-sm mx-auto leading-relaxed">
              Your AI classmate is confused.<br />Teach them what you know — and discover what you don't.
            </p>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Subject</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`p-3 rounded-xl text-center border transition-all ${subject === s ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-secondary)]'}`}>
                  <span className="text-xl block mb-0.5">{SUBJECT_EMOJIS[s]}</span>
                  <span className="text-xs font-medium">{SUBJECT_LABELS[s]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
              What topic are you studying? <span className="text-xs font-normal normal-case opacity-60">(optional)</span>
            </label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Laws, Photosynthesis, Quadratic Equations..."
              className="w-full bg-[var(--bg-input)] rounded-xl px-4 py-3 text-sm border border-[var(--border)] placeholder:text-[var(--text-secondary)]" />
          </div>

          <div className="mb-8">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">How confused is your classmate?</label>
            <div className="flex gap-2.5">
              {DIFFICULTIES.map(d => (
                <button key={d.value} onClick={() => setDifficulty(d.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${difficulty === d.value ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-secondary)]'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startSession}
            className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 4px 24px rgba(99, 102, 241, 0.3)' }}>
            Start Study Session →
          </button>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={() => setQuickMode(!quickMode)}
              className={`text-xs px-4 py-2 rounded-lg border transition-all ${quickMode ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>
              ⚡ Short on time?
            </button>
          </div>

          {sessions.length > 0 && (
            <div className="mt-6 text-center">
              <button onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] underline underline-offset-2">
                View past sessions ({sessions.length})
              </button>
              {showHistory && (
                <div className="mt-3 glass rounded-xl p-4 max-h-48 overflow-y-auto text-left">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-xs">
                      <div><span className="font-medium">{SUBJECT_EMOJIS[s.subject]} {s.topic}</span>
                        <span className="text-[var(--text-secondary)] ml-2">— {new Date(s.date).toLocaleDateString()}</span></div>
                      <span className={s.score >= 60 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {sessions.length === 0 && (
            <p className="mt-6 text-xs text-center text-[var(--text-secondary)]">
              No sessions yet. Complete your first session to start tracking your progress.
            </p>
          )}
        </div>
      </main>
    )
  }

  if (step === 'chat') {
    return (
      <main className="min-h-screen flex flex-col">
        <header className="glass sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#818cf8] flex items-center justify-center text-sm flex-shrink-0">
              {SUBJECT_EMOJIS[subject]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Your Classmate</div>
              <div className="text-xs text-[var(--text-secondary)] truncate">
                {SUBJECT_LABELS[subject]}{topic ? ` — ${topic}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--bg-card)] text-[var(--text-secondary)] uppercase tracking-wider hidden sm:block">{difficulty}</span>
            <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--accent-glow)] text-[var(--accent)] uppercase tracking-wider hidden sm:block">
              {quickMode ? '⚡ Quick' : `${messages.length} msgs`}
            </span>
            <button onClick={endSession}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(248, 113, 113, 0.12)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
              End
            </button>
          </div>
        </header>

        <div className="px-4 py-2 text-center">
          <span className="text-xs text-[var(--text-secondary)]">
            {isLoading ? '🤔 Your classmate is thinking...' : messages.length <= 1 ? '😵‍💫 Your classmate is confused. Start teaching!' : '🧠 Your classmate is learning from you'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[88%] md:max-w-[75%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bubble-user' : 'bubble-classmate'}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bubble-classmate px-4 py-3 flex gap-1.5">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}

          {showWarning && (
            <div className="animate-fadeIn">
              <div className="bubble-classmate px-4 py-3 text-sm leading-relaxed">{warningText}</div>
              <button onClick={retryWarning} className="mt-2 text-xs text-[var(--accent)] hover:underline">OK, let me rewrite it →</button>
            </div>
          )}
        </div>

        <div className="glass px-4 py-4 max-w-2xl mx-auto w-full rounded-t-2xl">
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!showWarning) sendMessage() } }}
              placeholder="Explain it in your own words..." rows={1}
              className="flex-1 bg-[var(--bg-input)] rounded-xl px-4 py-3 text-sm resize-none border border-[var(--border)] placeholder:text-[var(--text-secondary)] max-h-[160px]"
              disabled={isLoading || showWarning} />
            <button onClick={() => { if (!showWarning) sendMessage() }}
              disabled={!input.trim() || isLoading || showWarning}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isLoading && !showWarning ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--bg-input)',
                color: input.trim() && !isLoading && !showWarning ? 'white' : 'var(--text-secondary)',
              }}>
              Send
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-2 text-center">
            Don't worry about perfect wording. Explain it the way YOU understand it.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slideUp">
        {evaluating ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-6 animate-fadeIn">🤔</div>
            <h2 className="text-xl font-semibold gradient-text mb-2">Analyzing your session...</h2>
            <p className="text-sm text-[var(--text-secondary)]">Your classmate is thinking about what you taught them</p>
          </div>
        ) : evaluation ? (
          <>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">{evaluation.overallScore >= 70 ? '🎉' : evaluation.overallScore >= 40 ? '👍' : '💪'}</div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-1">Your Understanding Report</h1>
              <p className="text-xs text-[var(--text-secondary)]">Based on this session's conversation</p>
            </div>

            <div className="glass rounded-2xl p-6 mb-6 text-center">
              <div className="text-4xl font-bold"
                style={{ color: evaluation.overallScore >= 70 ? 'var(--success)' : evaluation.overallScore >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                {evaluation.overallScore}%
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Overall Understanding</div>
            </div>

            {evaluation.understood.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider mb-3">✅ You understand</h3>
                <div className="flex flex-wrap gap-2">
                  {evaluation.understood.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.struggled.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider mb-3">⚠️ Needs review</h3>
                <div className="flex flex-wrap gap-2">
                  {evaluation.struggled.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.weakSpots.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-semibold text-[var(--error)] uppercase tracking-wider mb-3">🎯 Focus on these</h3>
                <ul className="space-y-2">{evaluation.weakSpots.map((spot, i) => (
                  <li key={i} className="text-xs flex items-start gap-2"><span className="text-[var(--error)] mt-0.5">•</span><span>{spot}</span></li>
                ))}</ul>
              </div>
            )}

            {evaluation.misconceptions.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-4">
                <h3 className="text-xs font-semibold text-[var(--error)] uppercase tracking-wider mb-3">🧠 Possible misconceptions</h3>
                <div className="space-y-3">{evaluation.misconceptions.map((mc, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(248, 113, 113, 0.08)' }}>
                    <div className="text-xs font-semibold text-[var(--error)] mb-1">{mc.topic}</div>
                    <div className="text-[11px] mb-1"><span className="opacity-60">You said:</span> {mc.studentSaid}</div>
                    <div className="text-[11px]" style={{ color: 'var(--success)' }}>✓ {mc.correction}</div>
                  </div>
                ))}</div>
              </div>
            )}

            {evaluation.suggestions.length > 0 && (
              <div className="glass rounded-2xl p-5 mb-8">
                <h3 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">💡 What to do next</h3>
                <ul className="space-y-2">{evaluation.suggestions.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-2"><span className="text-[var(--accent)] mt-0.5">→</span><span>{s}</span></li>
                ))}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetSession}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                Study Something Else
              </button>
              <button onClick={continueTeaching}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)' }}>
                Keep Teaching
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-6">😕</div>
            <h2 className="text-xl font-semibold mb-2">Couldn't complete the analysis</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Your conversation is still saved though!</p>
            <button onClick={resetSession}
              className="px-6 py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
