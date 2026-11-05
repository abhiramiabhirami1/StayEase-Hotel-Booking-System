
const express = require("express");
const router = express.Router();

const Room = require("../models/Room");

// API 1: Add a new room
router.post("/", async (req, res) => {
    try {
        const newRoom = new Room(req.body);

        const savedRoom = await newRoom.save();

        res.status(201).json({
            message: "Room added successfully!",
            room: savedRoom
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding room",
            error: error.message
        });
    }
});

// API 2: Get all rooms
router.get("/", async (req, res) => {
    try {
        const rooms = await Room.find();

        res.status(200).json(rooms);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching rooms",
            error: error.message
        });
    }
});

module.exports = router;
