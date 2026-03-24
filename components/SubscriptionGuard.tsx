'use client';

import { useEffect, useState } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { hasActiveSubscription, loading } = useSubscription();
  const pathname = usePathname();
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    // Don't check subscription on public routes or during loading
    const publicRoutes = ['/login', '/signup', '/password-reset', '/pricing', '/payment-success', '/payment-cancelled'];
    const isPublicRoute = publicRoutes.some(route => pathname.includes(route));
    
    if (loading || isPublicRoute || toastShown) {
      return;
    }

    // If user doesn't have active subscription, show toast once
    if (!hasActiveSubscription) {
      toast("Subscription Required", {
        description: "You need an active subscription to access this feature. Please upgrade your plan to continue.",
        duration: 6000,
        style: {
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          color: '#1f2937',
        },
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            window.location.href = "/pricing";
          },
        },
      });
      setToastShown(true);
    } else {
      // Reset toast shown when subscription becomes active
      setToastShown(false);
    }
  }, [hasActiveSubscription, loading, pathname, toastShown]);

  return <>{children}</>;
}
