'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface CheckoutButtonProps {
  priceId: string;
  tierName: string;
  isCurrentPlan?: boolean;
}

export function CheckoutButton({
  priceId,
  tierName,
  isCurrentPlan,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: `${window.location.origin}/account/candidate/billing?subscription=success`,
            cancel_url: `${window.location.origin}/account/candidate/billing?subscription=canceled`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  }

  if (isCurrentPlan) {
    return (
      <Button disabled variant="outline" className="w-full">
        Current Plan
      </Button>
    );
  }

  return (
    <div>
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Loading...' : `Upgrade to ${tierName}`}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
