import { LogEntry, LogStats } from '../types';
import { LogBuffer } from './log-buffer';

interface LogQuery {
  limit?: number;
  level?: 'stdout' | 'stderr';
  search?: string;
  since?: Date;
}

export class SharedLogBuffer {
  private localBuffer: LogBuffer;
  private httpBaseUrl: string;
  
  constructor(maxSize: number = 10000, httpPort: number = 24281) {
    this.localBuffer = new LogBuffer(maxSize);
    this.httpBaseUrl = `http://localhost:${httpPort}`;
  }

  /**
   * Try to get logs from HTTP server first, fallback to local buffer
   */
  async get(options: LogQuery = {}): Promise<LogEntry[]> {
    try {
      // Try HTTP API first
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.level) params.set('level', options.level);
      if (options.search) params.set('search', options.search);
      if (options.since) params.set('since_minutes', 
        ((Date.now() - options.since.getTime()) / 1000 / 60).toString()
      );

      const response = await fetch(`${this.httpBaseUrl}/api/logs?${params}`, {
        signal: AbortSignal.timeout(1000) // 1 second timeout
      });

      if (response.ok) {
        return await response.json() as LogEntry[];
      }
    } catch (error) {
      // Fall through to local buffer on any error
      process.stderr.write(`Failed to fetch from HTTP server, using local buffer: ${error}\n`);
    }

    // Fallback to local buffer
    return this.localBuffer.get(options);
  }

  /**
   * Add log to local buffer (used by HTTP server instance)
   */
  add(content: string, level: 'stdout' | 'stderr', source?: string): void {
    this.localBuffer.add(content, level, source);
  }

  /**
   * Get stats - try HTTP first, fallback to local
   */
  async getStats(): Promise<LogStats> {
    try {
      const response = await fetch(`${this.httpBaseUrl}/api/stats`, {
        signal: AbortSignal.timeout(1000)
      });

      if (response.ok) {
        return await response.json() as LogStats;
      }
    } catch (error) {
      // Fall through to local buffer
    }

    return this.localBuffer.getStats();
  }

  /**
   * Clear logs - try HTTP first, then clear local
   */
  async clear(): Promise<void> {
    try {
      await fetch(`${this.httpBaseUrl}/api/logs`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(1000)
      });
    } catch (error) {
      // Continue to clear local buffer regardless
    }

    this.localBuffer.clear();
  }

  /**
   * Get the local buffer instance (for HTTP server)
   */
  getLocalBuffer(): LogBuffer {
    return this.localBuffer;
  }
}