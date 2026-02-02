'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { AblyChatProvider } from '@/components/ably-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AblyChatProvider>
        {children}
      </AblyChatProvider>
    </SessionProvider>
  );
}
