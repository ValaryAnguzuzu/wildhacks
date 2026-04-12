import { ReactNode } from 'react';

import { TopNav } from './TopNav';

interface LayoutProps {
  children: ReactNode;
}

/** Site-style layout: sticky header with primary nav on top, centered content. */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <TopNav />
      <div className="flex-1 flex justify-center">
        <main className="w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
