# deadlock_detector.py
import psutil
import time
import json
import random
from collections import defaultdict

class DeadlockDetector:
    def __init__(self):
        self.log_file = 'deadlock_logs.txt'
        self.wfg = {}  # Wait-For Graph
        self.process_map = {}  # Maps PID to process info
        
    def get_system_processes(self):
        processes = []
        self.process_map = {}
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                process_info = {
                    'pid': proc.pid,
                    'name': proc.name(),
                    'cpu': round(proc.cpu_percent(), 1),
                    'memory': round(proc.memory_info().rss / (1024 * 1024), 1)  # MB
                }
                processes.append(process_info)
                self.process_map[proc.pid] = process_info
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return processes
    
    def inject_deadlock(self):
        """Simulate a deadlock by creating a random cycle in the WFG"""
        processes = self.get_system_processes()
        if len(processes) < 3:
            return False  # Not enough processes to create a deadlock
        
        # Select random processes (between 3-6 processes for the cycle)
        cycle_size = random.randint(3, min(6, len(processes)))
        selected_processes = random.sample(processes, cycle_size)
        
        # Create a cycle in the WFG
        self.wfg = {}
        for i in range(cycle_size):
            current_pid = selected_processes[i]['pid']
            next_pid = selected_processes[(i + 1) % cycle_size]['pid']
            self.wfg[current_pid] = next_pid
        
        return True
    
    def detect_deadlock(self):
        """Detect deadlock using DFS cycle detection and return the cycle"""
        visited = set()
        recursion_stack = set()
        cycle = []
        
        def dfs(pid):
            nonlocal cycle
            if pid not in self.wfg:
                return False
                
            visited.add(pid)
            recursion_stack.add(pid)
            
            next_pid = self.wfg[pid]
            if next_pid in recursion_stack:
                # Cycle detected
                cycle.append(pid)
                return True
            if next_pid not in visited:
                if dfs(next_pid):
                    cycle.append(pid)
                    return True
                    
            recursion_stack.remove(pid)
            return False
        
        for pid in self.wfg:
            if pid not in visited:
                if dfs(pid):
                    # Return the cycle we found (in order)
                    cycle.reverse()
                    # Complete the cycle by adding the first node again
                    cycle.append(cycle[0])
                    return cycle
        return []
    
    def get_wfg_edges(self):
        """Return WFG edges for visualization"""
        edges = []
        for src, dest in self.wfg.items():
            edges.append({
                'source': src,
                'source_name': self.process_map.get(src, {}).get('name', str(src)),
                'target': dest,
                'target_name': self.process_map.get(dest, {}).get('name', str(dest))
            })
        return edges
    
    def log_deadlock(self, cycle):
        if not cycle:
            return
            
        log_entry = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'cycle': cycle[:-1],  # Remove duplicate node
            'edges': self.get_wfg_edges()
        }
        
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    
    def get_deadlock_logs(self):
        try:
            with open(self.log_file, 'r') as f:
                return [json.loads(line) for line in f.readlines()]
        except FileNotFoundError:
            return []
