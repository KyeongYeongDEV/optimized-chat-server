import Redis from 'ioredis';

export default async function redisLoader() : Promise<Redis> {
  const redis : Redis = new Redis({
    host : "localhost",
    port : 6379
  });

  console.log('✅ Redis connected successfully')
  return redis;
}