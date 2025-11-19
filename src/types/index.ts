export type OrderStatus = 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';

export interface OrderRequest {
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export interface OrderState {
  id: string;
  status: OrderStatus;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  dex?: string;
  txHash?: string;
  executionPrice?: number;
  error?: string;
}

export interface DexQuote {
  dex: 'Raydium' | 'Meteora';
  price: number;
  fee: number;
}