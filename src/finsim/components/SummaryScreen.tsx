import { useEffect, useMemo, useRef } from 'react';

import { useAuth } from '../../context/AuthContext';
import type { ActionRecord, Category, GameState } from '../gameState';
import { saveFinSimResult } from '../saveFinSimResult';

const CATEGORY_TIPS: Record<Category, string> = {
  needs:
    'Cover recurring essentials first so a single surprise does not force you back to high-interest debt.',
  debt: 'When you carry a balance, paying at least the minimum (or more) prevents silent compounding.',
  savings:
    'A liquid emergency fund turns “crisis mode” into a line item — aim for a few months of core expenses.',
  investing:
    'Investing works best after essentials are covered and high-cost debt is under control.',
  wants: 'Wants are the easiest dial to turn — track them explicitly so they do not crowd out stability.',
};

const LABEL: Record<Category, string> = {
  needs: 'Needs',
  debt: 'Debt',
  savings: 'Savings',
  investing: 'Investing',
  wants: 'Wants',
};

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function impactLine(impact: ActionRecord['impact']): string {
  const parts: string[] = [];
  if (impact.balanceChange !== undefined && impact.balanceChange !== 0) {
    parts.push(`Balance ${impact.balanceChange > 0 ? '+' : ''}${formatMoney(impact.balanceChange)}`);
  }
  if (impact.savingsChange !== undefined && impact.savingsChange !== 0) {
    parts.push(`Savings ${impact.savingsChange > 0 ? '+' : ''}${formatMoney(impact.savingsChange)}`);
  }
  if (impact.debtChange !== undefined && impact.debtChange !== 0) {
    parts.push(`Debt ${impact.debtChange > 0 ? '+' : ''}${formatMoney(impact.debtChange)}`);
  }
  return parts.length ? parts.join(' · ') : 'No numeric change';
}

function categoriesFromHistory(history: ActionRecord[]): Category[] {
  const set = new Set<Category>();
  for (const h of history) {
    if (h.decision.startsWith('Allocate to ') && (h.amount ?? 0) > 0) {
      set.add(h.category);
    }
  }
  return Array.from(set);
}

function keyMistake(history: ActionRecord[]): { title: string; body: string } {
  const needs = history.find((h) => h.result.includes('Below recommended minimum'));
  if (needs) {
    return {
      title: 'Essential needs were underfunded',
      body: 'When fixed living costs are short, the next surprise often lands on a card. Building a predictable needs line first protects everything else.',
    };
  }
  const penalty = history.find((h) => h.decision.includes('Missed debt allocation'));
  if (penalty) {
    return {
      title: 'Debt grew after a round with no payment',
      body: 'Ignoring an existing balance while it still accrues cost makes the next month harder — even small payments keep compounding in check.',
    };
  }
  const largestDebtHit = history.reduce<{ max: number; rec: ActionRecord | null }>(
    (acc, h) => {
      const d = h.impact.debtChange ?? 0;
      if (d > acc.max) return { max: d, rec: h };
      return acc;
    },
    { max: 0, rec: null },
  );
  if (largestDebtHit.rec && largestDebtHit.max > 0) {
    return {
      title: 'Debt spikes from uncovered shocks',
      body: 'Several moves added to debt. Pairing a higher savings allocation with leaner wants would absorb the next hit without borrowing.',
    };
  }
  return {
    title: 'Room to tighten the plan',
    body: 'Review wants and investing relative to debt — small, consistent shifts beat one perfect month.',
  };
}

type Props = {
  game: GameState;
};

export function SummaryScreen({ game }: Props) {
  const { user } = useAuth();
  const saved = useRef(false);

  const mistake = useMemo(() => keyMistake(game.history), [game.history]);
  const usedCats = useMemo(() => categoriesFromHistory(game.history), [game.history]);

  useEffect(() => {
    if (saved.current) return;
    if (!user || user.isAnonymous) return;
    saved.current = true;
    void saveFinSimResult(user.uid, game).catch((e) => {
      console.warn('[FinSim] Could not save result', e);
      saved.current = false;
    });
  }, [user, game]);

  return (
    <div className="finsim-module__card">
      <h2>Run summary</h2>
      <p className="finsim-module__scenario-text">
        Final snapshot — balance {formatMoney(game.balance)}, savings {formatMoney(game.savings)}, debt{' '}
        {formatMoney(game.debt)}.
      </p>

      <div className="finsim-module__callout">
        <h3>Key mistake</h3>
        <p>
          <strong>{mistake.title}</strong> {mistake.body}
        </p>
      </div>

      <h2 style={{ marginTop: '1.25rem', fontSize: '0.95rem', color: 'var(--fs-muted)' }}>Round-by-round log</h2>
      <ul className="finsim-module__summary-list">
        {game.history.map((h, i) => (
          <li key={`${h.step}-${i}`} className="finsim-module__summary-item">
            <header>
              <span>Step {h.step}</span>
              <span>{LABEL[h.category]}</span>
            </header>
            <p>
              <strong>{h.decision}</strong>
              {h.amount !== undefined ? ` · ${formatMoney(h.amount)}` : ''}
            </p>
            <p>{h.result}</p>
            <div className="finsim-module__impact">{impactLine(h.impact)}</div>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: 'var(--fs-muted)' }}>Better alternatives by category</h2>
      <ul className="finsim-module__tips">
        {usedCats.map((c) => (
          <li key={c}>
            <strong>{LABEL[c]}</strong>
            {CATEGORY_TIPS[c]}
          </li>
        ))}
      </ul>
    </div>
  );
}
