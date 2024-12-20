const mongoose = require('mongoose');

const storageConditionHistorySchema = new mongoose.Schema({
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    iotDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'IoTDevice', required: true },
    date: { type: Date, default: Date.now },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true }
});

module.exports = mongoose.model('StorageConditionHistory', storageConditionHistorySchema);
