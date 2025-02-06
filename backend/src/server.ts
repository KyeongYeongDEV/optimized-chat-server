import createApp from './app';
import dotenv from 'dotenv';

dotenv.config();

(
  async function serverStart() {
    try {
      const { server } = await createApp();
      const serverIp = '127.0.0.1';
      
      const port = process.env.SERVER_PORT || 8080;
      server.listen(port, () => {
        console.log(`✅ Server is started http://${serverIp}:${port}`);
      })
    } catch (error) {
      console.error('❌ Error starting the server : ', error);
    }
  }
)(); 