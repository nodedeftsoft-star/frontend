'use client';

import { useEffect } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { toast } from 'sonner';

export function SubscriptionToast() {
  const { hasActiveSubscription, loading } = useSubscription();

  useEffect(() => {
    if (!loading && !hasActiveSubscription) {
      toast("Subscription Required", {
        description: "You need an active subscription to access this feature.",
        duration: 5000,
      });
    }
  }, [hasActiveSubscription, loading]);

  return null;
}
