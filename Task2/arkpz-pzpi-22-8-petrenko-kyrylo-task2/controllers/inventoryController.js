const mongoose = require('mongoose');
const MedicationInPharmacy = require('../models/MedicationInPharmacy');
const StorageConditionHistory = require('../models/StorageConditionHistory');
const IoTDevice = require('../models/IoTDevice');
const Transaction = require("../models/Transaction");

/*
getAllMedications: Повертає список усіх медикаментів з можливістю обрання конкретної аптеки.

addMedicationToInventory: Додає новий медикамент в інвентар конкретної аптеки.

updateMedicationQuantity: Оновлює кількість медикаментів в інвентарі аптеки.

getLowInventory: Повертає список медикаментів з низьким рівнем запасів,
щоб попередити про потребу в поповненні.

checkStorageConditions: Перевіряє умови зберігання, використовуючи дані сенсорів IoT,
і відображає повідомлення про їх відповідність встановленим нормам.

generateRestockRecommendations: Автоматично генерує рекомендації для поповнення запасів,
якщо їх кількість нижча за певний поріг або в них майже закінчився срок придатності.

getInventoryStatistics: Повертає статистику щодо запасів, включаючи загальну кількість
медикаментів, середню ціну для кожного медикаменту та кількість проданих у середньому за місяць.

getTransactionHistory: Повертає список виданих препаратів за вказаний час.
*/

class InventoryController {

    async getAllMedications(request, response) {
        try {
            const { pharmacyId } = request.query;
            const query = pharmacyId ? { pharmacy: pharmacyId } : {};

            const medications = await MedicationInPharmacy.find(query)
                .populate('pharmacy', 'name address')
                .populate('medication', 'name category manufacturer isPrescriptionOnly');

            response.status(200).json(medications);
        } catch (error) {
            response.status(500).json({ message: "Не вдалося отримати медикаменти.", error: error.message });
        }
    }

    async addMedicationToInventory(req, res) {
        try {
            const { pharmacyId, medicationId, price, manufactureDate, quantity, batchCode } = req.body;

            const medicationInPharmacy = new MedicationInPharmacy({
                pharmacy: pharmacyId,
                medication: medicationId,
                price,
                manufactureDate,
                quantity,
                batchCode
            });

            await medicationInPharmacy.save();
            res.status(201).json({ message: 'Медикамент додано до інвентаря аптеки' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при додаванні медикаменту', error });
        }
    }

    async updateMedicationQuantity(req, res) {
        try {
            const { medicationInPharmacyId, newQuantity } = req.body;
            const medicationInPharmacy = await MedicationInPharmacy.findById(medicationInPharmacyId);

            if (!medicationInPharmacy) {
                return res.status(404).json({ message: 'Медикамент не знайдено' });
            }

            medicationInPharmacy.quantity = newQuantity;
            await medicationInPharmacy.save();

            res.status(200).json({ message: 'Кількість медикаменту оновлено' });
        } catch (error) {
            res.status(500).json({ message: 'Помилка при оновленні кількості медикаменту', error });
        }
    }

    async getLowInventory(req, res) {
        try {
            const threshold = req.query.threshold || 10;
            const lowInventory = await MedicationInPharmacy.find({ quantity: { $lt: threshold } });

            res.status(200).json(lowInventory);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні низьких запасів', error });
        }
    }

    async checkStorageConditions(req, res) {
        try {
            const { pharmacyId } = req.params;
            const storageHistory = await StorageConditionHistory.find({ pharmacy: pharmacyId })
                .sort({ date: -1 })
                .limit(1);

            if (!storageHistory || storageHistory.length === 0) {
                return res.status(404).json({ message: 'Дані про умови зберігання не знайдено' });
            }

            const { temperature, humidity } = storageHistory[0];
            const iotDevice = await IoTDevice.findOne({ pharmacy: pharmacyId });

            if (
                temperature < iotDevice.normalRange.temperature.min ||
                temperature > iotDevice.normalRange.temperature.max ||
                humidity < iotDevice.normalRange.humidity.min ||
                humidity > iotDevice.normalRange.humidity.max
            ) {
                res.status(200).json({ message: 'Умови зберігання виходять за допустимі межі', temperature, humidity });
            } else {
                res.status(200).json({ message: 'Умови зберігання в нормі', temperature, humidity });
            }
        } catch (error) {
            res.status(500).json({ message: 'Помилка при перевірці умов зберігання', error });
        }
    }

    async generateRestockRecommendations(req, res) {
        try {
            const threshold = req.query.threshold || 10;

            const currentTime = new Date();

            const recommendations = await MedicationInPharmacy.find({
                $or: [
                    { quantity: { $lt: threshold } },
                    {
                        $expr: {
                            $lt: [
                                { $divide: [
                                    { $subtract: [currentTime, "$manufactureDate"] },
                                    { $multiply: ["$expirationTime", 86400000] } // перетворюємо термін придатності з днів у мілісекунди
                                    ] },
                                0.95
                            ]
                        }
                    }
                ]
            })
                .populate('medication')
                .populate('pharmacy');

            const result = recommendations.map(item => {
                const expirationTimeInMilliseconds = item.medication.expirationTime * 86400000;
                const timeElapsed = (currentTime - item.manufactureDate) / expirationTimeInMilliseconds;
                const isNearExpiration = timeElapsed >= 0.95;
                const isLowStock = item.quantity < threshold;

                if (!isNearExpiration && !isLowStock) return null;

                const reason = isNearExpiration
                    ? 'Наближення до закінчення терміну придатності'
                    : 'Низький рівень запасів';

                return {
                    pharmacy: item.pharmacy?.name || 'Невідома аптека',
                    medication: item.medication?.name || 'Невідомий медикамент',
                    currentQuantity: item.quantity,
                    manufactureDate: item.manufactureDate,
                    expirationTime: item.medication?.expirationTime,
                    recommendedQuantity: threshold * 2,
                    reason
                };
            }).filter(Boolean);

            res.status(200).json(result);
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Помилка при створенні рекомендацій для поповнення', error });
        }
    }

    async getInventoryStatistics(req, res) {
        try {
            const statistics = await MedicationInPharmacy.aggregate([
                {
                    $group: {
                        _id: "$medication",
                        totalQuantity: { $sum: "$quantity" },
                        averagePrice: { $avg: "$price" }
                    }
                },
                {
                    $lookup: {
                        from: "medications",
                        localField: "_id",
                        foreignField: "_id",
                        as: "medication"
                    }
                },
                {
                    $unwind: "$medication"
                },
                {
                    $lookup: {
                        from: "transactions",
                        localField: "_id",
                        foreignField: "medication",
                        as: "salesData"
                    }
                },
                {
                    $addFields: {
                        totalSalesQuantity: { $sum: "$salesData.quantity" },
                        firstSaleDate: { $min: "$salesData.date" }
                    }
                },
                {
                    $addFields: {
                        monthsSinceFirstSale: {
                            $ceil: {
                                $divide: [
                                    { $subtract: [new Date(), "$firstSaleDate"] },
                                    1000 * 60 * 60 * 24 * 30
                                ]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        averageSalesPerMonth: {
                            $cond: {
                                if: { $gt: ["$monthsSinceFirstSale", 0] },
                                then: { $divide: ["$totalSalesQuantity", "$monthsSinceFirstSale"] },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $project: {
                        medication: "$medication.name",
                        totalQuantity: 1,
                        averagePrice: 1,
                        averageSalesPerMonth: 1
                    }
                }
            ]);

            res.status(200).json(statistics);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні статистики запасів', error });
        }
    }

    async getTransactionHistory(req, res) {
        try {
            const { pharmacyId } = req.params;
            const { startDate, endDate } = req.query;

            if (!pharmacyId) {
                return res.status(400).json({ message: "Pharmacy ID обов'язковий." });
            }

            const dateFilter = {};
            if (startDate) {
                dateFilter.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.$lte = new Date(endDate);
            }


            const transactions = await Transaction.aggregate([
                {
                    $lookup: {
                        from: "medicationinpharmacies",
                        localField: "medication",
                        foreignField: "_id",
                        as: "medicationDetails"
                    }
                },
                {
                    $unwind: "$medicationDetails"
                },
                {
                    $match: {
                        "medicationDetails.pharmacy": new mongoose.Types.ObjectId(pharmacyId),
                        ...(startDate || endDate ? { date: dateFilter } : {})
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customer",
                        foreignField: "_id",
                        as: "customerDetails"
                    }
                },
                {
                    $unwind: "$customerDetails"
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "pharmacist",
                        foreignField: "_id",
                        as: "pharmacistDetails"
                    }
                },
                {
                    $unwind: "$pharmacistDetails"
                },
                {
                    $lookup: {
                        from: "medications",
                        localField: "medicationDetails.medication",
                        foreignField: "_id",
                        as: "medicationInfo"
                    }
                },
                {
                    $unwind: "$medicationInfo"
                },
                {
                    $project: {
                        _id: 1,
                        quantity: 1,
                        date: 1,
                        price: 1,
                        "customerDetails.firstName": 1,
                        "customerDetails.lastName": 1,
                        "customerDetails.email": 1,
                        "pharmacistDetails.firstName": 1,
                        "pharmacistDetails.lastName": 1,
                        "medicationInfo.name": 1,
                        "medicationInfo.isPrescriptionOnly": 1,
                        "medicationDetails.price": 1,
                        "medicationDetails.batchCode": 1,
                        "medicationDetails.manufactureDate": 1,
                        "medicationDetails.quantity": 1
                    }
                }
            ]);

            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: 'Помилка при отриманні історії транзакцій', error });
        }
    }
}

module.exports = new InventoryController();
