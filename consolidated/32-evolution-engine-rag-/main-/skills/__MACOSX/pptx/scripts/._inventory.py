// inventory.js
class InventoryItem {
  /**
   * Initialize an inventory item.
   * @param {string} name - The name of the item.
   * @param {number} quantity - The quantity of the item.
   * @param {number} price - The price of the item.
   */
  constructor(name, quantity, price) {
    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }
}

class Inventory {
  /**
   * Initialize an empty inventory.
   */
  constructor() {
    this.items = new Map();
  }

  /**
   * Add an item to the inventory.
   * @param {InventoryItem} item - The item to add.
   */
  addItem(item) {
    const existingItem = this.items.get(item.name);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.set(item.name, item);
    }
  }

  /**
   * Remove a quantity of an item from the inventory.
   * @param {string} name - The name of the item to remove.
   * @param {number} quantity - The quantity to remove.
   */
  removeItem(name, quantity) {
    const item = this.items.get(name);
    if (item) {
      if (item.quantity <= quantity) {
        this.items.delete(name);
      } else {
        item.quantity -= quantity;
      }
    }
  }

  /**
   * Calculate the total value of the inventory.
   * @returns {number} The total value of the inventory.
   */
  getTotalValue() {
    return Array.from(this.items.values()).reduce((total, item) => total + item.quantity * item.price, 0);
  }
}

// Example usage:
const inventory = new Inventory();
inventory.addItem(new InventoryItem("Apple", 10, 1.00));
inventory.addItem(new InventoryItem("Banana", 20, 0.50));
console.log(inventory.getTotalValue());