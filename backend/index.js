import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import staticRoutes from "./routes/staticRoutes.js";
import mongoose from "mongoose";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Error connecting to MongoDB:", err));

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(cors({ origin: `${process.env.FRONTEND_URL}`, credentials: true }));
app.use(express.json());

app.use("/api", staticRoutes);

const PORT = process.env.PORT || 3000;



app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});