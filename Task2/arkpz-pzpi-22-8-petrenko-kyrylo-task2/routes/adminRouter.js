const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticateToken, authorizeRole } = require('../utilities/authMiddleware');

const adminOnly = [authenticateToken, authorizeRole(['admin'])];

// Маршрути для управління IoT пристроями
router.get('/iot-devices/', adminOnly, AdminController.getAllIoTDevices);
router.post('/iot-devices/', adminOnly, AdminController.addIoTDevice);
router.patch('/iot-devices/:deviceId/', adminOnly, AdminController.updateIoTDevice);
router.delete('/iot-devices/:deviceId/', adminOnly, AdminController.deleteIoTDevice);

// Маршрути для управління аптеками
router.get('/pharmacies/', adminOnly, AdminController.getAllPharmacies);
router.post('/pharmacies/', adminOnly, AdminController.addPharmacy);
router.patch('/pharmacies/:pharmacyId/', adminOnly, AdminController.updatePharmacy);
router.delete('/pharmacies/:pharmacyId/', adminOnly, AdminController.deletePharmacy);

// Маршрути для управління акаунтами користувачів
router.get('/users/', adminOnly, AdminController.getAllUsers);
router.post('/users/', adminOnly, AdminController.addUser);
router.patch('/users/:userId/', adminOnly, AdminController.updateUser);
router.delete('/users/:userId/', adminOnly, AdminController.deleteUser);

// Маршрути для управління списком медикаментів
router.post('/medications/', adminOnly, AdminController.createMedication);
router.get('/medications/', adminOnly, AdminController.getAllMedications);
router.patch('/medications/:medicationId/', adminOnly, AdminController.updateMedication);
router.delete('/medications/:medicationId/', adminOnly, AdminController.deleteMedication);

// Отримання інформації від IoT пристроїв
router.post('/iot-devices/:deviceId/report/', adminOnly, AdminController.receiveIoTData);
router.delete('/db/', adminOnly, AdminController.executeDb)

module.exports = router;
