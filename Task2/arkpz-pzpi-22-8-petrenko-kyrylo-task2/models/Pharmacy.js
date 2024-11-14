const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    workingHours: { type: String, required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    maxStorageSize: { type: Number, required: true },
    bonusPercent: { type: Number, required: true },
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
