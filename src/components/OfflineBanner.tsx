import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[300] px-4 py-2 text-center text-sm"
      style={{ backgroundColor: 'var(--amber)', color: '#1a1a1a' }}
    >
      You&apos;re offline. Progress will sync when you&apos;re back.
    </div>
  );
}
