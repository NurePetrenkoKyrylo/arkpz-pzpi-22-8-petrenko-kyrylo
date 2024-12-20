const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    installationDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], required: true },
    measurementInterval: { type: Number, required: true },
    normalRange: {
        temperature: { min: Number, max: Number },
        humidity: { min: Number, max: Number }
    }
});

module.exports = mongoose.model('IoTDevice', iotDeviceSchema);
