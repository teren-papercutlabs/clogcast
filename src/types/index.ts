export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'stdout' | 'stderr';
  content: string;
  source?: string;
}

export interface LogStats {
  totalEntries: number;
  stdoutCount: number;
  stderrCount: number;
  bufferSize: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}