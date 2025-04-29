// wfg-visualization.js
document.addEventListener('DOMContentLoaded', function() {
    // Tutorial content
    const tutorialSteps = [
        {
            title: "Welcome to WFG Visualization",
            content: "This tutorial will guide you through understanding Wait-For Graphs and how they detect deadlocks.",
            highlight: null
        },
        {
            title: "Graph Elements",
            content: "The graph contains two types of nodes: <strong>Processes</strong> (blue circles) and <strong>Resources</strong> (green squares).",
            highlight: ".node"
        },
        {
            title: "Relationships",
            content: "Edges show relationships between elements. <strong>Solid arrows</strong> indicate a process holds a resource. <strong>Dashed arrows</strong> show a process is waiting for a resource.",
            highlight: ".link"
        },
        {
            title: "Deadlock Detection",
            content: "A deadlock occurs when there's a <strong>cycle</strong> in the graph where processes are waiting for each other in a circular chain.",
            highlight: null
        },
        {
            title: "Try It Yourself",
            content: "Use the 'Simulate Deadlock' button to create a deadlock situation, or 'Reset Graph' to start over.",
            highlight: ".graph-controls"
        }
    ];

    // Initial graph data
    const initialGraph = {
        nodes: [
            { id: "P1", name: "Process 1", type: "process" },
            { id: "P2", name: "Process 2", type: "process" },
            { id: "P3", name: "Process 3", type: "process" },
            { id: "R1", name: "Printer", type: "resource" },
            { id: "R2", name: "Scanner", type: "resource" }
        ],
        links: [
            { source: "P1", target: "R1", type: "holds" },
            { source: "P2", target: "R2", type: "holds" },
            { source: "P3", target: "R1", type: "waits" },
            { source: "P1", target: "R2", type: "waits" }
        ]
    };

    // Deadlock graph data
    const deadlockGraph = {
        nodes: [
            { id: "P1", name: "Process 1", type: "process" },
            { id: "P2", name: "Process 2", type: "process" },
            { id: "P3", name: "Process 3", type: "process" },
            { id: "R1", name: "File A", type: "resource" },
            { id: "R2", name: "File B", type: "resource" },
            { id: "R3", name: "File C", type: "resource" }
        ],
        links: [
            { source: "P1", target: "R1", type: "holds" },
            { source: "P2", target: "R2", type: "holds" },
            { source: "P3", target: "R3", type: "holds" },
            { source: "P1", target: "R2", type: "waits" },
            { source: "P2", target: "R3", type: "waits" },
            { source: "P3", target: "R1", type: "waits" }
        ]
    };

    // Set up the SVG container
    const width = 800, height = 500;
    const svg = d3.select("#wfgGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Simulation setup
    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(40));

    // Graph update function
    function updateGraph(data) {
        // Clear existing graph
        svg.selectAll("*").remove();

        // Process counts
        const processCount = data.nodes.filter(n => n.type === "process").length;
        const resourceCount = data.nodes.filter(n => n.type === "resource").length;
        document.getElementById("processCount").textContent = 
            `Processes: ${processCount} | Resources: ${resourceCount}`;

        // Create links
        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", d => `link link-${d.type}`)
            .attr("stroke-dasharray", d => d.type === "waits" ? "5,5" : "0");

        // Create nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add shapes based on node type
        node.append(d => {
            if (d.type === "process") {
                return document.createElementNS("http://www.w3.org/2000/svg", "circle");
            } else {
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("width", "40");
                rect.setAttribute("height", "40");
                rect.setAttribute("x", "-20");
                rect.setAttribute("y", "-20");
                return rect;
            }
        })
        .attr("class", d => `node node-${d.type}`);

        // Add labels
        node.append("text")
            .attr("dy", 4)
            .text(d => d.name)
            .attr("class", "node-label");

        // Update simulation
        simulation.nodes(data.nodes);
        simulation.force("link").links(data.links);
        simulation.alpha(1).restart();

        // Update positions
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Check for deadlock (simple cycle detection)
        const hasCycle = checkForCycle(data);
        const statusElement = document.getElementById("graphStatus");
        if (hasCycle) {
            statusElement.textContent = "Status: DEADLOCK DETECTED!";
            statusElement.className = "deadlock";
            
            // Highlight cycle
            svg.selectAll(".link")
                .classed("deadlock-edge", d => hasCycle.includes(d.source.id) && hasCycle.includes(d.target.id));
                
            svg.selectAll(".node")
                .classed("deadlock-node", d => hasCycle.includes(d.id));
        } else {
            statusElement.textContent = "Status: No deadlock detected";
            statusElement.className = "";
        }
    }

    // Simple cycle detection (for demonstration)
    function checkForCycle(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
        const adjList = new Map();
        
        // Build adjacency list
        graph.nodes.forEach(n => adjList.set(n.id, []));
        graph.links.forEach(l => {
            if (l.type === "waits") {
                adjList.get(l.source.id).push(l.target.id);
            }
        });
        
        // DFS cycle detection
        function hasCycleUtil(nodeId) {
            if (!visited.has(nodeId)) {
                visited.add(nodeId);
                recursionStack.add(nodeId);
                
                for (const neighbor of adjList.get(nodeId)) {
                    if (!visited.has(neighbor) && hasCycleUtil(neighbor)) {
                        return true;
                    } else if (recursionStack.has(neighbor)) {
                        return true;
                    }
                }
            }
            recursionStack.delete(nodeId);
            return false;
        }
        
        for (const nodeId of adjList.keys()) {
            if (hasCycleUtil(nodeId)) {
                return Array.from(recursionStack);
            }
        }
        return null;
    }

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Button event listeners
    document.getElementById("refreshBtn").addEventListener("click", () => {
        updateGraph(initialGraph);
    });

    document.getElementById("simulateBtn").addEventListener("click", () => {
        updateGraph(deadlockGraph);
    });

    // Tutorial modal functionality
    const modal = document.getElementById("tutorialModal");
    const tutorialContent = document.getElementById("tutorialContent");
    let currentStep = 0;

    function showTutorialStep(step) {
        if (step < 0 || step >= tutorialSteps.length) return;
        currentStep = step;
        
        const stepData = tutorialSteps[step];
        tutorialContent.innerHTML = `
            <h3>${stepData.title}</h3>
            <p>${stepData.content}</p>
        `;
        
        // Highlight elements if specified
        if (stepData.highlight) {
            const elements = document.querySelectorAll(stepData.highlight);
            elements.forEach(el => el.classList.add("highlight"));
            setTimeout(() => {
                elements.forEach(el => el.classList.remove("highlight"));
            }, 2000);
        }
        
        // Update button states
        document.getElementById("prevBtn").disabled = step === 0;
        document.getElementById("nextBtn").textContent = 
            step === tutorialSteps.length - 1 ? "Finish" : "Next";
    }

    document.getElementById("tutorialBtn").addEventListener("click", () => {
        modal.style.display = "block";
        showTutorialStep(0);
    });

    document.querySelector(".close").addEventListener("click", () => {
        modal.style.display = "none";
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
        showTutorialStep(currentStep - 1);
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        if (currentStep < tutorialSteps.length - 1) {
            showTutorialStep(currentStep + 1);
        } else {
            modal.style.display = "none";
        }
    });

    // Initialize with default graph
    updateGraph(initialGraph);
});
