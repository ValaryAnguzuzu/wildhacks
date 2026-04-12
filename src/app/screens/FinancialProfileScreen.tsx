import { Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '@/firebase/config';
import {
  type FinancialProfileData,
  getFinancialProfile,
  setFinancialProfile,
} from '@/firebase/firestore';

import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

function parseMoneyInput(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

type FieldConfig = {
  key: keyof Omit<FinancialProfileData, 'updatedAt'>;
  label: string;
  hint: string;
};

const FIELDS: FieldConfig[] = [
  {
    key: 'checking',
    label: 'Checking account balance',
    hint: 'This is what is currently in your checking account — not your limit.',
  },
  {
    key: 'savings',
    label: 'Savings account balance',
    hint: 'Total in savings accounts you could tap if needed.',
  },
  {
    key: 'cash',
    label: 'Cash on hand',
    hint: 'Physical cash, not money already in the bank.',
  },
  {
    key: 'creditCardBalance',
    label: 'Credit card balance',
    hint: 'What you owe right now across cards you use regularly.',
  },
  {
    key: 'creditCardLimit',
    label: 'Credit card limit',
    hint: 'Combined credit limit on those same cards (approximate is fine).',
  },
  {
    key: 'monthlyIncome',
    label: 'Monthly take-home income (optional)',
    hint: 'What hits your account after taxes — optional but helps a lot.',
  },
  {
    key: 'monthlyExpenses',
    label: 'Monthly expenses estimate (optional)',
    hint: 'Rent, bills, food, subscriptions — a rough monthly total.',
  },
];

export function FinancialProfileScreen() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;
  const [values, setValues] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Timestamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await getFinancialProfile(uid);
    if (err) setError(err);
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = data[f.key];
      next[f.key] = v ? formatUsd(v) : '';
    }
    setValues(next);
    setUpdatedAt(data.updatedAt);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const lastUpdatedLabel = useMemo(() => {
    if (!updatedAt?.toDate) return 'Not updated yet';
    const days = Math.floor(
      (Date.now() - updatedAt.toDate().getTime()) / (24 * 60 * 60 * 1000),
    );
    if (days <= 0) return 'Last updated today';
    if (days === 1) return 'Last updated 1 day ago';
    return `Last updated ${days} days ago`;
  }, [updatedAt]);

  function setField(key: string, display: string) {
    setValues((v) => ({ ...v, [key]: display }));
  }

  async function onSave() {
    if (!uid || saving) return;
    setSaving(true);
    setError(null);
    const payload: Omit<FinancialProfileData, 'updatedAt'> = {
      checking: parseMoneyInput(values.checking ?? ''),
      savings: parseMoneyInput(values.savings ?? ''),
      cash: parseMoneyInput(values.cash ?? ''),
      creditCardBalance: parseMoneyInput(values.creditCardBalance ?? ''),
      creditCardLimit: parseMoneyInput(values.creditCardLimit ?? ''),
      monthlyIncome: parseMoneyInput(values.monthlyIncome ?? ''),
      monthlyExpenses: parseMoneyInput(values.monthlyExpenses ?? ''),
    };
    const { error: err } = await setFinancialProfile(uid, payload);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await load();
  }

  if (!uid) {
    return (
      <Layout>
        <p className="px-4" style={{ color: 'var(--text-secondary)' }}>
          Sign in to manage your financial snapshot.
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 mx-auto max-w-lg pb-10">
        <button
          type="button"
          className="mb-6 text-sm font-medium"
          style={{ color: 'var(--teal)' }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="mb-2"
            style={{
              fontSize: 'var(--font-display)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
            }}
          >
            Financial snapshot
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Fin uses these numbers to personalize advice. Everything is optional — add
            what you are comfortable sharing.
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label
                  className="block mb-2 font-semibold"
                  style={{ fontSize: 'var(--font-body)', color: 'var(--text-primary)' }}
                >
                  {field.label}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="$0"
                  className="w-full px-4 py-4 rounded-[var(--radius-button)] border border-[var(--border-subtle)] bg-[var(--surface)] outline-none focus:ring-2 focus:ring-[var(--teal)] tabular-nums"
                  style={{
                    fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                    color: 'var(--text-primary)',
                  }}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                  onBlur={() => {
                    const n = parseMoneyInput(values[field.key] ?? '');
                    if (n) setField(field.key, formatUsd(n));
                  }}
                />
                <p
                  className="mt-2"
                  style={{
                    fontSize: 'var(--font-caption)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {field.hint}
                </p>
              </div>
            ))}

            {error ? (
              <p style={{ color: 'var(--wrong)', fontSize: 'var(--font-caption)' }}>
                {error}
              </p>
            ) : null}

            <Button fullWidth disabled={saving} onClick={() => void onSave()}>
              {saving ? 'Saving…' : 'Update balances'}
            </Button>
            <p
              className="text-center"
              style={{ fontSize: 'var(--font-caption)', color: 'var(--text-muted)' }}
            >
              {lastUpdatedLabel}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
