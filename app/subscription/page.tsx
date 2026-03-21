'use client';

import React from 'react';
import { SubscriptionStatus } from '@/components/stripe/SubscriptionStatus';

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col gap-8 p-6 py-10 mx-auto h-full pb-[200px]">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription, billing, and payment information
        </p>
      </div>

      <div className="max-w-3xl">
        <SubscriptionStatus />
      </div>
    </div>
  );
}
