import type { Category, GameState } from '../gameState';

const LABEL: Record<Category, string> = {
  needs: 'Needs',
  debt: 'Debt',
  savings: 'Savings',
  investing: 'Investing',
  wants: 'Wants',
};

const ORDER: Category[] = ['needs', 'debt', 'savings', 'investing', 'wants'];

export type FlashKind = 'savings-up' | 'savings-down' | 'debt-up' | 'debt-down' | null;

type Props = {
  pool: number;
  game: Pick<GameState, 'savings' | 'debt' | 'balance'>;
  allocation: Record<Category, number>;
  onChange: (category: Category, value: number) => void;
  onConfirm: () => void;
  locked: boolean;
  scenarioLoading: boolean;
  needsMin: number;
  savingsFlash: FlashKind;
  debtFlash: FlashKind;
};

function sumAlloc(a: Record<Category, number>): number {
  return ORDER.reduce((s, k) => s + (a[k] ?? 0), 0);
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function PlayerPanel({
  pool,
  game,
  allocation,
  onChange,
  onConfirm,
  locked,
  scenarioLoading,
  needsMin,
  savingsFlash,
  debtFlash,
}: Props) {
  const total = sumAlloc(allocation);
  const remaining = pool - total;
  const savingsClass =
    savingsFlash === 'savings-up'
      ? ' finsim-module__stat--savings-up'
      : savingsFlash === 'savings-down'
        ? ' finsim-module__stat--savings-down'
        : '';
  const debtClass =
    debtFlash === 'debt-up'
      ? ' finsim-module__stat--debt-up'
      : debtFlash === 'debt-down'
        ? ' finsim-module__stat--debt-down'
        : '';

  const maxDebtPay = Math.min(pool, game.debt);
  const blocked = locked || scenarioLoading;

  if (scenarioLoading) {
    return (
      <div className="finsim-module__card">
        <h2>Allocate this round</h2>
        <p className="finsim-module__loading">Preparing numbers…</p>
      </div>
    );
  }

  return (
    <div className="finsim-module__card">
      <h2>Allocate this round</h2>
      <div className="finsim-module__stat-row">
        <div className="finsim-module__stat">
          <label>Balance</label>
          <strong>{formatMoney(game.balance)}</strong>
        </div>
        <div className={`finsim-module__stat${savingsClass}`}>
          <label>Savings</label>
          <strong>{formatMoney(game.savings)}</strong>
        </div>
        <div className={`finsim-module__stat${debtClass}`}>
          <label>Debt</label>
          <strong>{formatMoney(game.debt)}</strong>
        </div>
      </div>

      <p className="finsim-module__pool">
        Pool to allocate: <strong>{formatMoney(pool)}</strong>
        <span style={{ marginLeft: '0.5rem', color: 'var(--fs-muted)', fontSize: '0.85rem' }}>
          (needs target ≥ {formatMoney(needsMin)})
        </span>
      </p>

      <div className="finsim-module__categories">
        {ORDER.map((cat) => {
          const hint =
            cat === 'debt' && game.debt > 0
              ? `Up to ${formatMoney(maxDebtPay)} toward ${formatMoney(game.debt)} owed`
              : cat === 'needs'
                ? `Cover rent, food, transport — target ${formatMoney(needsMin)}+`
                : cat === 'wants'
                  ? 'Optional spending — no direct balance benefit'
                  : undefined;

          return (
            <div key={cat} className="finsim-module__cat">
              <span className="finsim-module__cat-label">{LABEL[cat]}</span>
              {hint ? <span className="finsim-module__cat-hint">{hint}</span> : null}
              <input
                className="finsim-module__input"
                type="number"
                min={0}
                max={cat === 'debt' ? maxDebtPay : pool}
                step={1}
                disabled={blocked || (cat === 'debt' && game.debt <= 0)}
                value={Number.isFinite(allocation[cat]) ? allocation[cat] : 0}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)));
                  onChange(cat, v);
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className={`finsim-module__remaining${remaining === 0 ? ' finsim-module__remaining--ok' : ' finsim-module__remaining--bad'}`}
      >
        Remaining: {formatMoney(remaining)}
      </div>

      <div className="finsim-module__btn-row">
        <button
          type="button"
          className="finsim-module__btn"
          disabled={blocked || remaining !== 0 || pool < 0}
          onClick={onConfirm}
        >
          Confirm allocation
        </button>
      </div>

      {locked ? (
        <div className="finsim-module__alloc-summary" aria-live="polite">
          {ORDER.map((c) => (
            <span key={c}>
              {LABEL[c]} {formatMoney(allocation[c] ?? 0)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
