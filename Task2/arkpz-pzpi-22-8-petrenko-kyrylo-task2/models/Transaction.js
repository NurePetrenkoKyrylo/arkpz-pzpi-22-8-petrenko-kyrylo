const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medication: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicationInPharmacy', required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    price: { type: Number, required: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);
