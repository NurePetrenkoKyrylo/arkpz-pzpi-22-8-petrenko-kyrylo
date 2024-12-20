const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    expirationTime: { type: Number, required: true },
    storageConditions: {
        temperature: { min: Number, max: Number},
        humidity: { min: Number, max: Number},
    },
    category: { type: String, required: true },
    manufacturer: { type: String, required: true },
    isPrescriptionOnly: { type: Boolean, required: true },
});

module.exports = mongoose.model('Medication', medicationSchema);
