import psutil
import time
import random 
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def get_running_processes():
    """Fetch all running processes with PID, name, CPU, and memory usage."""
    processes = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            memory_info = proc.info['memory_info']
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu_usage": proc.info['cpu_percent'],
                "memory_usage": memory_info.rss if memory_info else 0  # Memory in bytes, default to 0 if None
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return processes

class DeadlockDetector:
    def __init__(self):
        self.wait_graph = {}
    
    def build_wait_graph(self, processes):
        """Randomly introduce a deadlock by creating a cyclic dependency."""
        if len(processes) < 3:
            self.wait_graph = {}  # Not enough processes for deadlock
            return
        
        deadlock_processes = random.sample([p['pid'] for p in processes], 3)
        self.wait_graph = {
            deadlock_processes[0]: deadlock_processes[1],
            deadlock_processes[1]: deadlock_processes[2],
            deadlock_processes[2]: deadlock_processes[0],
        }
    
    def detect_deadlock(self):
        """Detect cycles in the wait graph."""
        visited = set()
        deadlocked_processes = set()
        
        def dfs(pid, path):
            if pid in path:
                deadlocked_processes.update(path)
                return
            if pid in visited:
                return
            
            path.add(pid)
            if pid in self.wait_graph:
                dfs(self.wait_graph[pid], path)
            path.remove(pid)
            visited.add(pid)
        
        for process in self.wait_graph.keys():
            if process not in visited:
                dfs(process, set())
        
        return list(deadlocked_processes)

def detect_deadlock(simulate_delay=True):
    """Runs deadlock detection, injecting deadlocks after 5-10 seconds."""
    detector = DeadlockDetector()
    processes = get_running_processes()
    
    if simulate_delay:
        time.sleep(random.randint(5, 10))
    
    detector.build_wait_graph(processes)
    deadlocks = detector.detect_deadlock()
    
    if deadlocks:
        with open("logs/logs.txt", "a") as log_file:
            log_file.write(f"Deadlock detected in processes: {deadlocks}\n")
    
    return deadlocks
