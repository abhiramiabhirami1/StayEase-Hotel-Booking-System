
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        roomName: {
            type: String,
            required: true
        },

        roomType: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        pricePerNight: {
            type: Number,
            required: true
        },

        capacity: {
            type: Number,
            required: true
        },

        imageUrl: {
            type: String,
            default: ""
        },

        amenities: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        bookingCounter: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
