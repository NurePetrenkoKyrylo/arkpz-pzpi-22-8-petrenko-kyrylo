//рекомендація 1 - використовувати опціонали для безпечної роботи з відсутніми значеннями
// Поганий приклад
func findMedication(name: String) -> String {
    return medicationDatabase[name] ?? "Medication not found"
}

// Гарний приклад
func findMedication(name: String) -> String? {
    guard let medication = medicationDatabase[name] else {
        return nil
    }
    return medication
}


//рекомендація 2 - використовувати let замість var для незмінних даних
// Поганий приклад
var stockQuantity = 50

// Гарний приклад
let initialStockQuantity = 50


//рекомендація 3 - використовувати guard для раннього виходу
// Поганий приклад
func processOrder(quantity: Int?) {
    if let qty = quantity {
        if qty > 0 {
            print("Processing order of \(qty) items")
        }
    }
}

// Гарний приклад
func processOrder(quantity: Int?) {
    guard let qty = quantity, qty > 0 else {
        print("Invalid quantity")
        return
    }
    print("Processing order of \(qty) items")
}


//рекомендація 4 - використовувати протоколи для декомпозиції функціоналу
// Поганий приклад
class PharmacyService {
    func addMedication(_ medication: Medication) { /* код */ }
    func processOrder(_ order: Order) { /* код */ }
}

// Гарний приклад
protocol MedicationManaging {
    func addMedication(_ medication: Medication)
}

protocol OrderProcessing {
    func processOrder(_ order: Order)
}

class PharmacyService: MedicationManaging, OrderProcessing {
    func addMedication(_ medication: Medication) { /* код */ }
    func processOrder(_ order: Order) { /* код */ }
}


//рекомендація 5 - використовувати map, filter, reduce для колекцій
// Поганий приклад
var availableMedications: [String] = []
for medication in medications {
    if medication.isAvailable {
        availableMedications.append(medication.name)
    }
}

// Гарний приклад
let availableMedications = medications.filter { $0.isAvailable }.map { $0.name }


//рекомендація 6 - використовувати lazy для відкладеної ініціалізації
// Поганий приклад
let inventoryData = fetchInventoryData()

// Гарний приклад
lazy var inventoryData: [Medication] = fetchInventoryData()


//рекомендація 7 - уникати використання використання Any та AnyObject
// Поганий приклад
var itemList: [Any] = ["Paracetamol", 50, 10.5]

// Гарний приклад
struct MedicationItem {
    var name: String
    var quantity: Int
    var price: Double
}

var itemList: [MedicationItem] = [MedicationItem(name: "Paracetamol", quantity: 50, price: 10.5)]
