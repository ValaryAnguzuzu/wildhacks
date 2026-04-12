import { TrendingUp, Trophy } from 'lucide-react';

export function RightPanel() {
  return (
    <div className="w-80 sticky top-20 self-start">
      {/* Rival Card */}
      <div
        className="p-5 rounded-[var(--radius-card)] mb-4 border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} style={{ color: 'var(--xp-gold)' }} />
          <h3
            className="font-semibold"
            style={{
              fontSize: 'var(--font-subheading)',
              color: 'var(--text-primary)',
            }}
          >
            Your rival
          </h3>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor: 'var(--indigo)',
              color: 'white',
            }}
          >
            AS
          </div>
          <div>
            <div
              className="font-semibold"
              style={{
                fontSize: 'var(--font-body)',
                color: 'var(--text-primary)',
              }}
            >
              Alex Smith
            </div>
            <div
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              1,315 XP
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--surface-elevated)' }}
        >
          <TrendingUp size={16} style={{ color: 'var(--rose)' }} />
          <span
            style={{
              fontSize: 'var(--font-caption)',
              color: 'var(--text-secondary)',
            }}
          >
            75 XP ahead · Completed a lesson 2h ago
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h3
          className="font-semibold mb-3"
          style={{
            fontSize: 'var(--font-subheading)',
            color: 'var(--text-primary)',
          }}
        >
          This week
        </h3>

        <div className="space-y-3">
          <div
            className="p-4 rounded-[var(--radius-card)] border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--font-heading)',
                color: 'var(--text-primary)',
              }}
            >
              20
            </div>
            <div
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              Lessons completed
            </div>
          </div>

          <div
            className="p-4 rounded-[var(--radius-card)] border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="font-bold mb-1"
              style={{
                fontSize: 'var(--font-heading)',
                color: 'var(--xp-gold)',
              }}
            >
              300 XP
            </div>
            <div
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              Points earned
            </div>
          </div>

          <div
            className="p-4 rounded-[var(--radius-card)]"
            style={{
              backgroundColor: 'var(--teal)20',
              border: '1px solid var(--teal)40',
            }}
          >
            <div
              className="font-semibold"
              style={{
                fontSize: 'var(--font-body)',
                color: 'var(--teal)',
              }}
            >
              🔥 On fire!
            </div>
            <div
              className="mt-1"
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--text-secondary)',
              }}
            >
              You&apos;re in the top 18% this week
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
