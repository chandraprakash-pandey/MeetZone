import {Router} from "express";
import RoomID from "../models/roomID.js";

const router = Router();

router.get("/roomID", (req, res) => {
  res.json({ message: "This is some static information." });
});

router.post("/roomID", async (req, res) => {
  const { roomID } = req.body;

    await RoomID.create({ roomID });

  res.json({ message: `Received roomID: ${roomID}` });
});

export default router;