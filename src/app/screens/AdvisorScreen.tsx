import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { askAdvisor } from '@/api/advisor';
import { Button } from '@/app/components/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import { DecisionCard, detectVerdict } from '@/components/advisor/DecisionCard';
import { auth } from '@/firebase/config';
import { type FinancialProfileData, getFinancialProfile } from '@/firebase/firestore';
import { readAdvisorLessonContext } from '@/utils/advisorLessonContext';

type SnapshotFields = Omit<FinancialProfileData, 'updatedAt'>;

type ChatMessage =
  | {
      id: string;
      role: 'user';
      content: string;
    }
  | {
      id: string;
      role: 'assistant';
      content: string;
      userQuestion: string;
      snapshot?: SnapshotFields;
    }
  | { id: string; role: 'typing' };

type ClaudeTurn = { role: 'user' | 'assistant'; content: string };

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Hey! I'm Fin, your financial advisor. Tell me about a purchase you're considering or a financial decision you're weighing — I'll give you my honest take based on your current situation.`,
  userQuestion: '',
};

const QUICK_PROMPTS = [
  'Should I buy this?',
  'Is my budget healthy?',
  'Help me save faster',
  'Am I in debt trouble?',
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toClaudeHistory(messages: ChatMessage[]): ClaudeTurn[] {
  const parts: ClaudeTurn[] = [];
  for (const m of messages) {
    if (m.role === 'user') parts.push({ role: 'user', content: m.content });
    if (m.role === 'assistant') parts.push({ role: 'assistant', content: m.content });
  }
  let start = 0;
  while (start < parts.length && parts[start].role === 'assistant') start += 1;
  return parts.slice(start).slice(-20);
}

const EMPTY_SNAPSHOT: SnapshotFields = {
  checking: 0,
  savings: 0,
  cash: 0,
  creditCardBalance: 0,
  creditCardLimit: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
};

function profileForPrompt(data: FinancialProfileData): SnapshotFields {
  const {
    checking,
    savings,
    cash,
    creditCardBalance,
    creditCardLimit,
    monthlyIncome,
    monthlyExpenses,
  } = data;
  return {
    checking,
    savings,
    cash,
    creditCardBalance,
    creditCardLimit,
    monthlyIncome,
    monthlyExpenses,
  };
}

function hasAnyBalance(data: FinancialProfileData): boolean {
  return (
    data.checking > 0 ||
    data.savings > 0 ||
    data.cash > 0 ||
    data.creditCardBalance > 0 ||
    data.creditCardLimit > 0 ||
    data.monthlyIncome > 0 ||
    data.monthlyExpenses > 0
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 px-1 py-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-[var(--text-muted)]"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function AdvisorScreen() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid ?? '';
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [profile, setProfile] = useState<FinancialProfileData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contextApplied = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!uid) return;
    const { data } = await getFinancialProfile(uid);
    setProfile(data);
  }, [uid]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (contextApplied.current) return;
    const ctx = readAdvisorLessonContext();
    if (!ctx) return;
    contextApplied.current = true;
    const line = `You just learned about ${ctx.conceptTag}. Want me to look at your specific situation and tell you how this applies to you?`;
    setInput((prev) => (prev.trim() ? prev : line));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed || sending || !uid) return;
    setSendError(null);
    setSending(true);

    const userMsg: ChatMessage = { id: newId(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setMessages((prev) => [...prev, { id: newId(), role: 'typing' }]);

    const history = toClaudeHistory(messages);
    const promptData = profile ?? (await getFinancialProfile(uid)).data;
    const hasNumbers = hasAnyBalance(promptData);
    const profilePayload = hasNumbers ? profileForPrompt(promptData) : null;
    const snapshotAtSend = profileForPrompt(promptData);

    try {
      const reply = await askAdvisor(trimmed, profilePayload, history);
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.role !== 'typing');
        return [
          ...withoutTyping,
          {
            id: newId(),
            role: 'assistant',
            content: reply,
            userQuestion: trimmed,
            snapshot: snapshotAtSend,
          },
        ];
      });
    } catch {
      setSendError('Something went wrong. Please try again.');
      setMessages((prev) => prev.filter((m) => m.role !== 'typing'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[var(--background)]">
      <header
        className="shrink-0 z-20 border-b px-3 pt-[max(env(safe-area-inset-top),10px)] pb-3"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            className="shrink-0 px-2 py-2 text-sm font-medium"
            style={{ color: 'var(--teal)' }}
            onClick={() => navigate('/home')}
          >
            ←
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p
              className="text-xs uppercase tracking-wide font-medium truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              Fin, your financial advisor
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 px-2 py-1.5 text-xs font-semibold rounded-[var(--radius-pill)]"
            style={{
              color: 'var(--teal)',
              backgroundColor: 'color-mix(in srgb, var(--teal) 15%, transparent)',
            }}
            onClick={() => navigate('/advisor/history')}
          >
            Past advice
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={() => {
              void refreshProfile();
              setSheetOpen(true);
            }}
            className="px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-semibold border"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-elevated)',
            }}
          >
            Your snapshot
          </button>
        </div>
      </header>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Your snapshot</SheetTitle>
          </SheetHeader>
          <div
            className="px-4 pb-8 space-y-3 text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {!profile ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
            ) : !hasAnyBalance(profile) ? (
              <div className="space-y-3">
                <p style={{ color: 'var(--text-secondary)' }}>
                  You have not added balances yet. Add a few numbers so Fin can tailor
                  advice to you.
                </p>
                <Button fullWidth onClick={() => navigate('/financial-profile')}>
                  Add your snapshot
                </Button>
              </div>
            ) : (
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>Checking: ${profile.checking.toLocaleString()}</li>
                <li>Savings: ${profile.savings.toLocaleString()}</li>
                <li>Cash: ${profile.cash.toLocaleString()}</li>
                <li>Credit owed: ${profile.creditCardBalance.toLocaleString()}</li>
                <li>Credit limit: ${profile.creditCardLimit.toLocaleString()}</li>
                <li>Monthly income: ${profile.monthlyIncome.toLocaleString()}</li>
                <li>Monthly expenses: ${profile.monthlyExpenses.toLocaleString()}</li>
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 max-w-lg mx-auto w-full"
      >
        <div className="space-y-4 pb-4">
          {messages.map((m) => {
            if (m.role === 'typing') {
              return (
                <div key={m.id} className="flex gap-2 items-end">
                  <div
                    className="size-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--teal)' }}
                  >
                    FA
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-2 border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              );
            }
            if (m.role === 'user') {
              return (
                <div key={m.id} className="flex justify-end">
                  <div
                    className="max-w-[min(100%,340px)] rounded-2xl rounded-br-md px-4 py-3"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--teal) 22%, transparent)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <p className="whitespace-pre-wrap text-[length:var(--font-body)] leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            }
            const verdict = detectVerdict(m.content);
            return (
              <div key={m.id} className="flex gap-2 items-start">
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--teal)' }}
                >
                  FA
                </div>
                <div className="flex-1 min-w-0">
                  {verdict && uid ? (
                    <DecisionCard
                      verdict={verdict}
                      fullText={m.content}
                      userQuestion={m.userQuestion}
                      uid={uid}
                      snapshot={
                        m.snapshot ??
                        (profile ? profileForPrompt(profile) : EMPTY_SNAPSHOT)
                      }
                    />
                  ) : (
                    <div
                      className="rounded-2xl rounded-bl-md px-4 py-3 border max-w-[min(100%,420px)]"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <p className="whitespace-pre-wrap text-[length:var(--font-body)] leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="shrink-0 border-t px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] max-w-lg mx-auto w-full"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--surface)',
        }}
      >
        {sendError ? (
          <p className="text-center text-xs mb-2" style={{ color: 'var(--wrong)' }}>
            {sendError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 mb-2 justify-center">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => void sendMessage(q)}
              className="px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium border disabled:opacity-50"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-elevated)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            placeholder="Ask about any financial decision..."
            className="flex-1 min-h-[44px] max-h-28 resize-none rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2.5 text-[length:var(--font-body)] outline-none focus:ring-2 focus:ring-[var(--teal)]"
            style={{ color: 'var(--text-primary)' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button
            className="shrink-0 !px-4 !py-2.5"
            disabled={sending || !input.trim()}
            onClick={() => void sendMessage(input)}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
