const mongoose = require('mongoose');

const medicationInPharmacySchema = new mongoose.Schema({
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medication: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true },
    price: { type: Number, required: true },
    manufactureDate: { type: Date, required: true },
    quantity: { type: Number, required: true },
    batchCode: { type: String, required: true }
});

module.exports = mongoose.model('MedicationInPharmacy', medicationInPharmacySchema);
