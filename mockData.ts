
import { Asset, Transaction, TransactionType } from './types';

// Provided with empty histories to show "reset" state logic works
export const INITIAL_ASSETS: Asset[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const PERFORMANCE_DATA = [
  { date: 'Jan', value: 0 },
  { date: 'Feb', value: 0 },
  { date: 'Mar', value: 0 },
  { date: 'Apr', value: 0 },
  { date: 'May', value: 0 },
  { date: 'Jun', value: 0 },
];

export const INCOME_DATA = [
  { month: 'Jan', amount: 0 },
  { month: 'Feb', amount: 0 },
  { month: 'Mar', amount: 0 },
  { month: 'Apr', amount: 0 },
  { month: 'May', amount: 0 },
  { month: 'Jun', amount: 0 },
];
