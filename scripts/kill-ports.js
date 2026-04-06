#!/usr/bin/env node

import { exec } from 'child_process';
import { platform } from 'os';

const ports = [5173, 5174, 5175, 5176];
const isWindows = platform() === 'win32';

function killPorts() {
  if (isWindows) {
    // Windows command
    const cmd = `Get-NetTCPConnection -State Listen 2>$null | Where-Object {$_.LocalPort -in ${JSON.stringify(ports)}} | ForEach-Object {Try {Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue} Catch {}}`;
    
    exec(`powershell -NoProfile -Command "${cmd}"`, (error) => {
      if (error && error.code !== 0) {
        // Ignore errors - ports may just not be in use
      }
      console.log('✓ Checked for stale dev server processes');
    });
  } else {
    // macOS/Linux command
    const portString = ports.join(',');
    const cmd = `lsof -ti:${portString} 2>/dev/null | xargs kill -9 2>/dev/null || true`;
    
    exec(cmd, (error) => {
      if (error && error.code !== 0) {
        // Ignore errors - ports may just not be in use
      }
      console.log('✓ Checked for stale dev server processes');
    });
  }
}

killPorts();
