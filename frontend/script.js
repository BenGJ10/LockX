// script.js
document.addEventListener('DOMContentLoaded', function() {
    const simulateBtn = document.getElementById('simulateBtn');
    const viewLogsBtn = document.getElementById('viewLogsBtn');
    const statusDisplay = document.getElementById('statusDisplay');
    const statusText = document.getElementById('statusText');
    const processTable = document.getElementById('processTable').getElementsByTagName('tbody')[0];
    const logsModal = document.getElementById('logsModal');
    const closeModal = document.querySelector('.close');
    const logsContent = document.getElementById('logsContent');
    const wfgContainer = document.getElementById('wfgContainer');
    
    let processes = [];
    let deadlockedPids = [];
    let wfgEdges = [];
    let refreshInterval;
    
    // Initialize
    fetchProcesses();
    refreshInterval = setInterval(fetchProcesses, 5000);
    
    // Event listeners
    simulateBtn.addEventListener('click', startSimulation);
    viewLogsBtn.addEventListener('click', showLogs);
    closeModal.addEventListener('click', () => logsModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === logsModal) {
            logsModal.style.display = 'none';
        }
    });
    
    // Functions
    function fetchProcesses() {
        fetch('http://localhost:5000/processes')
            .then(response => response.json())
            .then(data => {
                processes = data;
                renderProcessTable();
            })
            .catch(error => {
                console.error('Error fetching processes:', error);
            });
    }
    
    function renderProcessTable() {
        processTable.innerHTML = '';
        
        processes.forEach(proc => {
            const row = processTable.insertRow();
            
            if (deadlockedPids.includes(proc.pid)) {
                row.classList.add('deadlock-process');
            }
            
            row.insertCell(0).textContent = proc.pid;
            row.insertCell(1).textContent = proc.name;
            row.insertCell(2).textContent = proc.cpu;
            row.insertCell(3).textContent = proc.memory;
        });
    }
    
    function startSimulation() {
        // Clear any existing deadlock highlights
        deadlockedPids = [];
        wfgEdges = [];
        renderProcessTable();
        renderWFG();
        
        // Update UI to show simulation starting
        statusDisplay.className = 'status no-deadlock';
        statusText.textContent = 'Checking system...';
        simulateBtn.disabled = true;
        
        fetch('http://localhost:5000/simulate', {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(data.error);
                simulateBtn.disabled = false;
                return;
            }
            
            // Step 1: No deadlock
            statusDisplay.className = 'status no-deadlock';
            statusText.textContent = 'No deadlock detected';
            
            // Step 2: Injecting deadlock (after delay)
            setTimeout(() => {
                statusDisplay.className = 'status injecting';
                statusText.textContent = 'Injecting deadlock...';
                
                // Step 3: Detect deadlock (after another delay)
                setTimeout(() => {
                    if (data.cycle && data.cycle.length > 0) {
                        deadlockedPids = [...new Set(data.cycle)]; // Get unique PIDs
                        wfgEdges = data.edges;
                        
                        statusDisplay.className = 'status deadlock';
                        statusText.textContent = `Deadlock detected in processes: ${deadlockedPids.join(', ')}`;
                        
                        renderProcessTable();
                        renderWFG();
                    } else {
                        statusDisplay.className = 'status no-deadlock';
                        statusText.textContent = 'No deadlock detected';
                    }
                    
                    simulateBtn.disabled = false;
                }, 2000);
            }, 2000);
        })
        .catch(error => {
            console.error('Simulation error:', error);
            statusDisplay.className = 'status no-deadlock';
            statusText.textContent = 'Error during simulation';
            simulateBtn.disabled = false;
        });
    }
    
    function renderWFG() {
        if (!wfgEdges || wfgEdges.length === 0) {
            wfgContainer.innerHTML = '<p>No Wait-For Graph to display</p>';
            return;
        }
        
        // Create a simple visualization using HTML elements
        let html = '<div class="wfg-graph"><h3>Wait-For Graph</h3><div class="wfg-nodes">';
        
        // Collect all unique nodes
        const nodes = new Set();
        wfgEdges.forEach(edge => {
            nodes.add(edge.source);
            nodes.add(edge.target);
        });
        
        // Create nodes
        nodes.forEach(pid => {
            const process = processes.find(p => p.pid === pid) || { pid, name: `PID ${pid}` };
            const isDeadlocked = deadlockedPids.includes(pid);
            html += `
                <div class="wfg-node ${isDeadlocked ? 'deadlock-node' : ''}" 
                     title="${process.name} (${pid})">
                    ${process.name}<br><small>${pid}</small>
                </div>
            `;
        });
        
        html += '</div><div class="wfg-edges">';
        
        // Create edges with arrows
        wfgEdges.forEach(edge => {
            const isDeadlockEdge = deadlockedPids.includes(edge.source) && 
                                 deadlockedPids.includes(edge.target);
            html += `
                <div class="wfg-edge ${isDeadlockEdge ? 'deadlock-edge' : ''}">
                    <div class="edge-line"></div>
                    <div class="edge-arrow"></div>
                </div>
            `;
        });
        
        html += '</div></div>';
        wfgContainer.innerHTML = html;
        
        // Position nodes and edges (simplified layout)
        positionWFGElements();
    }
    
    function positionWFGElements() {
        const nodes = document.querySelectorAll('.wfg-node');
        const edges = document.querySelectorAll('.wfg-edge');
        
        // Simple circular layout for nodes
        const centerX = wfgContainer.offsetWidth / 2;
        const centerY = 150;
        const radius = 120;
        const angleStep = (2 * Math.PI) / nodes.length;
        
        nodes.forEach((node, index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle) - 50;
            const y = centerY + radius * Math.sin(angle) - 20;
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
        });
        
        // Position edges (simplified - would be better with a proper graph library)
        edges.forEach((edge, index) => {
            const sourceNode = nodes[index % nodes.length];
            const targetNode = nodes[(index + 1) % nodes.length];
            
            const sourceRect = sourceNode.getBoundingClientRect();
            const targetRect = targetNode.getBoundingClientRect();
            
            const sourceX = sourceRect.left + sourceRect.width/2 - wfgContainer.getBoundingClientRect().left;
            const sourceY = sourceRect.top + sourceRect.height/2 - wfgContainer.getBoundingClientRect().top;
            const targetX = targetRect.left + targetRect.width/2 - wfgContainer.getBoundingClientRect().left;
            const targetY = targetRect.top + targetRect.height/2 - wfgContainer.getBoundingClientRect().top;
            
            // Calculate angle between nodes
            const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
            
            // Position the line
            const line = edge.querySelector('.edge-line');
            const length = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)) - 40;
            line.style.width = `${length}px`;
            line.style.left = `${sourceX + 20 * Math.cos(angle)}px`;
            line.style.top = `${sourceY + 20 * Math.sin(angle)}px`;
            line.style.transform = `rotate(${angle}rad)`;
            
            // Position the arrow
            const arrow = edge.querySelector('.edge-arrow');
            arrow.style.left = `${targetX - 20 * Math.cos(angle)}px`;
            arrow.style.top = `${targetY - 20 * Math.sin(angle)}px`;
            arrow.style.transform = `rotate(${angle}rad)`;
        });
    }
    
    function showLogs() {
        fetch('http://localhost:5000/logs')
            .then(response => response.json())
            .then(logs => {
                logsContent.innerHTML = '';
                
                if (logs.length === 0) {
                    logsContent.innerHTML = '<p>No deadlock events logged yet.</p>';
                    return;
                }
                
                logs.reverse().forEach(log => {
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    
                    const cycleText = log.cycle.map(pid => {
                        const process = processes.find(p => p.pid === pid) || { pid, name: `PID ${pid}` };
                        return `${process.name} (${pid})`;
                    }).join(' → ');
                    
                    logEntry.innerHTML = `
                        <p><strong>${log.timestamp}</strong></p>
                        <p>Deadlock cycle: ${cycleText}</p>
                        <button class="view-wfg-btn" data-edges='${JSON.stringify(log.edges)}'>
                            View Wait-For Graph
                        </button>
                    `;
                    logsContent.appendChild(logEntry);
                });
                
                // Add event listeners to WFG buttons
                document.querySelectorAll('.view-wfg-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const edges = JSON.parse(this.getAttribute('data-edges'));
                        wfgEdges = edges;
                        deadlockedPids = [...new Set(edges.flatMap(edge => [edge.source, edge.target]))];
                        renderWFG();
                        logsModal.style.display = 'none';
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching logs:', error);
                logsContent.innerHTML = '<p>Error loading logs.</p>';
            });
            
        logsModal.style.display = 'block';
    }
});
