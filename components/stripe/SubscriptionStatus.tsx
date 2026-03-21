/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';
import { stripeApi } from '@/lib/stripeApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, CreditCard, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const SubscriptionStatus: React.FC = () => {
  const router = useRouter();
  const { subscription, loading, error, refreshSubscription, userSubscription } = useSubscription();
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    if (!subscription) return;

    setCanceling(true);
    try {
      const response = await stripeApi.cancelSubscription(subscription.id);

      if (response.success) {
        toast.success('Subscription cancelled successfully');
        await refreshSubscription();
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
      //@ts-nocheck
    } catch (err: any) {
      console.error('Cancel error:', err);
      toast.error(err.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading subscription...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don&apos;t have an active subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Subscribe to a plan to access all features and benefits.
            </p>
            <Button onClick={() => router.push('/pricing')}>
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const price = subscription.items?.data?.[0]?.price;
  const amount = price ? (price.unit_amount / 100).toFixed(2) : 
                 userSubscription?.subscription_plan ? 'Custom Plan' : '0.00';
  const interval = price?.recurring?.interval || userSubscription?.billing_interval || 'month';
  const nextBillingDate = new Date(
    subscription?.items?.data?.[0]?.current_period_end * 1000 || 
    subscription.current_period_end * 1000 ||
    (userSubscription?.current_period_end ? new Date(userSubscription.current_period_end).getTime() : 0)
  );
  const isCanceled = subscription.status === 'canceled';
  const isTrialing = subscription.status === 'trialing';

  const statusConfig = {
    active: { color: 'bg-green-500', icon: CheckCircle2, label: 'Active', variant: 'default' as const },
    trialing: { color: 'bg-blue-500', icon: Clock, label: 'Trial', variant: 'secondary' as const },
    canceled: { color: 'bg-red-500', icon: XCircle, label: 'Cancelled', variant: 'destructive' as const },
    incomplete: { color: 'bg-yellow-500', icon: Clock, label: 'Incomplete', variant: 'secondary' as const },
    past_due: { color: 'bg-orange-500', icon: XCircle, label: 'Past Due', variant: 'destructive' as const },
  };

  const status = statusConfig[subscription.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Your Subscription
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Plan Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Plan</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {typeof amount === 'string' ? amount : `$${amount}`}/{interval}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {isCanceled ? 'Ends on' : 'Next billing date'}
              </span>
            </div>
            <div className="text-right">
              <p className="font-medium">{nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>

          {isTrialing && subscription.trial_end && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Trial ends</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Date(subscription.trial_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Subscription ID</div>
            <div className="text-right">
              <code className="text-xs bg-muted px-2 py-1 rounded">{subscription.id}</code>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/pricing')}
          >
            Change Plan
          </Button>

          {!isCanceled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1" disabled={canceling}>
                  {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your subscription. You will continue to have access until{' '}
                    <strong>{nextBillingDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isCanceled && (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Your subscription has been cancelled. You can continue to use the service until{' '}
            {nextBillingDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
