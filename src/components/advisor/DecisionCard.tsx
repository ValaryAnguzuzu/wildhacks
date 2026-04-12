import { AlertTriangle, Check, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/app/components/Button';
import type { FinancialProfileData } from '@/firebase/firestore';
import { addAdvisorHistoryDoc } from '@/firebase/firestore';

export type Verdict = 'yes' | 'no' | 'conditional';

export function detectVerdict(text: string): Verdict | null {
  const t = text.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('yes, but') || lower.startsWith('yes — but')) return 'conditional';
  if (lower.startsWith('yes')) return 'yes';
  if (lower.startsWith('no')) return 'no';
  return null;
}

type DecisionCardProps = {
  verdict: Verdict;
  fullText: string;
  userQuestion: string;
  uid: string;
  snapshot: Omit<FinancialProfileData, 'updatedAt'>;
};

const verdictMeta: Record<
  Verdict,
  { label: string; border: string; pillBg: string; pillText: string; Icon: typeof Check }
> = {
  yes: {
    label: 'Go for it',
    border: 'color-mix(in srgb, var(--correct) 45%, transparent)',
    pillBg: 'color-mix(in srgb, var(--correct) 22%, transparent)',
    pillText: 'var(--correct)',
    Icon: Check,
  },
  no: {
    label: 'Not right now',
    border: 'color-mix(in srgb, var(--wrong) 40%, transparent)',
    pillBg: 'color-mix(in srgb, var(--wrong) 18%, transparent)',
    pillText: 'var(--wrong)',
    Icon: X,
  },
  conditional: {
    label: 'With conditions',
    border: 'color-mix(in srgb, #f59e0b 45%, transparent)',
    pillBg: 'color-mix(in srgb, #f59e0b 20%, transparent)',
    pillText: '#b45309',
    Icon: AlertTriangle,
  },
};

export function DecisionCard({
  verdict,
  fullText,
  userQuestion,
  uid,
  snapshot,
}: DecisionCardProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const meta = verdictMeta[verdict];
  const { Icon } = meta;

  async function onSave() {
    if (saved || saving) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await addAdvisorHistoryDoc(uid, {
      userQuestion,
      advisorResponse: fullText,
      verdict,
      snapshot,
    });
    setSaving(false);
    if (error) {
      setSaveError('Could not save. Try again.');
      return;
    }
    setSaved(true);
  }

  return (
    <div
      className="rounded-[var(--radius-card)] border-2 p-4 max-w-[min(100%,420px)]"
      style={{
        borderColor: meta.border,
        backgroundColor: 'var(--surface)',
      }}
    >
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] text-sm font-semibold mb-3"
        style={{
          backgroundColor: meta.pillBg,
          color: meta.pillText,
        }}
      >
        <Icon size={16} strokeWidth={2.5} aria-hidden />
        {meta.label}
      </div>
      <p
        className="whitespace-pre-wrap leading-relaxed"
        style={{ fontSize: 'var(--font-body)', color: 'var(--text-primary)' }}
      >
        {fullText}
      </p>
      <div className="mt-4 space-y-2">
        {saveError ? (
          <p className="text-xs text-center" style={{ color: 'var(--wrong)' }}>
            {saveError}
          </p>
        ) : null}
        <Button
          fullWidth
          variant="secondary"
          disabled={saved || saving}
          onClick={() => void onSave()}
        >
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save this advice'}
        </Button>
      </div>
    </div>
  );
}
