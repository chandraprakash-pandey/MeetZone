import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import staticRoutes from "./routes/staticRoutes.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use("/api", staticRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, methods: ["GET", "POST"] },
});

const rooms = {}; // roomId -> { socketId: { name } }

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId][socket.id] = { name };

    const existingUsers = Object.entries(rooms[roomId])
      .filter(([id]) => id !== socket.id)
      .map(([id, info]) => ({ socketId: id, name: info.name }));

    // Tell the NEW user who is already in the room
    socket.emit("existing-users", existingUsers);

    // Tell EXISTING users a new person joined (with their name for card display)
    socket.to(roomId).emit("user-joined", { socketId: socket.id, name });
  });

  // FIX #2: Forward the sender's name so the receiver can label the card immediately
  socket.on("offer", ({ roomId, offer, toSocketId }) => {
    const fromName = rooms[roomId]?.[socket.id]?.name || "Unknown";
    io.to(toSocketId).emit("offer", { offer, fromSocketId: socket.id, fromName });
  });

  socket.on("answer", ({ roomId, answer, toSocketId }) => {
    io.to(toSocketId).emit("answer", { answer, fromSocketId: socket.id });
  });

  socket.on("ice-candidate", ({ roomId, candidate, toSocketId }) => {
    io.to(toSocketId).emit("ice-candidate", { candidate, fromSocketId: socket.id });
  });

  // FIX #3: Chat relay — message is broadcast to everyone else in the room
  socket.on("chat-message", ({ roomId, senderName, text, time }) => {
    socket.to(roomId).emit("chat-message", { senderName, text, time });
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      if (rooms[roomId]) {
        delete rooms[roomId][socket.id];
        if (Object.keys(rooms[roomId]).length === 0) delete rooms[roomId];
        socket.to(roomId).emit("user-left", { socketId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));