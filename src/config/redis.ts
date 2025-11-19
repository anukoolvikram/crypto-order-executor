import IORedis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USER || undefined,
  maxRetriesPerRequest: null
};

const connection = new IORedis(redisConfig);

export const redisSubscriber = new IORedis(redisConfig);
export const redisPublisher = new IORedis(redisConfig);

export default connection;