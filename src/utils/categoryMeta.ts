import {
  FileText,
  Home as HomeIcon,
  type LucideIcon,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export const CATEGORY_ORDER = ['investing', 'budgeting', 'taxes', 'realEstate'] as const;

export type CategoryId = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_META: Record<
  CategoryId,
  { name: string; colorVar: string; icon: LucideIcon }
> = {
  investing: { name: 'Investing', colorVar: 'var(--teal)', icon: TrendingUp },
  budgeting: { name: 'Budgeting', colorVar: 'var(--amber)', icon: Wallet },
  taxes: { name: 'Taxes', colorVar: 'var(--indigo)', icon: FileText },
  realEstate: { name: 'Real Estate', colorVar: 'var(--rose)', icon: HomeIcon },
};

export function displayCategoryId(raw: string | null | undefined): CategoryId | null {
  if (!raw) return null;
  if (raw === 'real-estate') return 'realEstate';
  if (CATEGORY_ORDER.includes(raw as CategoryId)) return raw as CategoryId;
  return null;
}
