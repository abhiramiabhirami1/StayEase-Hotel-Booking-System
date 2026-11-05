
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Room = require("../models/Room");
const Booking = require("../models/Booking");
const adminAuth = require("../middleware/adminAuth");

// 1. CHECK ROOM AVAILABILITY
router.get("/availability", async (req, res) => {
    try {
        const { checkIn, checkOut, guests } = req.query;

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const guestCount = Number(guests);

        if (
            !checkIn ||
            !checkOut ||
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime()) ||
            endDate <= startDate ||
            !Number.isInteger(guestCount) ||
            guestCount < 1
        ) {
            return res.status(400).json({
                message: "Please enter valid dates and guest count."
            });
        }

        const rooms = await Room.find({
            status: "active",
            capacity: { $gte: guestCount }
        });

        const availableRooms = [];

        for (const room of rooms) {
            const existingBooking = await Booking.findOne({
                room: room._id,
                status: "confirmed",
                checkIn: { $lt: endDate },
                checkOut: { $gt: startDate }
            });

            if (!existingBooking) {
                availableRooms.push(room);
            }
        }

        res.status(200).json({
            message: "Availability checked successfully!",
            rooms: availableRooms
        });

    } catch (error) {
        res.status(500).json({
            message: "Availability check failed.",
            error: error.message
        });
    }
});


// 2. CREATE A NEW BOOKING
router.post("/", async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const {
            roomId,
            customerName,
            email,
            phone,
            checkIn,
            checkOut,
            guests
        } = req.body;

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const guestCount = Number(guests);

        if (
            !mongoose.Types.ObjectId.isValid(roomId) ||
            !customerName?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime()) ||
            endDate <= startDate ||
            !Number.isInteger(guestCount) ||
            guestCount < 1
        ) {
            return res.status(400).json({
                message: "Please provide all valid booking details."
            });
        }

        let savedBooking;

        await session.withTransaction(async () => {

            // Update the room document inside the transaction
            const roomUpdate = await Room.updateOne(
                { _id: roomId, status: "active" },
                { $inc: { bookingCounter: 1 } },
                { session }
            );

            if (roomUpdate.matchedCount === 0) {
                throw new Error("Room not found or inactive.");
            }

            const room = await Room.findById(roomId).session(session);

            if (guestCount > room.capacity) {
                throw new Error(
                    "This room cannot accommodate that many guests."
                );
            }

            // Check for an existing reservation
            const existingBooking = await Booking.findOne({
                room: roomId,
                status: "confirmed",
                checkIn: { $lt: endDate },
                checkOut: { $gt: startDate }
            }).session(session);

            if (existingBooking) {
                throw new Error(
                    "Sorry, this room is already booked for those dates."
                );
            }

            // Calculate number of nights
            const millisecondsPerDay = 1000 * 60 * 60 * 24;

            const nights = Math.ceil(
                (endDate - startDate) / millisecondsPerDay
            );

            const totalPrice = nights * room.pricePerNight;

            // Save booking
            const bookings = await Booking.create(
                [{
                    room: roomId,
                    customerName: customerName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim(),
                    checkIn: startDate,
                    checkOut: endDate,
                    guests: guestCount,
                    totalPrice: totalPrice,
                    status: "confirmed"
                }],
                { session }
            );

            savedBooking = bookings[0];
        });

        res.status(201).json({
            message: "Booking confirmed successfully!",
            booking: savedBooking
        });

    } catch (error) {

        const conflict =
            error.message.includes("already booked") ||
            error.message.includes("cannot accommodate") ||
            error.message.includes("not found");

        res.status(conflict ? 409 : 500).json({
            message: error.message || "Booking failed."
        });

    } finally {
        await session.endSession();
    }
});


// 3. GET ALL BOOKINGS (ADMIN)
router.get("/", adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("room", "roomName roomType pricePerNight")
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch bookings.",
            error: error.message
        });
    }
});


// 4. CANCEL A BOOKING
router.patch("/:id/cancel", adminAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: "cancelled" },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        res.status(200).json({
            message: "Booking cancelled successfully!",
            booking: booking
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to cancel booking.",
            error: error.message
        });
    }
});

module.exports = router;
