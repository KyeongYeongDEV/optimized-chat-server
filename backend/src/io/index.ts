import { Server, Socket } from "socket.io";
import http from "http";

const createSocketServer = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"]
    }
  });


  io.on("connection", (socket: Socket) => {
    console.log(`✅ 사용자 연결됨: ${socket.id}`);

    
    socket.on("chatMessage", (msg: { user: string; message: string }) => {
      console.log(`💬 메시지 수신: ${msg.user}: ${msg.message}`);
      io.emit("chatMessage", msg); // 모든 클라이언트에게 메시지 전송
    });

    socket.on("disconnect", () => {
      console.log(`❌ 사용자 연결 해제: ${socket.id}`);
    });
  });

  return io;
};

export default createSocketServer;
