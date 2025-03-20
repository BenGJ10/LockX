import tkinter as tk
from tkinter import ttk, messagebox
import threading
import json
import time
from process_monitor import SystemMonitor
from deadlock_detection import DeadlockDetector

class DeadlockGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Deadlock Detector & System Monitor")
        self.root.geometry("800x500")

        # System Monitor & Deadlock Detector Instances
        self.monitor = SystemMonitor(update_interval=3)
        self.detector = DeadlockDetector(check_interval=5)

        # Start Monitoring Threads
        self.monitor_thread = threading.Thread(target=self.monitor.start_monitoring, daemon=True)
        self.detector_thread = threading.Thread(target=self.detector.start_monitoring, daemon=True)

        # UI Layout
        self.create_widgets()

        # Start Threads
        self.monitor_thread.start()
        self.detector_thread.start()

        # Auto-Update UI
        self.update_ui()

    def create_widgets(self):
        # Title Label
        tk.Label(self.root, text="Deadlock Detector & System Monitor", font=("Arial", 14, "bold")).pack(pady=10)

        # Process Table
        self.process_frame = ttk.LabelFrame(self.root, text="Active Processes")
        self.process_frame.pack(fill="both", expand=True, padx=10, pady=5)

        columns = ("PID", "Process Name", "Allocated", "Waiting For")
        self.process_table = ttk.Treeview(self.process_frame, columns=columns, show="headings", height=8)
        for col in columns:
            self.process_table.heading(col, text=col)
            self.process_table.column(col, width=100)
        self.process_table.pack(fill="both", expand=True)

        # Deadlock Section
        self.deadlock_frame = ttk.LabelFrame(self.root, text="Deadlock Status")
        self.deadlock_frame.pack(fill="both", expand=True, padx=10, pady=5)

        self.deadlock_list = tk.Listbox(self.deadlock_frame, height=5)
        self.deadlock_list.pack(fill="both", expand=True, padx=5, pady=5)

        # Buttons
        self.control_frame = tk.Frame(self.root)
        self.control_frame.pack(pady=5)

        self.refresh_btn = tk.Button(self.control_frame, text="Refresh", command=self.refresh_data, bg="blue", fg="white")
        self.refresh_btn.pack(side="left", padx=10)

        self.exit_btn = tk.Button(self.control_frame, text="Exit", command=self.root.quit, bg="red", fg="white")
        self.exit_btn.pack(side="left", padx=10)

    def refresh_data(self):
        self.update_ui()
        messagebox.showinfo("Info", "Process and deadlock data refreshed!")

    def update_ui(self):
        # Update Process Table
        self.process_table.delete(*self.process_table.get_children())
        process_data = self.monitor.process_data
        for pid, details in process_data.items():
            self.process_table.insert("", "end", values=(pid, details["process_name"], details["allocated"], details["waiting_for"]))

        # Update Deadlock List
        self.deadlock_list.delete(0, tk.END)
        deadlocks = self.detector.deadlocks
        self.deadlock_list.delete(0, tk.END)  # Clear previous entries
        if deadlocks:
            for deadlock in deadlocks:
                self.deadlock_list.insert(tk.END, f"Deadlock: {deadlock}")
        else:
            self.deadlock_list.insert(tk.END, "✅ No Deadlock Detected")


        # Refresh UI every 3 seconds
        self.root.after(3000, self.update_ui)

# Run GUI
if __name__ == "__main__":
    root = tk.Tk()
    app = DeadlockGUI(root)
    root.mainloop()
