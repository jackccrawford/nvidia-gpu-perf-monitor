#!/usr/bin/env python3

import subprocess
import time
import tkinter as tk
from tkinter import ttk
import threading

class GPUMonitor:
    def __init__(self, master):
        self.master = master
        master.title("NVIDIA GPU Monitor")
        master.geometry("800x600")

        # Interval selection
        self.interval_label = tk.Label(master, text="Update Interval (seconds):")
        self.interval_label.pack(pady=5)

        self.interval_var = tk.StringVar(value="1")
        self.interval_entry = tk.Entry(master, textvariable=self.interval_var, width=10)
        self.interval_entry.pack(pady=5)

        # Start/Stop buttons
        self.start_button = tk.Button(master, text="Start Monitoring", command=self.start_monitoring)
        self.start_button.pack(pady=5)

        self.stop_button = tk.Button(master, text="Stop Monitoring", command=self.stop_monitoring, state=tk.DISABLED)
        self.stop_button.pack(pady=5)

        # Text widget for displaying GPU info
        self.text_area = tk.Text(master, wrap=tk.WORD, width=100, height=30)
        self.text_area.pack(padx=10, pady=10)

        # Monitoring thread control
        self.monitoring_thread = None
        self.is_monitoring = False

    def get_gpu_info(self):
        try:
            # Run nvidia-smi command
            result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            return f"Error retrieving GPU info: {str(e)}"

    def monitor_gpus(self):
        while self.is_monitoring:
            try:
                # Clear previous content
                self.text_area.delete(1.0, tk.END)
                
                # Get and display GPU info
                gpu_info = self.get_gpu_info()
                self.text_area.insert(tk.END, gpu_info)
                
                # Wait for specified interval
                interval = float(self.interval_var.get())
                time.sleep(interval)
            except Exception as e:
                self.text_area.insert(tk.END, f"Monitoring error: {str(e)}")
                break

    def start_monitoring(self):
        # Validate interval
        try:
            interval = float(self.interval_var.get())
            if interval <= 0:
                raise ValueError("Interval must be a positive number")
        except ValueError:
            tk.messagebox.showerror("Invalid Interval", "Please enter a valid positive number for interval")
            return

        # Start monitoring
        self.is_monitoring = True
        self.monitoring_thread = threading.Thread(target=self.monitor_gpus, daemon=True)
        self.monitoring_thread.start()

        # Update button states
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)

    def stop_monitoring(self):
        # Stop monitoring
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join()

        # Update button states
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)

def main():
    root = tk.Tk()
    gpu_monitor = GPUMonitor(root)
    root.mainloop()

if __name__ == "__main__":
    main()
