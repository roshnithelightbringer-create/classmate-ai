import { Subject } from '@/types';
const icons: Record<Subject, string> = { physics: '⚡', chemistry: '🧪', biology: '🧬', maths: '📐', 'computer-science': '💻', history: '📜', general: '📚' };
export default function SubjectIcon({ subject, size = 20 }: { subject: Subject; size?: number }) {
  return <span style={{ fontSize: size }}>{icons[subject] || '📢}</span>;
}