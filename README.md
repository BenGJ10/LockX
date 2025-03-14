# LockX - Automated Deadlock Detection Tool

## 📌 Project Overview

### 🎯 Goal
**LockX** an Automated Deadlock Detection Tool is designed to monitor system processes and detect potential deadlocks by analyzing resource allocation and process dependencies. By leveraging graph-based techniques, the tool aims to enhance system reliability by identifying and mitigating deadlocks in real time.

### ✅ Expected Outcomes
- **Detect Circular Wait Conditions**: Identify cycles in the **Resource Allocation Graph (RAG)** indicating potential deadlocks.  
- **Visual Representation**: Provide a clear visualization of process dependencies and resource allocations.  
- **Resolution Strategies**: Suggest possible solutions such as:
  - **Resource Preemption** (forcibly reclaiming resources)
  - **Process Termination** (selectively terminating processes to resolve deadlock)  

---

## 🔍 Understanding Deadlocks  

A **deadlock** occurs when a set of processes is blocked because each process holds a resource and waits for another resource held by another process. The following four conditions must hold simultaneously for a deadlock to occur:  

### 📌 Four Necessary Conditions for Deadlock  
1. **Mutual Exclusion**: Only one process can use a resource at a time.  
2. **Hold and Wait**: A process holding at least one resource is waiting for additional resources held by other processes.  
3. **No Preemption**: A resource cannot be forcibly taken from a process; it must be released voluntarily.  
4. **Circular Wait**: A set of processes form a circular chain where each process is waiting for a resource held by the next process in the chain.  

If **circular wait** exists, a **deadlock** has occurred.  

---

## 🛠 Deadlock Detection (Our Focus)

### 🔄 Approach
- The tool **periodically scans** the system for deadlocks by checking for cycles in the **Resource Allocation Graph (RAG)**.  
- If a **cycle is detected**, a **deadlock exists**, and the system must take corrective action.  

### 🚀 Features (Planned Enhancements)
- **Live Monitoring** of system processes and resources.  
- **Graphical User Interface (GUI)** for better visualization and interaction.  
- **Advanced Optimization Techniques** for efficient deadlock detection.  

---

⚠️ *More content and detailed workflow will be added soon as the project progresses.*  

---

## 📌 Contributors
- **Ben Gregory John** (12315900)  

## 📜 License
This project is licensed under the **MIT License**.

