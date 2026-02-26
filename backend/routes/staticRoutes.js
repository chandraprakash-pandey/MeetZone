import {Router} from "express";
import RoomID from "../models/roomID.js";

const router = Router();

router.get("/roomID", (req, res) => {
  res.json({ message: "This is some static information." });
});

router.post("/createRoomID", async (req, res) => {
  const { roomID } = req.body;

    await RoomID.create({ roomID });

  res.json({ message: `Received roomID: ${roomID}` });
});


router.post("/checkRoomID", async (req, res) => {
  const { roomID } = req.body;
    const room = await RoomID.findOne({ roomID });
    if(room){
      res.json({ exists: true });
    }else{
      res.json({ exists: false });
    }
});
export default router;