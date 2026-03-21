"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PricingCard } from "@/components/stripe/PricingCard";
import { Button } from "@/components/ui/button";

// Pricing plans configuration
// Using Pro plan as the single subscription tier
const pricingPlans = [
  {
    id: "pro",
    name: "Pro Plan",
    price: 49.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE || "",
    interval: "month",
    features: [
      "Unlimited Active Listings",
      "Unlimited Buyer/Renter Contacts",
      "Advanced Match Finder with AI",
      "Priority Email Support",
      "Advanced Dashboard Analytics",
      "Bulk Upload (CSV/Excel)",
      "Custom Branding",
      "API Access",
    ],
    isPopular: true,
    trialDays: 14,
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-8 p-6 py-10 h-full pb-[200px] mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Subscribe to Closr Pro</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get unlimited access to all features with our Pro plan. Start with a 14-day free trial.
        </p>
        <Button onClick={handleSkip} variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
          Skip for now →
        </Button>
      </div>

      {/* Pricing Card - Centered */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-md">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              price={plan.price}
              priceId={plan.priceId}
              interval={plan.interval}
              features={plan.features}
              isPopular={plan.isPopular}
              trialDays={plan.trialDays}
            />
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-16 w-full">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">What&apos;s included in the 14-day free trial?</h3>
            <p className="text-sm text-muted-foreground">
              You get full access to all Pro features during the trial. No credit card required until the trial ends.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">What happens after the trial ends?</h3>
            <p className="text-sm text-muted-foreground">
              After your 14-day trial ends, you&apos;ll be charged $49.99/month. You can cancel anytime during the trial
              without being charged.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Can I cancel my subscription?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time from your account settings. You&apos;ll continue to have
              access until the end of your billing period.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee. Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
