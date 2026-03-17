import json
import os
from datetime import datetime

# Global data storage (An enhancement would be using a Class or Database)
tasks = []
DATA_FILE = "task_data.json"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def load_data():
    """Loads tasks from a JSON file."""
    global tasks
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                tasks = json.load(f)
        except:
            # Basic error handling - could be enhanced to report specific issues
            tasks = []

def save_data():
    """Saves tasks to a JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(tasks, f, indent=4)

def add_task():
    """Logic to add a new task dictionary."""
    print("\n--- Add New Task ---")
    title = input("Enter task title: ")
    priority = input("Enter priority (Low/Medium/High): ")
    due_date = input("Enter due date (YYYY-MM-DD) or leave blank: ")
    
    new_task = {
        "id": len(tasks) + 1,
        "title": title,
        "priority": priority,
        "due_date": due_date,
        "status": "Incomplete",
        "created_at": str(datetime.now().date())
    }
    
    tasks.append(new_task)
    save_data()
    print("Task added successfully!")

def view_tasks():
    """Displays tasks in a simple list format."""
    print("\n--- Current Tasks ---")
    if not tasks:
        print("Your list is empty.")
        return

    for t in tasks:
        status_icon = "✓" if t["status"] == "Complete" else " "
        print(f"[{status_icon}] ID: {t['id']} | {t['title']} ({t['priority']}) - Due: {t['due_date']}")

def complete_task():
    """Logic to flip status to Complete."""
    view_tasks()
    if not tasks: return
    
    try:
        task_id = int(input("\nEnter the ID of the task to complete: "))
        found = False
        for t in tasks:
            if t["id"] == task_id:
                t["status"] = "Complete"
                found = True
                break
        
        if found:
            save_data()
            print("Status updated!")
        else:
            print("ID not found.")
    except ValueError:
        print("Invalid input. Please enter a number.")

def delete_task():
    """Logic to remove a task from the list."""
    global tasks
    view_tasks()
    if not tasks: return

    try:
        task_id = int(input("\nEnter ID to delete: "))
        tasks = [t for t in tasks if t["id"] != task_id]
        save_data()
        print("Task deleted.")
    except ValueError:
        print("Invalid input.")

def show_stats():
    """Simple logic to calculate completion percentage."""
    if not tasks:
        print("\nNo data to analyze.")
        return
    
    total = len(tasks)
    completed = len([t for t in tasks if t["status"] == "Complete"])
    percent = (completed / total) * 100
    
    print("\n--- Quick Stats ---")
    print(f"Total Tasks: {total}")
    print(f"Completed: {completed}")
    print(f"Completion Rate: {percent:.1f}%")

def main_menu():
    """The main application loop."""
    load_data()
    while True:
        # clear_screen() # Uncomment to make it feel more like an app
        print("\n============================")
        print("   PYTHON TASK TRACKER 1.0  ")
        print("============================")
        print("1. View Tasks")
        print("2. Add Task")
        print("3. Mark Task Complete")
        print("4. Delete Task")
        print("5. View Stats")
        print("6. Exit")
        
        choice = input("\nSelect an option (1-6): ")
        
        if choice == '1':
            view_tasks()
        elif choice == '2':
            add_task()
        elif choice == '3':
            complete_task()
        elif choice == '4':
            delete_task()
        elif choice == '5':
            show_stats()
        elif choice == '6':
            print("Goodbye!")
            break
        else:
            print("Invalid selection, try again.")

if __name__ == "__main__":
    main_menu()
