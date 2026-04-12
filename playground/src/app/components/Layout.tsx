import { ReactNode } from 'react';

import { BottomNav } from './BottomNav';
import { RightPanel } from './RightPanel';
import { TopNav } from './TopNav';

interface LayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export function Layout({ children, showRightPanel = true }: LayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <TopNav />

      <div className="flex justify-center">
        <main className="flex-1 max-w-7xl w-full pb-20 md:pb-12 md:px-6">
          <div className={`flex ${showRightPanel ? 'lg:gap-8' : ''}`}>
            <div className="flex-1 min-w-0">{children}</div>
            {showRightPanel && (
              <div className="hidden lg:block">
                <RightPanel />
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
