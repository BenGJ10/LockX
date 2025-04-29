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
            content: "The graph contains <strong>Process nodes</strong> (blue circles) representing system processes.",
            highlight: ".node"
        },
        {
            title: "Dependencies",
            content: "<strong>Directed edges</strong> show wait-for relationships. P1 → P2 means Process 1 is waiting for Process 2.",
            highlight: ".link"
        },
        {
            title: "Deadlock Detection",
            content: "A deadlock occurs when there's a <strong>cycle</strong> in the graph (P1→P2→P3→P1). Our system highlights these in red.",
            highlight: ".deadlock-node"
        },
        {
            title: "Try It Yourself",
            content: "Use the buttons to explore different scenarios: normal operation, deadlock, or a random graph.",
            highlight: ".graph-controls"
        }
    ];

    // Graph data examples
    const normalGraph = {
        nodes: [
            { id: "P1", name: "Process 1" },
            { id: "P2", name: "Process 2" },
            { id: "P3", name: "Process 3" }
        ],
        links: [
            { source: "P1", target: "P2" },
            { source: "P2", target: "P3" }
        ]
    };

    const deadlockGraph = {
        nodes: [
            { id: "P1", name: "Process 1" },
            { id: "P2", name: "Process 2" },
            { id: "P3", name: "Process 3" }
        ],
        links: [
            { source: "P1", target: "P2" },
            { source: "P2", target: "P3" },
            { source: "P3", target: "P1" }
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
        .force("link", d3.forceLink().id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(50));

    // Graph update function
    function updateGraph(data) {
        // Clear existing graph
        svg.selectAll("*").remove();

        // Update process and edge counts
        document.getElementById("processCount").textContent = 
            `Processes: ${data.nodes.length} | Edges: ${data.links.length}`;

        // Create arrow markers
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10,0 L 0,5")
            .attr("fill", "#666");

        // Create links
        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("class", "link")
            .attr("marker-end", "url(#arrowhead)");

        // Create nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add circles for nodes
        node.append("circle")
            .attr("r", 20)
            .attr("class", "node");

        // Add labels
        node.append("text")
            .attr("dy", 4)
            .text(d => d.name)
            .attr("class", "node-label");

        // Add labels with better positioning
        node.append("text")
            .attr("dy", ".35em") // Better vertical alignment
            .attr("class", "node-label")
            .text(d => {
                // Abbreviate long process names
                if (d.name.length > 8) {
                    return d.name.split(' ')[0] + ' ' + d.name.split(' ')[1].charAt(0);
                }
                return d.name;
            })
            .style("font-size", "10px");

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

        // Check for deadlock (cycle detection)
        const cycle = findCycle(data);
        const statusElement = document.getElementById("graphStatus");
        
        if (cycle && cycle.length > 0) {
            statusElement.textContent = "Status: DEADLOCK DETECTED!";
            statusElement.className = "deadlock";
            
            // Highlight cycle nodes and edges
            node.select("circle")
                .classed("deadlock-node", d => cycle.includes(d.id));
                
            link.classed("deadlock-edge", d => 
                cycle.includes(d.source.id) && cycle.includes(d.target.id));
        } else {
            statusElement.textContent = "Status: No deadlock detected";
            statusElement.className = "";
        }
    }

    // Cycle detection using DFS
    function findCycle(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        const adjList = new Map();
        const cycle = [];
        
        // Build adjacency list
        graph.nodes.forEach(n => adjList.set(n.id, []));
        graph.links.forEach(l => adjList.get(l.source.id).push(l.target.id));
        
        function dfs(nodeId, path) {
            if (recursionStack.has(nodeId)) {
                // Found a cycle
                const cycleStart = path.indexOf(nodeId);
                return path.slice(cycleStart);
            }
            
            if (visited.has(nodeId)) return null;
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            
            for (const neighbor of adjList.get(nodeId)) {
                const result = dfs(neighbor, [...path]);
                if (result) return result;
            }
            
            recursionStack.delete(nodeId);
            return null;
        }
        
        for (const node of graph.nodes) {
            const result = dfs(node.id, []);
            if (result) return result;
        }
        
        return [];
    }

    // Generate random WFG
    function generateRandomGraph() {
        const nodeCount = Math.floor(Math.random() * 5) + 3; // 3-7 processes
        const nodes = Array.from({length: nodeCount}, (_, i) => ({
            id: `P${i+1}`,
            name: `Process ${i+1}`
        }));
        
        const links = [];
        const possibleEdges = [];
        
        // Generate all possible edges
        for (let i = 0; i < nodeCount; i++) {
            for (let j = 0; j < nodeCount; j++) {
                if (i !== j) {
                    possibleEdges.push({source: `P${i+1}`, target: `P${j+1}`});
                }
            }
        }
        
        // Randomly select some edges (20-50% of possible)
        const edgeCount = Math.floor(possibleEdges.length * (0.2 + Math.random() * 0.3));
        const shuffled = possibleEdges.sort(() => 0.5 - Math.random());
        links.push(...shuffled.slice(0, edgeCount));
        
        return { nodes, links };
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
    document.getElementById("normalBtn").addEventListener("click", () => {
        updateGraph(normalGraph);
    });

    document.getElementById("deadlockBtn").addEventListener("click", () => {
        updateGraph(deadlockGraph);
    });

    document.getElementById("randomBtn").addEventListener("click", () => {
        updateGraph(generateRandomGraph());
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

    // Initialize with normal graph
    updateGraph(normalGraph);
});
