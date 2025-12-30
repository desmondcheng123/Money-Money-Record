export enum Screen {
  DASHBOARD = 'DASHBOARD',
  ALLOCATION = 'ALLOCATION',
  ACTIVITY = 'ACTIVITY',
  SETTINGS = 'SETTINGS',
  ASSET_DETAIL = 'ASSET_DETAIL'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  PRICE_UPDATE = 'PRICE_UPDATE'
}

export interface User {
  id: string;
  name: string;
}

export interface AssetGroup {
  id: string;
  name: string;
  color: string;
}

export interface PricePoint {
  date: string;
  value: number;
}

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  category: 'Stock' | 'ETF' | 'Crypto' | 'Cash';
  currentValue: number; 
  totalInvested: number; 
  color: string;
  icon?: string;
  groupId?: string; 
  order: number; 
  priceHistory: PricePoint[];
}

export interface Transaction {
  id: string;
  assetId: string;
  ticker: string;
  type: TransactionType;
  amount: number;
  shares?: number;
  date: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercentage: number;
}