# Construct a Wait-For Graph (WFG) from live system data
# Detect cycles in the WFG (indicating deadlocks)
# Optimize detection using Depth-First Search (DFS)
# Log deadlocks to a JSON file

import json
import time
import threading

class DeadlockDetector:
    def __init__(self, system_state_file="system_state.json", check_interval = 5):
        """
        Initializes the Deadlock Detector.
        :param system_state_file: Path to system state JSON file.
        :param check_interval: Time interval (seconds) for checking deadlocks.
        """
        self.system_state_file = system_state_file
        self.check_interval = check_interval
        self.deadlocks = []
        self.monitoring_thread = threading.Thread(target = self.detect_deadlocks_loop, daemon = True)


    def load_system_state(self): # Reads json file to get current process-resource mappings
        """
        Loads the current system process-resource state from a JSON file.
        :return: Dictionary of process-resource mapping.
        """
        try:
            with open(self.system_state_file, "r") as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}


    def build_wait_for_graph(self, process_data): # Constructing the Wait-For Graph
        """
        Constructs the Wait-For Graph (WFG) from process data.
        :param process_data: Dictionary of process-resource mappings.
        :return: Graph represented as an adjacency list.
        """
        graph = {}
        for pid, details in process_data.items():
            graph[pid] = []  # Initialize process node
            waiting_for = details.get("waiting_for", None)
            if waiting_for:
                for other_pid, other_details in process_data.items():
                    if other_details.get("allocated") == waiting_for:
                        graph[pid].append(other_pid)  # Directed edge

        # Deadlocks occur when circular wait conditions form in a Wait-For Graph.
        return graph


    def detect_cycle(self, graph): # Detecting Cycles in the Graph
        """
        Detects cycles in the WFG using Depth-First Search (DFS).
        :param graph: Process dependency graph (adjacency list).
        :return: List of processes involved in a cycle (deadlock), or empty if no deadlock.
        """
        visited = set()
        path = set()
        # Performing Depth-First Search
        def dfs(node):
            if node in path:  # Cycle detected
                return [node]
            if node in visited:
                return []

            visited.add(node)
            path.add(node)

            for neighbor in graph.get(node, []):
                cycle = dfs(neighbor)
                if cycle:
                    cycle.append(node)
                    return cycle

            path.remove(node)
            return []

        for process in graph:
            cycle = dfs(process)
            if cycle:
                return cycle[::-1]  # Reverse to show correct order

        return []


    def detect_deadlocks(self):
        """
        Runs the deadlock detection algorithm and logs results.
        """
        process_data = self.load_system_state() # Loading process-resource state
        # Returning early to avoid unnecessary computations if no process data
        if not process_data:
            print("⚠ No process data found. Skipping deadlock check.")
            return

        graph = self.build_wait_for_graph(process_data) # Building the Wait-For Graph
        deadlocked_processes = self.detect_cycle(graph) # Running DFS cycle detection

        if deadlocked_processes:
            print(f"🔴 Deadlock detected! Processes involved: {deadlocked_processes}")
            self.deadlocks.append(deadlocked_processes)
            self.log_deadlock(deadlocked_processes)


    def log_deadlock(self, deadlocked_processes): # Logging Deadlocks
        """
        Logs detected deadlocks to 'deadlock_log.json'.
        To keep a record of past issues for debugging & analysis.
        :param deadlocked_processes: List of processes involved in deadlock.
        """
        log_entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), # To log the exact timestamp
            "deadlocked_processes": deadlocked_processes
        }

        # Error handling if the file is missing or corrupted
        try:
            with open("deadlock_log.json", "r") as file: 
                logs = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            logs = []

        logs.append(log_entry)

        # Saves deadlock information to deadlock_log.json
        with open("deadlock_log.json", "w") as file:
            json.dump(logs, file, indent = 4)

    def detect_deadlocks_loop(self): # To provide real-time deadlock detection
        """
        Continuously runs deadlock detection at regular intervals.
        """
        while True:
            self.detect_deadlocks()
            time.sleep(self.check_interval) # checking for deadlocks every check_interval seconds

    def start_monitoring(self): # 
        """
        Starts the deadlock detection thread.
        """
        print("🔍 Starting deadlock detection...")
        self.monitoring_thread.start()

if __name__ == "__main__":
    detector = DeadlockDetector()
    detector.start_monitoring()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping Deadlock Detector.")