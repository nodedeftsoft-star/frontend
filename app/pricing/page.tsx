"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '@/store/user';
import { toast } from 'sonner';

// Pricing plans configuration
const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: null,
    subtitle: "30 days free, then $50/month",
    description: "Get started and try the platform",
    priceId: process.env.NEXT_PUBLIC_STRIPE_FREE_PRICE || "price_free_trial_50_monthly",
    interval: "month",
    features: [
      "30 days free trial",
      "$50/month after trial",
      "Full platform access",
      "Daily NYC data pulls",
      "Client management",
      "Property matching",
      "Mobile apps",
      "Email support"
    ],
    isPopular: false,
    trialDays: 30,
    cta: "Start Free Trial"
  },
  {
    id: "buyers_agent",
    name: "Buyer's Agent",
    price: 30,
    subtitle: "/month",
    description: "Perfect for buyer-focused agents",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUYERS_PRICE || "",
    interval: "month",
    features: [
      "Buyer lifecycle tools",
      "Property matching",
      "Daily data updates",
      "Client portal",
      "Mobile apps",
      "Priority support",
      "Advanced filters",
      "Market insights"
    ],
    isPopular: false,
    trialDays: 14,
    cta: "Get Started"
  },
  {
    id: "full_saas",
    name: "Full SaaS",
    price: 50,
    subtitle: "/month",
    description: "Complete real estate CRM platform",
    priceId: process.env.NEXT_PUBLIC_STRIPE_FULL_SAAS_PRICE || "",
    interval: "month",
    features: [
      "Everything in Buyer's Agent",
      "Seller management",
      "Renter & landlord tools",
      "Complete lifecycle CRM",
      "Advanced analytics",
      "Custom workflows",
      "API access",
      "Dedicated support"
    ],
    isPopular: true,
    trialDays: 14,
    cta: "Get Started"
  },
  {
    id: "annual",
    name: "Annual",
    price: 550,
    subtitle: "/year",
    description: "Save with yearly commitment",
    priceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE || "",
    interval: "year",
    features: [
      "All Full SaaS features",
      "11 months paid, 1 free",
      "Save $50 per year",
      "Priority onboarding",
      "Dedicated account manager",
      "Custom integrations",
      "Training sessions",
      "SLA guarantee"
    ],
    isPopular: false,
    trialDays: 14,
    cta: "Get Started",
    badge: "Best Value"
  }
];

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle URL parameters for cancelled payments
  useEffect(() => {
    const cancelled = searchParams.get('cancelled');
    if (cancelled === 'true') {
      toast.error('Payment was cancelled. You can try again anytime.');
      // Clean up the URL
      router.replace('/pricing');
    }
  }, [searchParams, router]);

  const handleSkip = () => {
    router.push("/");
  };

  const handleSubscribe = async (plan: typeof pricingPlans[0]) => {
    setLoadingPlan(plan.id);

    try {
      // Check if user is logged in
      if (!user) {
        // Redirect to landing page checkout flow (no auth required)
        const landingUrl = `https://closrcrm-landing-page.vercel.app?plan=${plan.id}`;
        window.location.href = landingUrl;
        return;
      }

      // For logged-in users, use the landing checkout endpoint
      toast.info('Setting up your subscription...');
      
      // Capture all query params to pass them through
      const queryParams: Record<string, string> = {
        plan: plan.id,
        userId: user.id,
        email: user.email
      };

      const checkoutRes = await fetch("/api/stripe/landing-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          package: plan.id,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
          metadata: queryParams,
          userId: user.id,
          customerId: user.stripe_customer_id,
          email: user.email
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (checkoutRes.ok && checkoutData?.data?.url) {
        window.location.href = checkoutData.data.url;
      } else {
        throw new Error(checkoutData.message || 'Failed to create checkout session');
      }
    } catch (err: unknown) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <span className="text-sm text-primary">Pricing</span>
          </div>

          <h1 className="text-4xl md:text-5xl mb-4 tracking-tight font-bold">
            Simple pricing for real estate pros
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. Start with 30 days free and scale as you grow.
          </p>
          
          <Button onClick={handleSkip} variant="ghost" className="text-sm text-muted-foreground hover:text-foreground mt-4">
            Skip for now →
          </Button>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">

          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl p-8 h-full flex flex-col hover:-translate-y-1 transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl border-2 border-primary/20'
                  : 'bg-card border border-border shadow-sm hover:shadow-md'
              }`}
            >

              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm z-10">
                  Most Popular
                </div>
              )}

              {/* Best Value badge */}
              {plan.badge && !plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-400 text-green-900 rounded-full text-sm z-10">
                  {plan.badge}
                </div>
              )}

              {/* HEADER */}
              <div className="mb-6 min-h-[140px] flex flex-col justify-between">
                <div>
                  <h3 className={`text-2xl mb-2 font-semibold ${plan.isPopular ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>

                  <p className={`text-sm mb-4 leading-relaxed ${
                    plan.isPopular ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {plan.description}
                  </p>
                </div>

                {/* PRICE */}
                {plan.price ? (
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${plan.isPopular ? 'text-primary-foreground' : 'text-foreground'}`}>
                      ${plan.price}
                    </span>
                    <span className={plan.isPopular ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      {plan.subtitle}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className={`text-4xl font-bold ${plan.isPopular ? 'text-primary-foreground' : 'text-foreground'}`}>
                      Free
                    </span>
                    <p className={plan.isPopular ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      30 days trial
                    </p>
                  </div>
                )}
              </div>

              {/* FEATURES → takes remaining space */}
              <ul className="space-y-4 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 mt-0.5 ${
                        plan.isPopular ? 'text-primary-foreground' : 'text-primary'
                      }`}
                    />
                    <span className={plan.isPopular ? 'text-primary-foreground/90' : 'text-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA → always bottom aligned */}
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-3.5 rounded-full transition-all duration-200 ${
                  plan.isPopular
                    ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                size="lg"
              >
                {loadingPlan === plan.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 
                        0 0 5.373 0 12h4zm2 
                        5.291A7.962 7.962 0 
                        014 12H0c0 3.042 
                        1.135 5.824 3 
                        7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </Button>

            </motion.div>
          ))}

        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16 w-full">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">What&apos;s included in the free trial?</h3>
              <p className="text-sm text-muted-foreground">
                You get full access to all features during the trial. No credit card required until the trial ends.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">What happens after the trial ends?</h3>
              <p className="text-sm text-muted-foreground">
                After your trial ends, you&apos;ll be charged according to your selected plan. You can cancel anytime during the trial without being charged.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Can I cancel my subscription?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time from your account settings. You&apos;ll continue to have access until the end of your billing period.
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
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}