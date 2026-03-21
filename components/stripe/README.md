# Stripe Components

This directory contains all React components related to Stripe payment integration.

## Components

### PricingCard.tsx
**Purpose:** Display individual pricing plans with features and handle subscription checkout.

**Props:**
```typescript
interface PricingCardProps {
  id: string;           // Unique plan identifier
  name: string;         // Plan name (e.g., "Pro Plan")
  price: number;        // Price in dollars (e.g., 29.99)
  priceId: string;      // Stripe Price ID
  interval: string;     // Billing interval (e.g., "month")
  features: string[];   // List of plan features
  isPopular?: boolean;  // Show "Most Popular" badge
  trialDays?: number;   // Number of trial days
}
```

**Usage:**
```tsx
<PricingCard
  id="pro"
  name="Pro Plan"
  price={29.99}
  priceId="price_ABC123"
  interval="month"
  features={['Feature 1', 'Feature 2']}
  isPopular={true}
  trialDays={14}
/>
```

**Features:**
- Displays plan name, price, and features
- Shows trial period information
- Handles customer creation if needed
- Creates Stripe Checkout session
- Redirects to Stripe Checkout
- Loading states and error handling
- User authentication check

---

### SubscriptionStatus.tsx
**Purpose:** Display and manage the user's current subscription.

**Props:** None (uses `useSubscription()` hook internally)

**Usage:**
```tsx
<SubscriptionStatus />
```

**Features:**
- Shows current subscription status
- Displays plan details and price
- Shows next billing date
- Displays trial end date (if applicable)
- Subscription cancellation with confirmation
- Change plan option
- Handles "no subscription" state
- Loading and error states
- Status badges (Active, Trial, Cancelled, etc.)

**Status Colors:**
- Active: Green
- Trial: Blue
- Cancelled: Red
- Incomplete: Orange
- Past Due: Red

---

### ErrorAlert.tsx
**Purpose:** Reusable component for displaying error messages.

**Props:**
```typescript
interface ErrorAlertProps {
  message: string;     // Error message to display
  title?: string;      // Error title (default: "Error")
  onClose?: () => void; // Optional close handler
}
```

**Usage:**
```tsx
<ErrorAlert
  message="Payment failed. Please try again."
  title="Payment Error"
  onClose={() => setError(null)}
/>
```

**Features:**
- Alert styling with icon
- Optional title
- Dismissible with close button
- Consistent error display

---

### SubscriptionBadge.tsx (Bonus)
**Purpose:** Small badge to display subscription status (can be used in sidebar/header).

**Props:** None (uses `useSubscription()` hook internally)

**Usage:**
```tsx
<SubscriptionBadge />
```

**Features:**
- Shows "Free" for non-subscribers
- Shows "Trial" during trial period
- Shows plan price for active subscriptions
- Premium styling with crown icon
- Loading state
- Compact design

**Display Examples:**
- Free tier: `[Free]`
- Trial: `[👑 Trial]`
- Paid: `[👑 $29/mo]`

---

## Common Patterns

### Using with Subscription Context

All components can access subscription data through the context:

```tsx
import { useSubscription } from '@/context/SubscriptionContext';

function MyComponent() {
  const {
    subscription,
    hasActiveSubscription,
    loading,
    error,
    refreshSubscription
  } = useSubscription();

  // Use subscription data
}
```

### Error Handling

Components use the `ErrorAlert` component for consistent error display:

```tsx
{error && (
  <ErrorAlert
    message={error}
    onClose={() => setError(null)}
  />
)}
```

### Loading States

Components show loading indicators during async operations:

```tsx
if (loading) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Loading...</span>
    </div>
  );
}
```

---

## Styling

All components use:
- **shadcn/ui components** for base UI elements
- **Tailwind CSS** for styling
- **Lucide React** icons
- **Responsive design** (mobile-first approach)

### Theme Support

Components automatically adapt to light/dark themes through shadcn/ui.

---

## Dependencies

These components require:
- `@/context/SubscriptionContext` - Subscription state
- `@/lib/stripeApi` - API service
- `@/store/user` - User state
- `@/components/ui/*` - shadcn/ui components
- `next/navigation` - Next.js navigation
- `sonner` - Toast notifications

---

## Testing

### Component Testing

```tsx
// Test PricingCard
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingCard } from './PricingCard';

test('renders pricing card correctly', () => {
  render(
    <PricingCard
      id="test"
      name="Test Plan"
      price={9.99}
      priceId="price_test"
      interval="month"
      features={['Feature 1']}
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();
  expect(screen.getByText('$9.99')).toBeInTheDocument();
});
```

---

## Best Practices

### 1. Always Check Authentication
```tsx
if (!user) {
  toast.error('Please log in to subscribe');
  router.push('/login?redirect=/pricing');
  return;
}
```

### 2. Use Loading States
```tsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    // Async operation
  } finally {
    setLoading(false);
  }
};
```

### 3. Handle Errors Gracefully
```tsx
try {
  await stripeApi.createSubscription(...);
  toast.success('Subscription created!');
} catch (error) {
  toast.error(error.message || 'Something went wrong');
}
```

### 4. Provide User Feedback
```tsx
// Use toast for non-blocking notifications
toast.success('Subscription cancelled');
toast.error('Payment failed');
toast.info('Processing payment...');

// Use dialogs for important confirmations
<AlertDialog>
  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
</AlertDialog>
```

---

## Customization

### Changing Colors

Edit the status colors in `SubscriptionStatus.tsx`:

```tsx
const statusConfig = {
  active: { color: 'bg-green-500', ... },
  trialing: { color: 'bg-blue-500', ... },
  // Add custom colors
};
```

### Adding Features

To add new features to `PricingCard`:

1. Update the component props
2. Add new UI elements
3. Handle new functionality
4. Update TypeScript types

### Custom Styling

Use Tailwind classes to customize:

```tsx
<Card className="custom-shadow border-2 border-primary">
  {/* Content */}
</Card>
```

---

## Troubleshooting

### Component Not Rendering
- Ensure `SubscriptionProvider` wraps your app in `layout.tsx`
- Check browser console for errors
- Verify imports are correct

### Subscription Data Not Loading
- Check if backend API is running
- Verify JWT token is valid
- Ensure customer ID is in localStorage

### Stripe Checkout Not Opening
- Verify Price IDs are correct
- Check environment variables
- Ensure backend endpoints are working

---

## Future Enhancements

Potential additions:
- [ ] Price comparison table
- [ ] Feature highlight on hover
- [ ] Plan recommendation logic
- [ ] Animated transitions
- [ ] A/B testing support
- [ ] Localization support
- [ ] Currency selection

---

## Support

For issues or questions:
1. Check parent directory documentation
2. Review `STRIPE_TESTING_GUIDE.md`
3. Check component source code comments
4. Test with Stripe test cards

---

**Last Updated:** 2025-10-16
