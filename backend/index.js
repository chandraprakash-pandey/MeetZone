import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import staticRoutes from "./routes/staticRoutes.js";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Error connecting to MongoDB:", err));

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use("/api", staticRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

/* ============================= */
/* 🔌 SOCKET.IO INTEGRATION */
/* ============================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined");
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", data.offer);
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", data.answer);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});