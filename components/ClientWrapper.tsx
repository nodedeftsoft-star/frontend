'use client';

import { SubscriptionGuard } from '@/components/SubscriptionGuard';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
