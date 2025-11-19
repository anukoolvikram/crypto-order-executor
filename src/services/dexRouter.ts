import { DexQuote } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDexRouter {
  private basePrice = 100;

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await wait(200); 
    const price = this.basePrice * (0.98 + Math.random() * 0.04); //variance 0.98 - 1.02
    return { dex: 'Raydium', price, fee: 0.003 };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await wait(200);
    const price = this.basePrice * (0.97 + Math.random() * 0.05); //variance 0.97 - 1.02
    return { dex: 'Meteora', price, fee: 0.002 };
  }

  async findBestRoute(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    const [raydium, meteora] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteoraQuote(tokenIn, tokenOut, amount)
    ]);

    return raydium.price < meteora.price ? raydium : meteora;
  }

  async executeSwap(dex: string, orderId: string) {
    await wait(2000 + Math.random() * 1000); 
    if (Math.random() < 0.05) {
      throw new Error('Slippage tolerance exceeded');
    }
    const executionPrice = this.basePrice * (0.98 + Math.random() * 0.04); //Randomize the execution price slightly around the base price

    return {
      txHash: `sol_${Math.random().toString(36).substring(2, 15)}_${orderId}`,
      finalPrice: executionPrice 
    };
  }
}