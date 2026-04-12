import React from 'react';

import { DISMISS_PLACEMENT_ID, LevelData, PlacedBlock } from '../types';

function correctLaneLabel(
  level: LevelData,
  block: { correctColumn: string; isDistractor?: boolean },
): string {
  if (block.isDistractor) {
    return 'Not a lane — dismiss';
  }
  return (
    level.columns.find((c) => c.id === block.correctColumn)?.label ?? block.correctColumn
  );
}

function yourPlacementLabel(level: LevelData, p: PlacedBlock): string {
  if (p.columnId === DISMISS_PLACEMENT_ID) {
    return 'Dismissed';
  }
  return level.columns.find((c) => c.id === p.columnId)?.label ?? p.columnId;
}

interface Props {
  level: LevelData;
  /** If provided (e.g. after a run), show how each block went for the player. */
  placements?: PlacedBlock[];
}

export function LevelAnswerKey({ level, placements }: Props) {
  const byId = new Map(placements?.map((p) => [p.block.id, p]) ?? []);

  return (
    <ul className="answer-key-list">
      {level.blocks.map((block) => {
        const p = byId.get(block.id);
        const canonical = correctLaneLabel(level, block);

        return (
          <li key={block.id} className="answer-key-item">
            <div className="answer-key-item-head">
              <span className="answer-key-name">{block.name}</span>
              {p && (
                <span
                  className={
                    p.correct
                      ? 'answer-key-badge answer-key-badge--ok'
                      : 'answer-key-badge answer-key-badge--bad'
                  }
                >
                  {p.correct ? 'You: correct' : 'You: miss'}
                </span>
              )}
            </div>
            <div className="answer-key-row">
              <span className="answer-key-label">Correct</span>
              <span className="answer-key-value">{canonical}</span>
            </div>
            {p && (
              <div className="answer-key-row answer-key-row--muted">
                <span className="answer-key-label">Your pick</span>
                <span className="answer-key-value">{yourPlacementLabel(level, p)}</span>
              </div>
            )}
            <p className="answer-key-desc">{block.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
