'use client';
import { useState, useRef, useEffect } from 'react';
import { Message, Subject, Difficulty, Evaluation, SUBJECT_LABELS } from '@/types';

const SUBJECTS: Subject[] = ['physics', 'chemistry', 'biology', 'maths', 'computer-science', 'history', 'general'];
const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Very confused — needs simple explanations' },
  { value: 'medium', label: 'Medium', desc: 'Gets some basics, struggles with details' },
  { value: 'hard', label: 'Hard', desc: 'Good foundation, needs deep understanding' },
];

const SUBJECT_EMOJIS: Record<Subject, string> = {
  'physics': '\u26A1',
  'chemistry': '\uD83E\uDDEA',
  'biology': '\uD83E\uDDEC',
  'maths': '\uD83D\uDCD0',
  'computer-science': '\uQ83Df\uDCBB',
  'history': '\uQ83Df\uDCDC',
  'general': '\uQ83Df\uDCDA',
};

export default function Home() {
  const [step, setStep] = useState<'setup' | 'chat' | 'report'>('setup');
  const [subject, setSubject] = useState<Subject>('physics');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [copyPasteWarning, setCopyPasteWarning] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const startSession = () => {
    const firstMessage: Message = {
      id: crypto.randomUUID(),
      role: 'classmate',
      content: gsetOpeningLine(subject, difficulty),
      timestamp: Date.now(),
    };
    setMessages([firstMessage]);
    setStep('chat');
  };

  const getOpeningLine = (subj: Subject, diff: Difficulty): string => {
    const openings: Record<string, string[]> = {
      physics: [
        'Hey... I have a physics test tomorrow and I\'m SO lost. Can you help me understand physics? I don\'t even know where to start \uD83D\uDE05',
        'Okay so I\'m panicking a bit. Physics test is coming up and I literally don\'t understand anything. Can you explain things to me like I\'m five?',
      ],
      chemistry: [
        'Chemistry is making my brain hurt \uD83D\uDE29 I have a test soon and I keep mixing up everything. Can you help me out?',
        'Bro I\'m so confused about chemistry. Like atoms and bonds and all that... I need your help please \uD83D\uDE4F',
      ],
      biology: [
        'Biology test tomorrow and my brain is full of random facts that don\'t connect \uD83D\uDE2D Can you help me actually understand?',
        'Hey, I\'m really struggling with biology. There\'s so much to remember and I keep confusing things. Help?',
      ],
      maths: [
        'Maths is literally my worst subject \uD83D\uDE2C I have a test coming and I don\'t get half the stuff. Can you walk me through it?',
        'I\'m so bad at maths it\'s not even funny. Please help me understand before my test \uD83D\uDE4F',
      ],
      'computer-science': [
        'CS is kicking my butt \uD83D\uDE05 I have a test and I\'m confused about basically everything. Can you help explain?',
        'Hey, I\'m really struggling with computer science. Logic and stuff just doesn\'t click for me. Help?',
      ],
      history: [
        'History test coming up and all the dates and events are a mess in my head \uD83D\uDE35 Can you help me make sense of it?',
        'I keep mixing up historical events and timelines. I need someone to explain it simply. Please help?',
      ],
      general: [
        'Hey! I have a test soon and I\'m totally lost \uD83D\uDE05 Can you help me understand this topic? I really need a good explanation.',
        'I\'m so confused about this subject. Can you help me out? I need someone to explain it in a way that actually makes sense \uD83D\uDE4F',
      ],
    };
    const subjOpenings = openings[subj] || openings['general'];
    return subjOpenings[Math.floor(Math.random() * subjOpenings.length)];
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCopyPasteWarning(false);
    try {
      const historyForApi = messages.filter(m => m.role !== 'system').map(m => ({ role: (m.role === 'user' ? 'user' : 'assistant') as const, content: m.content }));
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage.content, subject, topic: topic || undefined, difficulty, history: historyForApi }) });
      const data = await res.json();
      if (data.copyPasteDetected) setCopyPasteWarning(true);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'classmate', content: data.response || "Hmm, I'm even more confused now. Can you try explaining differently?", timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'classmate', content: "Sorry, I zoned out \uD83D\uDE05 Can you say that again?", timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
  };

  const endSession = async () => {
    setEvaluating(true);
    setStep('report');
    const conversation = messages.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'Student' : 'Classmate'}: ${m.content}`).join('\n\n');
    try {
      const res = await fetch('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, topic: topic || undefined, difficulty, conversation }) });
      setEvaluation(await res.json());
    } catch {
      setEvaluation({ understood: [], struggled: [], weakSpots: ['Could not analyze this session deeply'], misconceptions: [], overallScore: 50, suggestions: ['Try a longer session next time'] });
    } finally { setEvaluating(false); }
  };

  const resetSession = () => { setStep('setup'); setMessages([]); setEvaluation(null); setCopyPasteWarning(false); setInput(''); };

  if (step === 'setup') {
    return (<main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center"><div className="w-full max-w-2xl animate-slideUp"><div className="text-center mb-10"><div className="text-5xl mb-4">{\uD83C\uDF93}</div><h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">Classmate AI</h1><p className="text-lg text-[var(--text-secondary)] max-w-md mx-auto">Not an AI tutor. A confused classmate who needs <span className="text-[var(--accent-light)] font-semibold">your</span> help.</p></div><div className="glass rounded-2xl p-6 mb-6"><h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">What subject are they studying?</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{SUBJECTS.map(s => <button key={s} onClick={() => setSubject(s)} className={`subject-card p-3 rounded-xl text-center border border-transparent transition-all ${subject === s ? 'selected border-[var(--accent)] bg-[rgba(167,139,250,0.1)]' : 'bg-[var(--bg-secondary)] hover:bg-[#334155]'}`}><div className="text-2xl mb-1">{SUBJECT_EMOJIS[s]}</div><div className="text-sm font-medium">{SUBJECT_LABELS[s]|</div></button>)}</div></div><div className="glass rounded-2xl p-6 mb-6"><h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Specific topic? <span className="text-xs font-normal normal-case">(optional)</span></h2><input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Newton's Laws, Photosynthesis, Quadratic Equations..." className="w-full bg-[var(--bg-secondary)] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-secondary)]" /></div><div className="glass rounded-2xl p-6 mb-8"><h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">How confused is your classmate?</h2><div className="flex flex-col gap-3">{DIFFICULTIES.map(d => <button key={d.value} onClick={() => setDifficulty(d.value)} className={`difficulty-btn p-4 rounded-xl text-left border transition-all ${difficulty === d.value ? 'selected bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-secondary)] border-transparent hover:bg-[#334155]'}`}><div className="font-semibold text-sm">{d.label}</div><div className="text-xs opacity-70 mt-0.5">{d.desc}</div></button>)}</div></div><button onClick={startSession} className="w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', color: 'white', boxShadow: '0 4px 20px rgba(167,139,250,0.3)' }}>Start Helping Your Classmate {\uD83D\uDE80}</button></div></main>);
  }

  if (step === 'chat') {
    return (<main className="min-h-screen flex flex-col"><header className="glass sticky top-0 z-10 px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#6366f1] flex items-center justify-center text-lg font-bold">{SUBJECT_EMOJIS[subject]}</div><div><div className="font-semibold text-sm">Confused Classmate</div><div className="text-xs text-[var(--text-secondary)]">Studying {SUBJECT_LABELS[subject]}{topic && ` \u2014 ${topic}}</div></div></div><button onClick={endSession} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>End Session</button></header><div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">{messages.map(msg => <div key={msg.id} className={`message-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}><div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'message-bubble user' : 'message-bubble classmate'}`}>{msg.content}</div></div>)}{isLoading && <div className="flex justify-start animate-fadeIn"><div className="message-bubble classmate px-4 py-3"><div className="flex gap-1.5"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div></div>!{copyPasteWarning && <div className="copy-paste-warning flex justify-center animate-fadeIn"><div className="px-4 py-2 rounded-xl text-xs font-medium" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>{'\u26A0\uFEOF'} Your classmate couldn't understand that — try explaining in your own words!</div></div>!}<div ref={messagesEndRef} /></div><div className="glass px-4 py-4 max-w-3xl mx-auto w-full rounded-t-2xl"><div className="flex gap-3 items-end"><textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder="Explain it to your classmate..." rows={1} className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-4 py-3 text-sm outline-none resize-none border border-transparent focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-secondary)] max-h-[200px]" disabled={isLoading} /><button onClick={sendMessage} disabled={!input.trim() || isLoading} className="px-4 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: input.trim() && !isLoading ? 'linear-gradient(135deg, var(--accent), #6366f1)' : 'var(--bg-secondary)', color: input.trim() && !isLoading ? 'white' : 'var(--text-secondary)' }}>Send</button></div><div className="text-xs text-[var(--text-secondary)] mt-2 text-center">Press Enter to send {'\u00B7'} Shift+Enter for new line</div></div></main>);
  }

  return (<main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center"><div className="w-full max-w-2xl animate-slideUp">{evaluating ? (<div className="text-center py-20"><div className="text-5xl mb-6 animate-bounce">{'\uD83E\uDD14'}</div><h2 className="text-2xl font-bold gradient-text mb-2">Analyzing your session...</h2><p className="text-[var(--text-secondary)]">Your classmate is thinking about what you taught them</p></div>) : evaluation ? (<><div className="text-center mb-8"><div className="text-5xl mb-4">{evaluation.overallScore >= 70 ? '\uD83C\uDF89' : evaluation.overallScore >= 40 ? '\uD83D\uDC4D' : '\uD83D\uDCAA'}</div><h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Session Complete!</h1><p className="text-[var(--text-secondary)]">Here's how well you taught your classmate</p></div><div className="glass rounded-2xl p-6 mb-6 text-center"><div className="text-5xl font-bold" style={{ color: evaluation.overallScore >= 70 ? 'var(--success)' : evaluation.overallScore >= 40 ? 'var(--warning)' : 'var(--error)' }}>{evaluation.overallScore}%</div><div className="text-sm text-[var(--text-secondary)] mt-1">Understanding Score</div></div>{evaluation.understood.length > 0 && <div className="glass rounded-2xl p-6 mb-4"><h3 className="text-sm font-semibold text-[var(--success)] uppercase tracking-wider mb-3">{'\u2705'} You understand</h3><div className="flex flex-wrap gap-2">{evaluation.understood.map((item, i) => <span key={i} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{item}</span>)}</div></div>)}{evaluation.struggled.length > 0 && <div className="glass rounded-2xl p-6 mb-4"><h3 className="text-sm font-semibold text-[var(--warning)] uppercase tracking-wider mb-3">{'\u26A0\uFEOF'} Needs more practice</h3><div className="flex flex-wrap gap-2">{evaluation.struggled.map((item, i) => <span key={i} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>{item}</span>)}</div></div>)}{evaluation.weakSpots.length > 0 && <div className="glass rounded-2xl p-6 mb-4"><h3 className="text-sm font-semibold text-[var(--error)] uppercase tracking-wider mb-3">{\uD83C\uDFAF} Focus on these</h3><ul className="space-y-2">{evaluation.weakSpots.map((spot, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-[var(--error)] mt-0.5">{'\u2022'}</span><span>{spot}</span></li>)}</ul></div>)}{evaluation.misconceptions.length > 0 && <div className="glass rounded-2xl p-6 mb-4"><h3 className="text-sm font-semibold text-[var(--error)] uppercase tracking-wider mb-3">{\uD83D\uDD0D} Misconceptions caught</h3><div className="space-y-3">{evaluation.misconceptions.map((mc, i) => <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="text-xs font-semibold text-[var(--error)] mb-1">{mc.topic}</div><div className="text-xs mb-1"><span className="opacity-70">You said:</span> {mc.studentSaid}</div><div className="text-xs" style={{ color: 'var(--success)' }}>{\u2713} {mc.correction}</div></div>)}</div></div>)}{evaluation.suggestions.length > 0 && <div className="glass rounded-2xl p-6 mb-8"><h3 className="text-sm font-semibold text-[var(--accent-light)] uppercase tracking-wider mb-3">{\uD83D\uDCDD} Suggestions</h3><ul className="space-y-2">{evaluation.suggestions.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-[var(--accent-light)] mt-0.5">{'\u2192'}</span><span>{s}</span></li>)}</ul></div>)}<div className="flex gap-4"><button onClick={resetSession} className="flex-1 py-4 rounded-2xl font-semibold transition-all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}>Study Something Else</button><button onClick={() => { setStep('chat'); setEvaluation(null); setMessages([{ id: crypto.randomUUID(), role: 'classmate', content: `Hey! I still need more help with ${SUBJECT_LABELS[subject]}${topic ? `, especially ${topic}` : ''}. Can we go again? \uD83D\uDE4F`(, timestamp: Date.now() }]); }} className="flex-1 py-4 rounded-2xl font-semibold transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', color: 'white', boxShadow: '0 4px 20px rgba(167,139,250,0.3)' }}>Keep Teaching</button></div></>) : (<div className="text-center py-20"><div className="text-5xl mb-6">{'\uD83D\uDE15'}</div><h2 className="text-2xl font-bold mb-2">Something went wrong</h2><p className="text-[var(--text-secondary)] mb-6">Couldn't analyze the session. Try again?</p><button onClick={resetSession} className="px-8 py-3 rounded-xl font-semibold" style={{ background: 'var(--accent)', color: 'white' }}>Start Over</button></div>)}</div></main>);
  }
}
