import { Pool } from "mysql2/promise";
import { Redis } from "ioredis";
import { Container } from "typedi"

export default async({ pool, redis } : { pool : Pool, redis : Redis }) => {
  Container.set('redis', redis);
  Container.set('pool', pool);

  console.log('✅ DI Successfully');
}