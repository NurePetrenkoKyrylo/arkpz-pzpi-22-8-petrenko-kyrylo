const Router = require('express');
const router = new Router();
const AuthController = require('../controllers/userController')
const {authenticateToken, authorizeRole} = require("../utilities/authMiddleware");

const adminOrPharmacist = ['admin', 'pharmacist'];

router.get("/", authenticateToken, AuthController.getProfile);
router.post("/reg/", AuthController.registration);
router.post("/login/", AuthController.login);
router.post("/purchase/", authenticateToken, authorizeRole(adminOrPharmacist), AuthController.makePurchase);

module.exports = router;