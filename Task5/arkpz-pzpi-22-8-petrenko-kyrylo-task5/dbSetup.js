const mongoose = require('mongoose');
const {connection} = require("./config");
// Імпортуємо моделі
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Medication = require('./models/Medication');
const MedicationInPharmacy = require('./models/MedicationInPharmacy');
const Pharmacy = require('./models/Pharmacy');
const StorageConditionHistory = require('./models/StorageConditionHistory');
const IoTDevice = require('./models/IoTDevice');

// Підключення до MongoDB
mongoose.connect(connection)
    .then(() => console.log('Підключено до MongoDB'))
    .catch(err => console.error('Помилка підключення:', err));

async function seedDatabase() {
    try {
        // Створення користувачів
        const admin = new User({
            firstName: 'Іван',
            lastName: 'Іванов',
            role: 'admin',
            email: 'ivanov@example.com',
            password: 'password123',
            bonusPoints: 100
        });
        const pharmacist = new User({
            firstName: 'Олена',
            lastName: 'Петрова',
            role: 'pharmacist',
            email: 'petrova@example.com',
            password: 'password123',
            bonusPoints: 50
        });
        await admin.save();
        await pharmacist.save();

        // Створення аптеки
        const pharmacy = new Pharmacy({
            name: 'Аптека №1',
            address: 'вул. Центральна, 1',
            workingHours: '8:00 - 20:00',
            manager: admin._id,
            maxStorageSize: 1000
        });
        await pharmacy.save();

        // Створення ліків
        const medication = new Medication({
            name: 'Аспірин',
            expirationTime: 24, // у місяцях
            storageConditions: {
                temperature: { min: 15, max: 25 },
                humidity: { min: 30, max: 50 }
            },
            category: 'знеболюючий',
            manufacturer: 'Фармацевтика XYZ'
        });
        await medication.save();

        // Створення ліків у аптеці
        const medicationInPharmacy = new MedicationInPharmacy({
            pharmacy: pharmacy._id,
            medication: medication._id,
            price: 50.00,
            manufactureDate: new Date('2024-01-01'),
            quantity: 100,
            batchCode: 'ABC123'
        });
        await medicationInPharmacy.save();

        // Створення IoT пристрою
        const iotDevice = new IoTDevice({
            pharmacy: pharmacy._id,
            installationDate: new Date(),
            status: 'active',
            measurementInterval: 60, // інтервал в хвилинах
            normalRange: {
                temperature: { min: 15, max: 25 },
                humidity: { min: 30, max: 50 }
            }
        });
        await iotDevice.save();

        // Історія умов зберігання
        const storageConditionHistory = new StorageConditionHistory({
            pharmacy: pharmacy._id,
            iotDevice: iotDevice._id,
            date: new Date(),
            temperature: 20,
            humidity: 40
        });
        await storageConditionHistory.save();

        // Створення транзакції
        const transaction = new Transaction({
            user: pharmacist._id,
            medication: medicationInPharmacy._id,
            quantity: 2,
            date: new Date(),
            price: 100
        });
        await transaction.save();

        console.log('База даних успішно ініціалізована!');
    } catch (err) {
        console.error('Помилка ініціалізації бази даних:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedDatabase();
