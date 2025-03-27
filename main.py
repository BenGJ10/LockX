import tkinter as tk
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from gui.interface import ProcessMonitorApp

if __name__ == "__main__":
    root = tk.Tk()
    app = ProcessMonitorApp(root)
    root.mainloop()
