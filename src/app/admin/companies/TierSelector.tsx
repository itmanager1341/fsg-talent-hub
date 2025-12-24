'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setCompanyTier } from './actions';

interface TierSelectorProps {
  companyId: string;
  currentTier: string;
}

export function TierSelector({ companyId, currentTier }: TierSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTier = e.target.value;
    startTransition(async () => {
      await setCompanyTier(companyId, newTier);
      router.refresh();
    });
  };

  return (
    <select
      name="tier"
      defaultValue={currentTier}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="free">Free</option>
      <option value="starter">Starter</option>
      <option value="standard">Standard</option>
      <option value="professional">Professional</option>
      <option value="enterprise">Enterprise</option>
    </select>
  );
}

