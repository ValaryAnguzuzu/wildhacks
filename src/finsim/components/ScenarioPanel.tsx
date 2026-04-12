import type { Scenario } from '../gameState';

type Subphase = 'alloc' | 'event_pending' | 'between';

type Props = {
  scenario: Scenario | null;
  pool: number;
  round: number;
  totalRounds: number;
  subphase: Subphase;
  scenarioLoading: boolean;
  onTriggerEvent: () => void;
  onNextRound: () => void;
};

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function ScenarioPanel({
  scenario,
  pool,
  round,
  totalRounds,
  subphase,
  scenarioLoading,
  onTriggerEvent,
  onNextRound,
}: Props) {
  if (scenarioLoading || !scenario) {
    return (
      <div className="finsim-module__card">
        <p className="finsim-module__loading">Loading scenario…</p>
      </div>
    );
  }

  const eventLabel =
    scenario.event.type === 'emergency'
      ? 'Emergency'
      : scenario.event.type === 'temptation'
        ? 'Temptation'
        : 'Opportunity';

  return (
    <div className="finsim-module__card">
      <h2>
        Round {round} / {totalRounds}
      </h2>
      <p className="finsim-module__scenario-text">{scenario.description}</p>
      <ul className="finsim-module__meta">
        <li className="finsim-module__chip">Income {formatMoney(scenario.income)}</li>
        <li className="finsim-module__chip">Fixed {formatMoney(scenario.fixedExpenses)}</li>
        <li className="finsim-module__chip finsim-module__chip--event">
          {eventLabel} · {formatMoney(scenario.event.cost)}
        </li>
      </ul>
      <p className="finsim-module__pool">
        Allocatable pool (after fixed): <strong>{formatMoney(pool)}</strong>
      </p>

      <div className="finsim-module__btn-row">
        {subphase === 'event_pending' ? (
          <button type="button" className="finsim-module__btn finsim-module__btn--warn" onClick={onTriggerEvent}>
            Trigger event
          </button>
        ) : null}
        {subphase === 'between' ? (
          <button type="button" className="finsim-module__btn" onClick={onNextRound}>
            Next round
          </button>
        ) : null}
      </div>
    </div>
  );
}
