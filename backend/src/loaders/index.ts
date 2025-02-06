// src/loaders/index.ts
import expressLoader from './express-loader';
import dependencyInjectionLoader from './DI-loader';
import mysqlLoader from './mysql-loader';
import redisLoader from './redis-loader';
//import chatSocket from '../io/index';  // Socket.IO 설정

import http from 'http';
import { Application } from 'express';

export default async function loaders({ app, server }: { app: Application, server: http.Server }): Promise<void> {
    const pool = await mysqlLoader();
    const redis = await redisLoader();

    await dependencyInjectionLoader({ pool, redis });
    await expressLoader({ app });

  //chatSocket(server);

    console.log('✅ All loaders initialized successfully!');
}