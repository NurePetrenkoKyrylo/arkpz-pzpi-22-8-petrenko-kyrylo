const User = require('../models/User');
const MedicationInPharmacy = require('../models/MedicationInPharmacy');
const Pharmacy = require('../models/Pharmacy');
const Transaction = require('../models/Transaction');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {secret} = require("../config");

function getToken (_id, role){
    const payload = {
        _id,
        role
    }
    return jwt.sign(payload, secret, {expiresIn:3.6 * 10**6})
}

class UserController {
    async registration(request, response) {
        try {
            const { firstName, lastName, password, email } = request.body;
            if ( !firstName || !lastName || !password || !email ){
                return response.status(400).json({ message: "Деякі поля незаповнені."})
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return response.status(402).json({ message: 'Користувач вже зареєстрований.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                firstName,
                lastName,
                password: hashedPassword,
                email,
                role:"customer",
                bonusPoints:0
            });
            await newUser?.save();
            response.status(201).json({ message: "Користувач зареєстрований успішно." });
        } catch (error) {
            response.status(500).json({ message: "Реєстрація невдала.", error: error.message });
        }
    }

    async login(request, response) {
        try {
            const { email, password } = request.body;
            const user = await User.findOne({ email });
            if (!user || !await bcrypt.compare(password, user?.password)) {
                return response.status(400).json({ message: "Неправильний пароль або електронна пошта." });
            }
            const accessToken = getToken(user?._id, user?.role );
            response.status(200).json({ accessToken });
        } catch (error) {
            response.status(500).json({ message: "Вхід невдалий.", error: error.message });
        }
    }
    async getProfile(request, response) {
        try {
            const id = request.user._id;
            console.log(request.user);
            const user = await User.findById(id);
            const transactions = await Transaction.find({ user: user._id }).populate('medication');
            response.status(200).json({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                email: user.email,
                bonusPoints: user.bonusPoints,
                transactionHistory: transactions
            });
        } catch (error) {
            response.status(500).json({ message: "Помилка при отриманні профілю користувача.", error: error.message });
        }
    }
    async makePurchase(request, response) {
        try {
            const { email, medicationId, pharmacyId, quantity, useBonusPoints} = request.body;
            const user = await User.findOne({ email });
            const medication = await MedicationInPharmacy.findById(medicationId);
            const pharmacy = await Pharmacy.findById(pharmacyId);

            if (!user || !medication || !pharmacy) {
                return response.status(400).json({ message: "Неправильні дані." });
            }

            if(medication.quantity-quantity < 0){
                return response.status(400).json({ message: "Недостатня кількість на складі." });
            }

            const totalCost = medication.price * quantity;
            let finalCost = totalCost;
            let bonusPointsUsed = 0;

            if (useBonusPoints && user.bonusPoints > 0) {
                bonusPointsUsed = Math.min(user.bonusPoints, totalCost);
                finalCost -= bonusPointsUsed;
                user.bonusPoints -= bonusPointsUsed;
            }

            const bonusPointsEarned = Math.floor(finalCost * (pharmacy.bonusPercent / 100));
            user.bonusPoints += bonusPointsEarned;

            const transaction = new Transaction({
                customer: user._id,
                pharmacist: request.user._id,
                medication: medication._id,
                quantity,
                date: new Date(),
                price: finalCost
            });

            medication.quantity -= quantity;
            await transaction.save();
            await user.save();
            await medication.save();
            response.status(200).json({
                message: "Покупка успішна.",
                transaction,
                bonusPointsUsed,
                bonusPointsEarned
            });
        } catch (error) {
            response.status(500).json({ message: "Неможливо купити", error: error.message });
        }
    }

}

module.exports = new UserController();