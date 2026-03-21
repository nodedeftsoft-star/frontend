'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { stripeApi, StripeSubscription, StripeCustomer } from '@/lib/stripeApi';
import api from '@/lib/api';
import { useUser } from '@/store/user';
// import axios from "axios";

interface UserSubscription {
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  price_id: string | null;
  billing_interval: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  daysRemaining?: number | null;
  subscriptionDetails?: StripeSubscription | null;
  isActive?: boolean;
}

interface SubscriptionContextType {
  customer: StripeCustomer | null;
  subscription: StripeSubscription | null;
  userSubscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  setCustomerId: (customerId: string) => void;
  daysRemaining: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// const baseURL = `http://localhost:3000/api/`

// const api = axios.create({
//   baseURL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true,
// });

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useUser(); // Get user from Zustand store
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerIdState] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);


  const refreshSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in first
      if (!user) {
        setLoading(false);
        return;
      }

      // Primary: Get subscription from frontend API endpoint
      try {
        const response = await fetch('/api/subscription', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        console.log("Subscription API response:", data);

        if (data.success && data.data) {
          const userSub = data.data;
          
          // Store the full user subscription data
          setUserSubscription(userSub);
          
          console.log('Backend daysRemaining:', userSub.daysRemaining);
          
          // Calculate days remaining correctly based on current period end
          let calculatedDaysRemaining = null;
          if (userSub.current_period_end) {
            const periodEnd = new Date(userSub.current_period_end);
            const now = new Date();
            
            // Option 1: Real-time countdown (exact time remaining)
            const diffTime = periodEnd.getTime() - now.getTime();
            const realTimeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Option 2: Calendar days remaining (full days left)
            const periodEndMidnight = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
            const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const calendarDiffTime = periodEndMidnight.getTime() - nowMidnight.getTime();
            const calendarDays = Math.ceil(calendarDiffTime / (1000 * 60 * 60 * 24));
            
            // Use real-time countdown for more accurate UX
            calculatedDaysRemaining = realTimeDays > 0 ? realTimeDays : 0;
            
            console.log('=== DAYS REMAINING CALCULATION ===');
            console.log('userSub.current_period_end:', userSub.current_period_end);
            console.log('periodEnd:', periodEnd);
            console.log('now:', now);
            console.log('diffTime (ms):', diffTime);
            console.log('diffTime (hours):', diffTime / (1000 * 60 * 60));
            console.log('Real-time days (Math.ceil):', realTimeDays);
            console.log('Calendar days (midnight):', calendarDays);
            console.log('Using real-time days:', calculatedDaysRemaining);
          }
          console.log('Setting daysRemaining to:', calculatedDaysRemaining);
          setDaysRemaining(calculatedDaysRemaining);

          // Use subscriptionDetails from API if available
          if (userSub.subscriptionDetails) {
            setSubscription(userSub.subscriptionDetails);
          } else if (userSub.stripe_subscription_id) {
            // Fallback: Create a minimal subscription object from database data
            const validStatus = userSub.subscription_status as "active" | "trialing" | "canceled" | "incomplete" | "past_due" | null;
            if (validStatus && ['active', 'trialing', 'canceled', 'incomplete', 'past_due'].includes(validStatus)) {
              setSubscription({
                id: userSub.stripe_subscription_id,
                status: validStatus,
                current_period_start: userSub.current_period_start ? new Date(userSub.current_period_start).getTime() / 1000 : 0,
                current_period_end: userSub.current_period_end ? new Date(userSub.current_period_end).getTime() / 1000 : 
                                   (userSub.subscription_ends_at ? new Date(userSub.subscription_ends_at).getTime() / 1000 : 0),
                trial_start: userSub.trial_starts_at ? new Date(userSub.trial_starts_at).getTime() / 1000 : null,
                trial_end: userSub.trial_ends_at ? new Date(userSub.trial_ends_at).getTime() / 1000 : null,
              } as StripeSubscription);
            }
          }
        } else {
          // No subscription found
          setSubscription(null);
          setUserSubscription(null);
          setDaysRemaining(null);
        }
      } catch (dbErr: unknown) {
        // Only log if it's not an auth error (401)
        const axiosError = dbErr as { response?: { status: number } };
        if (axiosError.response?.status !== 401) {
          const errorMessage = dbErr instanceof Error ? dbErr.message : 'Unknown error';
          console.warn('Could not fetch subscription from database, trying localStorage fallback:', errorMessage);
        }
      }

      // Fallback: Use localStorage customerId if database query failed
      const storedCustomerId = customerId || (typeof window !== 'undefined' ? localStorage.getItem('stripeCustomerId') : null);

      if (!storedCustomerId) {
        setLoading(false);
        return;
      }

      // Load customer details
      const customerResponse = await stripeApi.getCustomer(storedCustomerId);
      if (customerResponse.success && customerResponse.data) {
        setCustomer(customerResponse.data);
      }

      // Load subscriptions
      const subsResponse = await stripeApi.listCustomerSubscriptions(storedCustomerId);
      if (subsResponse.success && subsResponse.data) {
        // Find the most recent active or trialing subscription
        const activeSub = subsResponse.data.find(
          (sub: StripeSubscription) => sub.status === 'active' || sub.status === 'trialing'
        );
        setSubscription(activeSub || null);
      }
    } catch (err: unknown) {
      // Only log non-auth errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription';
      if (!errorMessage?.includes('Unauthorized')) {
        console.error('Error refreshing subscription:', err);
        setError(errorMessage);
      }
      // Silently ignore auth errors (user not logged in)
    } finally {
      setLoading(false);
    }
  }, [customerId, user]);

  const setCustomerId = (id: string) => {
    setCustomerIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stripeCustomerId', id);
    }
    refreshSubscription();
  };

  useEffect(() => {
    // Initial load - refresh subscription when user changes
    if (typeof window !== 'undefined') {
      if (user) {
        const storedCustomerId = localStorage.getItem('stripeCustomerId');
        if (storedCustomerId) {
          setCustomerIdState(storedCustomerId);
          refreshSubscription();
        } else {
          setLoading(false);
        }
      } else {
        // User not logged in, clear state
        setCustomer(null);
        setSubscription(null);
        setUserSubscription(null);
        setLoading(false);
      }
    }
  }, [user, refreshSubscription]); // Re-run when user changes

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <SubscriptionContext.Provider
      value={{
        customer,
        subscription,
        userSubscription,
        loading,
        error,
        refreshSubscription,
        hasActiveSubscription,
        setCustomerId,
        daysRemaining,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
