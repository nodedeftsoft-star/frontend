'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/context/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, refreshSubscription, loading: contextLoading, userSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // Refresh subscription data after successful checkout
    const loadSubscriptionDetails = async () => {
      try {
        // Refresh subscription - the new implementation checks database first
        // which should have been updated by the webhook
        await refreshSubscription();

        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (err) {
        console.error('Error loading subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      // Load subscription details immediately
      // The webhook should have already updated the database
      loadSubscriptionDetails();
    } else {
      setLoading(false);
    }
  }, [searchParams, refreshSubscription, router]);

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 mx-auto">
        <Card className="max-w-2xl w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Confirming your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = subscription?.items?.data?.[0]?.price;
  const amount = price ? (price.unit_amount / 100).toFixed(2) : 
                 userSubscription?.subscription_plan ? userSubscription.subscription_plan : '0.00';
 
  const isTrialing = subscription?.status === 'trialing';
  const trialEndDate = subscription?.trial_end
    ? new Date(subscription.trial_end * 1000).toLocaleDateString()
    : '';

  // For trialing subscriptions, the first billing date is when trial ends
  // For active subscriptions, next billing date is current_period_end
  const nextBillingDate = subscription
    ? new Date(
        subscription?.items?.data?.[0]?.current_period_end * 1000 || 
        subscription.current_period_end * 1000 ||
        (userSubscription?.current_period_end ? new Date(userSubscription.current_period_end).getTime() : 0)
      ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : '';

  // During trial, current_period_end is the trial end date, which is also the first billing date
  const firstBillingDate = isTrialing && subscription?.trial_end
    ? new Date(subscription.trial_end * 1000).toLocaleDateString()
    : nextBillingDate;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 py-10 mx-auto">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {subscription && (
            <>
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Subscription Details</h3>
                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold">
                      {typeof amount === 'string' && isNaN(parseFloat(amount)) 
                        ? amount 
                        : `$${amount}/{interval}`
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold capitalize">
                      {isTrialing ? 'Trial Period' : subscription.status}
                    </span>
                  </div>

                  {isTrialing && trialEndDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Trial ends on</span>
                      <span className="font-semibold">{trialEndDate}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {isTrialing ? 'First billing date' : 'Next billing date'}
                    </span>
                    <span className="font-semibold">{isTrialing ? firstBillingDate : nextBillingDate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-900">
                  {isTrialing
                    ? `Your trial period is active! You won't be charged until ${trialEndDate}.`
                    : 'Your subscription is now active and you have full access to all features.'}
                </p>
                {/* <p className="text-xs text-blue-700 font-medium">
                  Redirecting to dashboard in a few seconds...
                </p> */}
              </div>
            </>
          )}

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => router.push('/subscription')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Manage Subscription
            </Button>
          </div>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>
              A confirmation email has been sent to your email address.
              <br />
              If you have any questions, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen p-6 mx-auto">
        <Card className="max-w-2xl w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
