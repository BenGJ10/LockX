import tkinter as tk
from tkinter import ttk
import threading
import time
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.deadlock_detector import detect_deadlock, get_running_processes

class ProcessMonitorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("LockX - Deadlock Detector")
        self.root.geometry("900x550")
        self.root.configure(bg="#1e1e1e")

        # Status Label
        self.status_label = tk.Label(self.root, text="Initializing...", fg="white", bg="#1e1e1e", font=("Ubuntu", 12, "bold"))
        self.status_label.pack(pady=5)

        # Process Table
        self.tree = ttk.Treeview(self.root, columns=("PID", "Process Name", "CPU Usage (%)", "Memory (MB)"), show="headings")
        self.tree.heading("PID", text="PID")
        self.tree.heading("Process Name", text="Process Name")
        self.tree.heading("CPU Usage (%)", text="CPU Usage (%)")
        self.tree.heading("Memory (MB)", text="Memory (MB)")

        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Buttons Frame
        button_frame = tk.Frame(self.root, bg="#1e1e1e")
        button_frame.pack(pady=10, fill="x")

        self.refresh_button = tk.Button(button_frame, text="Refresh", command=self.update_processes, bg="#4caf50", fg="white")
        self.refresh_button.grid(row=0, column=0, padx=10, pady=5, sticky="ew")

        self.view_logs_button = tk.Button(button_frame, text="View Logs", command=self.view_logs, bg="#ff9800", fg="white")
        self.view_logs_button.grid(row=0, column=1, padx=10, pady=5, sticky="ew")

        self.quit_button = tk.Button(button_frame, text="Quit", command=self.root.quit, bg="#f44336", fg="white")
        self.quit_button.grid(row=0, column=2, padx=10, pady=5, sticky="ew")

        self.update_processes()

    def update_processes(self):
        """Fetch and display running processes, then check for deadlocks."""
        self.status_label.config(text="Fetching Running Processes...", fg="white")
        self.root.update()

        processes = get_running_processes()

        for item in self.tree.get_children():
            self.tree.delete(item)

        for proc in processes:
            self.tree.insert("", "end", values=(proc["pid"], proc["name"], proc["cpu_usage"], round(proc["memory_usage"] / (1024 * 1024), 2)))

        threading.Thread(target=self.check_deadlocks, args=(processes,), daemon=True).start()

    def check_deadlocks(self, processes):
        """Simulate waiting and detect deadlocks."""
        self.status_label.config(text="Detecting Deadlocks...", fg="yellow")
        self.root.update()
        time.sleep(5)

        deadlocked_pids = detect_deadlock()
        
        if deadlocked_pids:
            self.status_label.config(text=f"⚠️ Deadlock Detected in Processes {deadlocked_pids}", fg="red")
            for child in self.tree.get_children():
                item = self.tree.item(child)
                if int(item["values"][0]) in deadlocked_pids:
                    self.tree.item(child, tags=("deadlock",))
            self.tree.tag_configure("deadlock", background="red", foreground="white")
        else:
            self.status_label.config(text="✅ No Deadlocks Detected", fg="green")

    def view_logs(self):
        """Open deadlock logs in a new window."""
        log_window = tk.Toplevel(self.root)
        log_window.title("Deadlock Logs")
        log_window.geometry("600x400")
        log_window.configure(bg="#1e1e1e")

        log_text = tk.Text(log_window, wrap="word", bg="#252526", fg="white", font=("Arial", 10))
        log_text.pack(expand=True, fill="both", padx=10, pady=10)

        try:
            with open("logs.txt", "r") as log_file:
                log_text.insert("1.0", log_file.read())
        except FileNotFoundError:
            log_text.insert("1.0", "No logs found.")

if __name__ == "__main__":
    root = tk.Tk()
    app = ProcessMonitorApp(root)
    root.mainloop()
