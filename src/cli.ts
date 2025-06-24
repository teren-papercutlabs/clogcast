#!/usr/bin/env node

import { spawn } from 'cross-spawn';
import { program } from 'commander';
import * as http from 'http';

const LOG_SERVER_PORT = 24281;
const LOG_SERVER_HOST = 'localhost';

function sendLog(content: string, level: 'stdout' | 'stderr', source: string): void {
  const data = JSON.stringify({ content, level, source });
  
  const options = {
    hostname: LOG_SERVER_HOST,
    port: LOG_SERVER_PORT,
    path: '/logs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    // Fire and forget - we don't care about the response
    res.resume();
  });

  req.on('error', (e) => {
    // Silently ignore errors - never break the wrapped application
  });

  req.write(data);
  req.end();
}

program
  .name('clogcast')
  .description('Zero-config log sharing for Claude Code')
  .version('1.0.0')
  .allowUnknownOption()
  .helpOption(false)
  .allowExcessArguments()
  .parse(process.argv);

// Get the command and arguments after 'clogcast'
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: clogcast <command> [arguments...]');
  console.error('Example: clogcast npm run dev');
  process.exit(1);
}

// Extract command and its arguments
const command = args[0];
const commandArgs = args.slice(1);

// Spawn the child process
const child = spawn(command, commandArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  windowsHide: true,
  env: { ...process.env, FORCE_COLOR: '1' } // Preserve colors
});

// Generate a unique source identifier for this process
const source = `${command} ${commandArgs.join(' ')}`;

// Handle stdout
if (child.stdout) {
  child.stdout.on('data', (chunk: Buffer) => {
    const content = chunk.toString();
    process.stdout.write(chunk); // Pass through to terminal
    sendLog(content, 'stdout', source);
  });
}

// Handle stderr
if (child.stderr) {
  child.stderr.on('data', (chunk: Buffer) => {
    const content = chunk.toString();
    process.stderr.write(chunk); // Pass through to terminal
    sendLog(content, 'stderr', source);
  });
}

// Handle child process exit
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Handle errors
child.on('error', (err) => {
  console.error(`Failed to start command: ${err.message}`);
  process.exit(1);
});

// Forward signals to child process
const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP'];
signals.forEach(signal => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
});