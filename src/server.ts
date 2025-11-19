import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { initDB } from './config/db';
import pool from './config/db';
import { orderQueue } from './services/queue';
import { redisSubscriber } from './config/redis';
import { OrderRequest } from './types';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: true
});

fastify.register(websocket);

fastify.post<{ Body: OrderRequest }>('/api/orders/execute', async (request, reply) => {
  const { tokenIn, tokenOut, amount } = request.body;
  const orderId = uuidv4();

  await pool.query(
    'INSERT INTO orders (id, token_in, token_out, amount, status) VALUES ($1, $2, $3, $4, $5)',
    [orderId, tokenIn, tokenOut, amount, 'pending']
  );

  await orderQueue.add('market-order', {
    id: orderId, tokenIn, tokenOut, amount, status: 'pending'
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });

  return reply.status(201).send({ orderId, status: 'pending' });
});


fastify.register(async function (fastify) {
  fastify.get('/api/orders/ws', { websocket: true }, (connection: any, req) => {
    const query = req.query as { orderId: string };
    const orderId = query.orderId;

    if (!orderId) {
      connection.send(JSON.stringify({ error: 'orderId required' }));
      connection.close(); 
      return;
    }

    console.log(`Client connected for order: ${orderId}`);
    const subscriber = redisSubscriber.duplicate();
    
    subscriber.subscribe(`order_updates:${orderId}`, (err) => {
      if (err) console.error('Redis Subscribe Error', err);
    });

    subscriber.on('message', (channel, message) => {
      if (channel === `order_updates:${orderId}`) {
        connection.send(message); 
        
        const parsed = JSON.parse(message);
        if (parsed.status === 'confirmed' || parsed.status === 'failed') {
          subscriber.disconnect();
        }
      }
    });

    connection.on('close', () => {
      subscriber.disconnect();
    });
  });
});

const start = async () => {
  try {
    await initDB();
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();