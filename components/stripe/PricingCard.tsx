'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { stripeApi } from '@/lib/stripeApi';
import { useUser } from '@/store/user';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  priceId: string;
  interval: string;
  features: string[];
  isPopular?: boolean;
  trialDays?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  id,
  name,
  price,
  priceId,
  interval,
  features,
  isPopular = false,
  trialDays = 0,
}) => {
  const router = useRouter();
  const user = useUser();
  const { setCustomerId } = useSubscription();
  const [loading, setLoading] = useState(false);
  console.log(id, setCustomerId)
  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Check if user is logged in
      if (!user) {
        toast.error('Please log in to subscribe');
        router.push('/login?redirect=/pricing');
        return;
      }

      // Get or create Stripe customer
      let customerId = typeof window !== 'undefined' ? localStorage.getItem('stripeCustomerId') : null;

      if (!customerId) {
        toast.info('Creating your account...');
        const customerResponse = await stripeApi.createCustomer(
          user.email,
          `${user.firstname} ${user.lastname}`,
          { userId: user.id }
        );

        if (customerResponse.success && customerResponse.data) {
          customerId = customerResponse.data.id;
          // Store temporarily in localStorage but will be cleared if payment is cancelled
          if (typeof window !== 'undefined') {
            localStorage.setItem('stripeCustomerId', customerId);
          }
        } else {
          throw new Error('Failed to create customer account');
        }
      }

      // Create checkout session
      toast.info('Redirecting to checkout...');
      const checkoutResponse = await stripeApi.createCheckoutSession(
        priceId,
        customerId,
        `${window.location.origin}/payment-success`,
        `${window.location.origin}/payment-cancelled`
      );

      if (checkoutResponse.success && checkoutResponse.data) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutResponse.data.url;
      } else {
        throw new Error(checkoutResponse.message || 'Failed to create checkout session');
      }
    } catch (err: unknown) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>
          {trialDays > 0 && (
            <div className="mt-4 mb-3">
              <p className="text-2xl font-bold text-primary">FREE for {trialDays} days</p>
              <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
            </div>
          )}
          <div className="mt-2 flex items-baseline">
            <span className="text-muted-foreground text-sm">then </span>
            <span className="text-3xl font-bold text-foreground ml-1">${price}</span>
            <span className="ml-1 text-muted-foreground">/{interval}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full"
          size="lg"
          variant={isPopular ? 'default' : 'outline'}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};
