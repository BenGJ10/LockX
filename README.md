# **LockX - Automated Deadlock Detection Tool**  

## 📌 **Project Overview**  

### 🎯 **Goal**  
**LockX** is an **Automated Deadlock Detection Tool** designed to monitor system processes and detect potential deadlocks by analyzing **resource allocation and process dependencies**. Using **graph-based techniques**, it identifies deadlocks in real time and provides insights to resolve them efficiently.  

### ✅ **Current Features**  
- **Live Deadlock Detection**: Continuously monitors system processes and **automatically detects deadlocks**.  
- **Graph-Based Cycle Detection**: Uses **Wait-For Graph (WFG) construction** and **Depth-First Search (DFS)** to detect cycles indicating deadlocks.  
- **Automated Logging**: Logs detected deadlocks with timestamps for **future analysis and debugging**.  

### 🚀 **Planned Enhancements**  
- **Live System Monitoring**: Enhancing process detection with real-time updates.  
- **Graphical User Interface (GUI)**: A professional, interactive visualization for deadlock representation.  
- **Advanced Optimization**: Improving detection efficiency for large-scale systems.  

---

## 🔍 **Understanding Deadlocks**  

A **deadlock** occurs when a group of processes are **permanently blocked** because each one is waiting for a resource held by another.  

### 📌 **Four Necessary Conditions for Deadlock**  
1. **Mutual Exclusion**: Only one process can use a resource at a time.  
2. **Hold and Wait**: A process holding resources is waiting for additional resources held by others.  
3. **No Preemption**: Resources cannot be forcibly taken from a process.  
4. **Circular Wait**: A circular chain of processes exists, where each process waits for a resource held by the next.  

A **cycle in the Wait-For Graph (WFG)** confirms a **deadlock condition**.  

---

## ⚙️ **How LockX Detects Deadlocks**  

### 🔄 **Detection Workflow**  
1. **System Process Monitoring**: Reads process-resource data from a JSON file.  
2. **Wait-For Graph Construction**: Builds a **directed graph** where nodes are processes and edges indicate dependencies.  
3. **Cycle Detection (DFS Algorithm)**:  
   - If a cycle is found → **Deadlock detected!** 🔴  
   - If no cycle exists → **System is safe.** ✅  
4. **Deadlock Logging**: The tool logs deadlocks in `deadlock_log.json` for analysis.  

---

## 🏗 **Current Implementation**  

### ✅ **Step 1: System Monitoring** *(Completed ✅)*  
- Reads live **process-resource mappings** from `system_state.json`.  

### ✅ **Step 2: Deadlock Detection** *(In Progress 🚧)*  
- Implements **DFS-based cycle detection** in the **Wait-For Graph (WFG)**.  
- Deadlock information is stored in **`deadlock_log.json`**.  
- Periodically scans for deadlocks in a **background thread**.  

### 🔜 **Step 3: GUI Visualization** *(Upcoming 🎨)*  
- A **user-friendly dashboard** will be created for **real-time deadlock monitoring**.  

---

⚠️ *More content and detailed workflow will be added soon as the project progresses.*  

---

## 📌 Contributors
- **Ben Gregory John** (12315900)  

## 📜 License
This project is licensed under the **MIT License**.

