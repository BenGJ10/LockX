# app.py
from flask import Flask, jsonify, request
from deadlock_detector import DeadlockDetector
import time
import threading
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

detector = DeadlockDetector()
simulation_lock = threading.Lock()

@app.route('/processes')
def get_processes():
    processes = detector.get_system_processes()
    return jsonify(processes)

@app.route('/simulate', methods=['POST'])
def simulate_deadlock():
    if simulation_lock.acquire(blocking=False):
        try:
            # Step 1: Initial check (no deadlock)
            time.sleep(2)
            initial_processes = detector.get_system_processes()
            
            # Step 2: Inject deadlock
            success = detector.inject_deadlock()
            if not success:
                return jsonify({
                    'error': 'Not enough processes to create deadlock (need at least 3)'
                }), 400
                
            time.sleep(5)  # Simulate delay in deadlock occurring
            
            # Step 3: Detect deadlock
            cycle = detector.detect_deadlock()
            edges = detector.get_wfg_edges()
            
            # Log the deadlock
            if cycle:
                detector.log_deadlock(cycle)
            
            return jsonify({
                'initial_state': 'no_deadlock',
                'cycle': cycle,
                'edges': edges,
                'processes': initial_processes
            })
        finally:
            simulation_lock.release()
    else:
        return jsonify({'error': 'Simulation already in progress'}), 429

@app.route('/logs')
def get_logs():
    logs = detector.get_deadlock_logs()
    return jsonify(logs)

if __name__ == '__main__':
    app.run(debug=True)
