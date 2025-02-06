import { Application, json, urlencoded, Request } from "express";
import dotenv from 'dotenv';
import cors, { CorsOptionsDelegate } from "cors";

dotenv.config();

export default async function expressLoader({ app } : { app : Application }) : Promise<void> {
  const corsOptions: CorsOptionsDelegate<Request> = (req, callback) => {
    console.log(`🔥 CORS: enabled for: ${req.method} ${req.url}`);
    callback(null, { origin: true });
  };

  app.use(cors(corsOptions)); // ✅ 타입 지정된 CORS 설정 사용

  app.use(json());
  app.use(urlencoded({ extended : false }));

  app.get("/", (req, res) => {
    res.send('<h1> main page </h1>');
  });

  console.log("✅ Express loaded successfully");
};