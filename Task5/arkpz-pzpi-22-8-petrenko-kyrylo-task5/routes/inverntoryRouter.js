const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const { authenticateToken, authorizeRole } = require('../utilities/authMiddleware');

const adminOrPharmacist =[authenticateToken, authorizeRole( ['admin', 'pharmacist'])];
const adminOnly = [authenticateToken, authorizeRole(['admin'])];

router.get('/medications/', adminOrPharmacist, InventoryController.getAllMedications);
router.post('/medications/', adminOrPharmacist, InventoryController.addMedicationToInventory);
router.put('/medications/quantity/', adminOrPharmacist, InventoryController.updateMedicationQuantity);
router.get('/medications/low-inventory/', adminOrPharmacist, InventoryController.getLowInventory);
router.get('/storage-conditions/:pharmacyId/', adminOrPharmacist, InventoryController.checkStorageConditions);
router.get('/medications/restock-recommendations/', adminOnly, InventoryController.generateRestockRecommendations);
router.get('/statistics/', adminOnly, InventoryController.getInventoryStatistics);
router.get('/transactions/:pharmacyId/', adminOrPharmacist, InventoryController.getTransactionHistory);

module.exports = router;