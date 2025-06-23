import { LogEntry, LogStats } from '../types';

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private idCounter: number = 0;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  add(content: string, level: 'stdout' | 'stderr', source?: string): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${this.idCounter++}`,
      timestamp: new Date(),
      level,
      content,
      source
    };

    this.buffer.push(entry);

    // Remove oldest entries if buffer exceeds max size
    if (this.buffer.length > this.maxSize) {
      this.buffer.splice(0, this.buffer.length - this.maxSize);
    }
  }

  get(options: {
    limit?: number;
    level?: 'stdout' | 'stderr';
    search?: string;
    since?: Date;
  } = {}): LogEntry[] {
    let results = [...this.buffer];

    // Filter by level
    if (options.level) {
      results = results.filter(entry => entry.level === options.level);
    }

    // Filter by search term
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      results = results.filter(entry => 
        entry.content.toLowerCase().includes(searchLower)
      );
    }

    // Filter by timestamp
    if (options.since) {
      results = results.filter(entry => entry.timestamp >= options.since!);
    }

    // Apply limit (get most recent entries)
    if (options.limit && options.limit > 0) {
      results = results.slice(-options.limit);
    }

    return results;
  }

  clear(): void {
    this.buffer = [];
  }

  getStats(): LogStats {
    const stdoutCount = this.buffer.filter(e => e.level === 'stdout').length;
    const stderrCount = this.buffer.filter(e => e.level === 'stderr').length;

    return {
      totalEntries: this.buffer.length,
      stdoutCount,
      stderrCount,
      bufferSize: this.maxSize,
      oldestEntry: this.buffer[0]?.timestamp,
      newestEntry: this.buffer[this.buffer.length - 1]?.timestamp
    };
  }
}