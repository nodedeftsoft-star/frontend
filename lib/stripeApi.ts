import api from "./api";

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error?: unknown;
}

// Stripe Customer Types
export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  created: number;
  metadata: Record<string, string>;
}

// Stripe Subscription Types
export interface StripeSubscription {
  id: string;
  customer: string;
  status: "active" | "trialing" | "canceled" | "incomplete" | "past_due";
  current_period_start: number;
  current_period_end: number;
  trial_start: number | null;
  trial_end: number | null;
  items: {
    data: Array<{
      current_period_end: number;
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: "day" | "week" | "month" | "year";
          interval_count: number;
        };
      };
    }>;
  };
}

// Stripe Payment Intent Types
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "succeeded"
    | "canceled";
  client_secret: string;
  customer: string | null;
  metadata: Record<string, string>;
}

// Stripe Checkout Session Types
export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string | null;
  mode: "subscription";
  status: "open" | "complete" | "expired";
}

// Request Types
export interface CreateCustomerRequest {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  trialDays?: number;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  customerId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Stripe API Service
export const stripeApi = {
  // Customer Management
  createCustomer: async (
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<StripeCustomer>> => {
    try {
      const response = await api.post<ApiResponse<StripeCustomer>>("/stripe/customer", {
        email,
        name,
        metadata,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to create customer");
    }
  },

  getCustomer: async (customerId: string): Promise<ApiResponse<StripeCustomer>> => {
    try {
      const response = await api.get<ApiResponse<StripeCustomer>>(`/stripe/customer/${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch customer");
    }
  },

  // Subscription Management
  createSubscription: async (
    customerId: string,
    priceId: string,
    trialDays?: number
  ): Promise<ApiResponse<StripeSubscription>> => {
    try {
      const response = await api.post<ApiResponse<StripeSubscription>>("/stripe/subscription", {
        customerId,
        priceId,
        trialDays,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to create subscription");
    }
  },

  getSubscription: async (subscriptionId: string): Promise<ApiResponse<StripeSubscription>> => {
    try {
      const response = await api.get<ApiResponse<StripeSubscription>>(`/stripe/subscription/${subscriptionId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch subscription");
    }
  },

  listCustomerSubscriptions: async (customerId: string): Promise<ApiResponse<StripeSubscription[]>> => {
    try {
      const response = await api.get<ApiResponse<StripeSubscription[]>>(`/stripe/customer/${customerId}/subscriptions`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch subscriptions");
    }
  },

  cancelSubscription: async (subscriptionId: string): Promise<ApiResponse<StripeSubscription>> => {
    try {
      const response = await api.delete<ApiResponse<StripeSubscription>>(`/stripe/subscription/${subscriptionId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to cancel subscription");
    }
  },

  // Payment Management
  createPaymentIntent: async (
    amount: number,
    currency: string,
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<ApiResponse<StripePaymentIntent>> => {
    try {
      const response = await api.post<ApiResponse<StripePaymentIntent>>("/stripe/payment-intent", {
        amount,
        currency,
        customerId,
        metadata,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to create payment intent");
    }
  },

  // Checkout Session
  createCheckoutSession: async (
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<ApiResponse<StripeCheckoutSession>> => {
    try {
      const response = await api.post<ApiResponse<StripeCheckoutSession>>("/stripe/checkout-session", {
        priceId,
        customerId,
        successUrl,
        cancelUrl,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to create checkout session");
    }
  },
};

// Error handling utility
export class StripeApiError extends Error {
  constructor(message: string, public statusCode?: number, public details?: unknown) {
    super(message);
    this.name = "StripeApiError";
  }
}

// Error messages
export const StripeErrorMessages = {
  UNAUTHORIZED: "Please log in to continue",
  SUBSCRIPTION_EXISTS: "You already have an active subscription",
  PAYMENT_FAILED: "Payment failed. Please try again or use a different payment method.",
  CUSTOMER_NOT_FOUND: "Customer not found. Please contact support.",
  SUBSCRIPTION_NOT_FOUND: "Subscription not found.",
  NETWORK_ERROR: "Network error. Please check your internet connection.",
};

//2