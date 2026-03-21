'use client';

import React from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';

export const SubscriptionBadge: React.FC = () => {
  const { subscription, loading, hasActiveSubscription } = useSubscription();

  if (loading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Badge>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <span className="text-xs">Free</span>
      </Badge>
    );
  }

  const price = subscription?.items.data[0]?.price;
  const amount = price ? (price.unit_amount / 100).toFixed(0) : '0';
  const isTrialing = subscription?.status === 'trialing';

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600">
      <Crown className="h-3 w-3" />
      <span className="text-xs">
        {isTrialing ? 'Trial' : `$${amount}/mo`}
      </span>
    </Badge>
  );
};
