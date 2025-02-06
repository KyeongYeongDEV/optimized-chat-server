import express, { Application } from 'express';
import http from  'http';

import loaders from './loaders';

export default async function createApp() : Promise<{ server : http.Server }> {
  const app : Application = express();
  const server = http.createServer(app);

  try {
    await loaders({ app, server });
  } catch (error) {
    console.error("❌ Error during app initializaion : ", error);
  }

  return { server };
}