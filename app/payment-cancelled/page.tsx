'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export default function PaymentCancelledPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any pending Stripe customer ID from localStorage since payment was cancelled
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stripeCustomerId');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 py-10 mx-auto">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-base">
            Your subscription payment was cancelled
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">What happened?</h3>
            <p className="text-sm text-muted-foreground">
              Your payment was cancelled and no charges were made to your account.
              This could have happened for several reasons:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>You chose to cancel the checkout process</li>
              <li>The payment session expired</li>
              <li>There was an issue with your payment method</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-900">Need help?</p>
                <p className="text-sm text-blue-800">
                  If you experienced any issues during checkout or have questions about our plans,
                  please don&apos;t hesitate to contact our support team. We&apos;re here to help!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Have questions or need assistance?
            </p>
            <Button
              variant="link"
              onClick={() => {
                // You can replace this with your actual support email or link
                window.location.href = 'mailto:support@closr.com';
              }}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
