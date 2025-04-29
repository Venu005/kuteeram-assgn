import app from "./app";
import connectDB from "./config/db";
import config from "./config/config";
import { Server } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { DecodedToken } from "./types";

// Create HTTP server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      config.nodeEnv === "production"
        ? "https://yourdomain.com"
        : "http://localhost:5173",
    credentials: true,
  },
});

// Socket.IO Types
interface ServerToClientEvents {
  bidNotification: (data: {
    bidId: string;
    productId: string;
    bidPrice: number;
    status: "pending" | "accepted";
  }) => void;
}

interface ClientToServerEvents {
  authenticate: (token: string, callback: (success: boolean) => void) => void;
}

interface SocketData {
  userId: string;
  role: "seller" | "buyer" | "lorry";
}

// Socket.IO Authentication
// Connect to Database
connectDB();

// Start the server
httpServer.listen(config.port, () => {
  console.log(
    `Server running in ${config.nodeEnv} mode on port ${config.port}`
  );
});

io.use((socket, next) => {
  try {
    console.log("Raw cookies:", socket.handshake.headers.cookie);

    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.cookie?.split("token=")[1]?.split(";")[0];

    console.log("Extracted token:", token);

    if (!token) {
      console.error("No token found");
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
    console.log("Decoded user:", decoded);

    socket.data = { userId: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.error("Auth error:");
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join role-specific room
  if (socket.data.role === "seller") {
    socket.join(`seller_${socket.data.userId}`);
  }

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error(`Error: ${err.message}`);
  httpServer.close(() => process.exit(1));
});

export { io };
