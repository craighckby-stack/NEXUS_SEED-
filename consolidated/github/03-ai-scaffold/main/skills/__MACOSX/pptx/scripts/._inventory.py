"""
Inventory Script

This script provides functionality for managing inventory data.

Classes:
    InventoryManager: Manages inventory data.

Functions:
    update_inventory: Updates the inventory data.
    get_inventory: Retrieves the inventory data.

"""

import os
import csv
from typing import Dict, List

class InventoryManager:
    """
    Manages inventory data.
    """

    def __init__(self, inventory_file: str = "inventory.csv"):
        """
        Initializes the InventoryManager.

        Args:
            inventory_file (str): The file path to the inventory data (default: "inventory.csv").
        """
        self.inventory_file = inventory_file
        self.inventory: Dict[str, List[str]] = self.load_inventory()

    def load_inventory(self) -> Dict[str, List[str]]:
        """
        Loads the inventory data from the file.

        Returns:
            Dict[str, List[str]]: The loaded inventory data.
        """
        inventory_data: Dict[str, List[str]] = {}
        if os.path.exists(self.inventory_file):
            with open(self.inventory_file, "r") as file:
                reader = csv.DictReader(file)
                for row in reader:
                    inventory_data[row["id"]] = row.values()
        return inventory_data

    def save_inventory(self) -> None:
        """
        Saves the inventory data to the file.
        """
        with open(self.inventory_file, "w") as file:
            writer = csv.DictWriter(file, fieldnames=self.inventory["id"])
            writer.writeheader()
            for item in self.inventory.values():
                writer.writerow(dict(zip(["id"] + list(self.inventory["id"]), item)))

    def update_inventory(self, item_id: str, new_data: Dict[str, str]) -> None:
        """
        Updates the inventory data for the specified item.

        Args:
            item_id (str): The ID of the item to update.
            new_data (Dict[str, str]): The new data for the item.
        """
        if item_id in self.inventory:
            self.inventory[item_id] = list(new_data.values())
            self.save_inventory()

    def get_inventory(self) -> Dict[str, List[str]]:
        """
        Retrieves the inventory data.

        Returns:
            Dict[str, List[str]]: The inventory data.
        """
        return self.inventory

def update_inventory(inventory_manager: InventoryManager, item_id: str, new_data: Dict[str, str]) -> None:
    """
    Updates the inventory data for the specified item.

    Args:
        inventory_manager (InventoryManager): The InventoryManager instance.
        item_id (str): The ID of the item to update.
        new_data (Dict[str, str]): The new data for the item.
    """
    inventory_manager.update_inventory(item_id, new_data)

def get_inventory(inventory_manager: InventoryManager) -> Dict[str, List[str]]:
    """
    Retrieves the inventory data.

    Args:
        inventory_manager (InventoryManager): The InventoryManager instance.

    Returns:
        Dict[str, List[str]]: The inventory data.
    """
    return inventory_manager.get_inventory()