import { Schema, model } from "mongoose";

const roomIDSchema = new Schema({
    roomID: {
        type: String,
        required: true,
        unique: true
    }
}, {timestamps: true});

const RoomID = model("RoomID", roomIDSchema);

export default RoomID;