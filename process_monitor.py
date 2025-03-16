# Monitor active system processes in real-time
# Track allocated & requested resources dynamically
# Efficiently fetch process-resource mappings
# Prepare data for deadlock detection

import psutil
import time
import json
import threading

class SystemMonitor:
    def __init__(self, update_interval = 5):
        """
        Initializes the system monitor.
        :param update_interval: Time interval (seconds) for refreshing process data.
        """

        self.process_data = {}  # Stores live process-resource data
        self.update_interval = update_interval # Controls how frequently data updates
        self.monitoring_thread = threading.Thread(target = self.update_processes, daemon = True)    #  daemon: It'll automatically run in the background

    def get_active_processes(self): # Tries to get PID & process name of active processes.
        """
        Fetches currently running system processes.
        :return: List of tuples (PID, process name)
        """

        process_list = []
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                process_list.append((proc.info['pid'], proc.info['name']))
                # To prevent script crashes due to missing permissions and other errors
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        return process_list
    
    def get_resource_allocation(self): # Assigning Simulated Resource Allocations 
        """
        Simulates or retrieves resource allocation for each process.
        :return: Dictionary {PID: {'process_name': name, 'allocated': resource, 'waiting_for': resource}}
        """
        resources = ["R1", "R2", "R3", "R4", "R5"]  
        allocation = {}

        for pid, pname in self.get_active_processes()[:5]:  # Monitor first 5 processes for simplicity
            allocated = resources[pid % len(resources)]  # Assign based on PID
            waiting_for = resources[(pid + 1) % len(resources)]  # Next resource in list
            # Using modulo (%) to cycle through resources dynamically for any number of processes.

            allocation[pid] = {
                "process_name": pname,
                "allocated": allocated,
                "waiting_for": waiting_for
            }
        
        self.process_data = allocation
        return allocation
    
    def update_processes(self): # Background Thread for Continuous Updates
        """
        Continuously updates the process-resource allocation data.
        """
        while True:
            self.get_resource_allocation()
            self.save_to_json()
            time.sleep(self.update_interval)

    def save_to_json(self):
        """
        Saves the latest process-resource allocation to a JSON file.
        """
        # JSON is lightweight & structured, can be easily parsed by other programs
        with open("system_state.json", "w") as file:
            json.dump(self.process_data, file, indent=4)

    def start_monitoring(self):
        """
        Starts the system monitoring thread.
        """
        print("🔍 Starting live system monitoring...")
        self.monitoring_thread.start()

if __name__ == "__main__":
    # Creating an instance of SystemMonitor
    monitor = SystemMonitor() 
    monitor.start_monitoring()

    while True:
        time.sleep(5)  # Keep the script running to see updates
        print(json.dumps(monitor.process_data, indent=4))