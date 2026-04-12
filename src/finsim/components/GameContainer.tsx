import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '../finsim-module.css';

import type { ActionRecord, Category, GameState, Scenario } from '../gameState';
import { generateScenario } from '../generateScenario';
import type { FlashKind } from './PlayerPanel';
import { PlayerPanel } from './PlayerPanel';
import { ScenarioPanel } from './ScenarioPanel';
import { SummaryScreen } from './SummaryScreen';

const TOTAL_ROUNDS = 3;

const CATEGORIES: Category[] = ['needs', 'debt', 'savings', 'investing', 'wants'];

const LABEL: Record<Category, string> = {
  needs: 'Needs',
  debt: 'Debt',
  savings: 'Savings',
  investing: 'Investing',
  wants: 'Wants',
};

function emptyAlloc(): Record<Category, number> {
  return { needs: 0, debt: 0, savings: 0, investing: 0, wants: 0 };
}

function sumAlloc(a: Record<Category, number>): number {
  return CATEGORIES.reduce((s, k) => s + (a[k] ?? 0), 0);
}

const initialGame = (): GameState => ({
  round: 1,
  balance: 0,
  savings: 500,
  debt: 400,
  history: [],
});

type Subphase = 'alloc' | 'event_pending' | 'between';

export function GameContainer() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [subphase, setSubphase] = useState<Subphase>('alloc');
  const [view, setView] = useState<'play' | 'summary'>('play');
  const [alloc, setAlloc] = useState<Record<Category, number>>(emptyAlloc);

  const stepRef = useRef(1);
  const pendingDebtInterestRef = useRef(false);
  const [savingsFlash, setSavingsFlash] = useState<FlashKind>(null);
  const [debtFlash, setDebtFlash] = useState<FlashKind>(null);

  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFlash = useCallback((kind: 'savings' | 'debt', dir: 'up' | 'down') => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    if (kind === 'savings') {
      setSavingsFlash(dir === 'up' ? 'savings-up' : 'savings-down');
      setDebtFlash(null);
    } else {
      setDebtFlash(dir === 'up' ? 'debt-up' : 'debt-down');
      setSavingsFlash(null);
    }
    flashTimeout.current = setTimeout(() => {
      setSavingsFlash(null);
      setDebtFlash(null);
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const idx = game.round - 1;
    setScenarioLoading(true);
    setScenario(null);
    void (async () => {
      const sc = await generateScenario(idx);
      if (cancelled) return;
      setScenario(sc);
      setScenarioLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [game.round]);

  const pool = useMemo(() => {
    if (!scenario) return 0;
    return Math.max(0, game.balance + scenario.income - scenario.fixedExpenses);
  }, [game.balance, scenario]);

  const needsMin = useMemo(() => Math.max(100, Math.floor(pool * 0.2)), [pool]);

  const setAllocField = useCallback((category: Category, value: number) => {
    setAlloc((prev) => ({ ...prev, [category]: value }));
  }, []);

  const handleConfirmAllocation = useCallback(() => {
    if (!scenario || subphase !== 'alloc' || scenarioLoading) return;
    const total = sumAlloc(alloc);
    if (total !== pool) return;

    const payDebt = Math.min(alloc.debt, game.debt);
    const savingsAdd = alloc.savings + alloc.investing;
    const needsOk = alloc.needs >= needsMin;
    pendingDebtInterestRef.current = game.debt > 0 && alloc.debt === 0;

    const nextSavings = game.savings + savingsAdd;
    const nextDebt = Math.max(0, game.debt - payDebt);
    const nextBalance = 0;

    let step = stepRef.current;
    const batch: ActionRecord[] = [];

    for (const cat of CATEGORIES) {
      const amt = alloc[cat];
      if (amt <= 0) continue;
      const impact: ActionRecord['impact'] = {};
      if (cat === 'savings') impact.savingsChange = amt;
      if (cat === 'investing') impact.savingsChange = amt;
      if (cat === 'debt') impact.debtChange = -payDebt;
      batch.push({
        step: step++,
        decision: `Allocate to ${LABEL[cat]}`,
        amount: amt,
        category: cat,
        result: 'Applied from this paycheck pool',
        impact,
      });
    }

    if (!needsOk) {
      batch.push({
        step: step++,
        decision: 'Needs checkpoint',
        amount: alloc.needs,
        category: 'needs',
        result: `Below recommended minimum (${needsMin} for essentials)`,
        impact: {},
      });
    }

    stepRef.current = step;

    setGame((prev) => ({
      ...prev,
      balance: nextBalance,
      savings: nextSavings,
      debt: nextDebt,
      history: [...prev.history, ...batch],
    }));

    if (savingsAdd !== 0) {
      runFlash('savings', savingsAdd > 0 ? 'up' : 'down');
    }
    if (payDebt !== 0) {
      runFlash('debt', payDebt > 0 ? 'down' : 'up');
    }

    setSubphase('event_pending');
  }, [
    alloc,
    game.debt,
    game.savings,
    needsMin,
    pool,
    runFlash,
    scenario,
    scenarioLoading,
    subphase,
  ]);

  const handleTriggerEvent = useCallback(() => {
    if (!scenario || subphase !== 'event_pending') return;
    const cost = scenario.event.cost;
    const roundWhenResolving = game.round;
    const paidFromSavings = game.savings >= cost;

    setGame((prev) => {
      let savings = prev.savings;
      let debt = prev.debt;
      let savingsChange = 0;
      let debtChange = 0;
      let result: string;

      if (savings >= cost) {
        savings -= cost;
        savingsChange = -cost;
        result = `Covered ${cost.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} from savings.`;
      } else {
        debt += cost;
        debtChange = cost;
        result = `Savings could not cover the full cost — ${cost.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} added to debt.`;
      }

      const step = stepRef.current;
      const evt: ActionRecord = {
        step,
        decision: `Event (${scenario.event.type})`,
        amount: cost,
        category: savingsChange !== 0 ? 'savings' : 'debt',
        result,
        impact: {
          savingsChange: savingsChange !== 0 ? savingsChange : undefined,
          debtChange: debtChange !== 0 ? debtChange : undefined,
        },
      };
      stepRef.current = step + 1;

      return {
        ...prev,
        savings,
        debt,
        history: [...prev.history, evt],
      };
    });

    if (paidFromSavings) {
      runFlash('savings', 'down');
    } else {
      runFlash('debt', 'up');
    }

    if (roundWhenResolving === TOTAL_ROUNDS) {
      setView('summary');
    } else {
      setSubphase('between');
    }
  }, [game.round, game.savings, runFlash, scenario, subphase]);

  const handleNextRound = useCallback(() => {
    const applyInterest = pendingDebtInterestRef.current;
    setGame((prev) => {
      let debt = prev.debt;
      const history = [...prev.history];
      let step = stepRef.current;

      if (applyInterest) {
        const increase = prev.debt * 0.1;
        debt = Math.round(prev.debt * 1.1 * 100) / 100;
        history.push({
          step: step++,
          decision: 'Missed debt allocation (last round)',
          category: 'debt',
          result: 'Debt increased by 10%',
          impact: { debtChange: increase },
        });
        pendingDebtInterestRef.current = false;
      }

      stepRef.current = step;
      return {
        ...prev,
        debt,
        history,
        round: prev.round + 1,
      };
    });
    if (applyInterest) {
      runFlash('debt', 'up');
    }
    setSubphase('alloc');
    setAlloc(emptyAlloc());
  }, [runFlash]);

  return (
    <div className="finsim-module" style={{ background: 'var(--fs-bg)' }}>
      <h1 className="finsim-module__title">FinSim</h1>
      <p className="finsim-module__sub">Allocate each paycheck, absorb the event, then move on — no interruptions.</p>

      {view === 'summary' ? (
        <SummaryScreen game={game} />
      ) : (
        <div className="finsim-module__grid finsim-module__grid--2">
          <ScenarioPanel
            scenario={scenario}
            pool={pool}
            round={game.round}
            totalRounds={TOTAL_ROUNDS}
            subphase={subphase}
            scenarioLoading={scenarioLoading}
            onTriggerEvent={handleTriggerEvent}
            onNextRound={handleNextRound}
          />
          <PlayerPanel
            pool={pool}
            game={game}
            allocation={alloc}
            onChange={setAllocField}
            onConfirm={handleConfirmAllocation}
            locked={subphase !== 'alloc'}
            scenarioLoading={scenarioLoading}
            needsMin={needsMin}
            savingsFlash={savingsFlash}
            debtFlash={debtFlash}
          />
        </div>
      )}
    </div>
  );
}
