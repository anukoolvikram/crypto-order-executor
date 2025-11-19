import { Queue, Worker, Job } from 'bullmq';
import connection, { redisPublisher } from '../config/redis';
import pool from '../config/db';
import { MockDexRouter } from './dexRouter';
import { OrderState } from '../types';

export const orderQueue = new Queue('order-execution', { connection }); //tasks waiting to be done

const router = new MockDexRouter();

//update database and publish on redis
async function updateStatus(orderId: string, status: string, data: Partial<OrderState> = {}) {
  const client = await pool.connect();
  try {
    let query = 'UPDATE orders SET status = $1';
    const params: any[] = [status];
    let paramIndex = 2;

    if (data.dex) { query += `, dex = $${paramIndex++}`; params.push(data.dex); }
    if (data.txHash) { query += `, tx_hash = $${paramIndex++}`; params.push(data.txHash); }
    if (data.executionPrice) { query += `, execution_price = $${paramIndex++}`; params.push(data.executionPrice); }
    if (data.error) { query += `, error = $${paramIndex++}`; params.push(data.error); }

    query += ` WHERE id = $${paramIndex}`;
    params.push(orderId);
    
    await client.query(query, params);
  } finally {
    client.release();
  }

  await redisPublisher.publish(`order_updates:${orderId}`, JSON.stringify({ status, ...data }));
}

//worker - picks tasks from the queue, checks prices, and executes trades
const worker = new Worker('order-execution', async (job: Job<OrderState>) => {
  const { id, tokenIn, tokenOut, amount } = job.data;

  try {
    await updateStatus(id, 'processing');
    await updateStatus(id, 'routing');
    const bestRoute = await router.findBestRoute(tokenIn, tokenOut, amount);

    await updateStatus(id, 'building', { dex: bestRoute.dex });
    await updateStatus(id, 'submitted');

    const result = await router.executeSwap(bestRoute.dex, id);
    await updateStatus(id, 'confirmed', { 
      txHash: result.txHash, 
      executionPrice: result.finalPrice 
    });

    return result;
  } catch (error: any) {
    console.error(`Job ${id} failed:`, error.message);
    await updateStatus(id, 'failed', { error: error.message });
    throw error; 
  }
}, { 
  connection,
  concurrency: 10, 
  limiter: {
    max: 100,
    duration: 60000
  }
});

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= 3) {
    await updateStatus(job.data.id, 'failed', { error: 'Max retries reached: ' + err.message });
  }
});

export { worker };