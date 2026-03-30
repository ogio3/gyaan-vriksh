'use client';

import { useEffect, type ReactNode } from 'react';

interface ShareGuardProps {
  children: ReactNode;
  active?: boolean;
}

// Prevents screenshots/printing on sensitive child data pages.
// This is a deterrent, not a guarantee — determined users can always capture screens.
// Legal protection is in the Terms of Service (§6.7).
export function ShareGuard({ children, active = true }: ShareGuardProps) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText('').catch(() => {});
      }
      // Block Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
      // Block Ctrl+Shift+S (screenshot tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <div
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}
