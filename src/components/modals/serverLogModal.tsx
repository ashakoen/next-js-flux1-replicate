import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Format size to KB/MB with 1 decimal place
const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const MAX_LOG_SIZE_MB = 1;
const BYTES_PER_MB = 1024 * 1024;

// Calculate size of logs in bytes
const calculateLogsSize = (logs: LogEntry[]): number => {
  const encoder = new TextEncoder();
  return logs.reduce((total, log) => {
    const logString = `${log.timestamp}${log.message}${log.status}`;
    return total + encoder.encode(logString).length;
  }, 0);
};

type LogEntry = {
  timestamp: string;
  message: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
};

interface ServerLogModalProps {
  logs: LogEntry[];
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  clearLogs: () => void;
}

export default function ServerLogModal({ logs: initialLogs, showLogs, setShowLogs, clearLogs }: ServerLogModalProps) {
  // Track if logs were trimmed
  const [logsTrimmed, setLogsTrimmed] = useState(false);
  const [logs, setLogs] = useState(initialLogs);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [logs, scrollToBottom]);

  // Update logs when new ones come in, trimming if necessary
  useEffect(() => {
    const currentSize = calculateLogsSize(initialLogs);
    const maxSize = MAX_LOG_SIZE_MB * BYTES_PER_MB;
    
    if (currentSize > maxSize) {
      // Create a copy for trimming
      let trimmedLogs = [...initialLogs];
      let trimmedSize = currentSize;
      
      // Remove oldest logs until we're under the limit
      while (trimmedSize > maxSize && trimmedLogs.length > 0) {
        trimmedLogs.shift(); // Remove oldest log
        trimmedSize = calculateLogsSize(trimmedLogs);
      }
      
      setLogs(trimmedLogs);
      setLogsTrimmed(true);
    } else {
      setLogs(initialLogs);
      setLogsTrimmed(false);
    }
    
    shouldScrollRef.current = true;
  }, [initialLogs]);

  return (
    <div className={`fixed bottom-16 left-4 w-[calc(100vw-2rem)] sm:w-[32rem] h-80 bg-gray-900 text-green-400 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${showLogs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="text-sm font-semibold">Generation Logs</h3>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-mono text-gray-400">
                  {formatSize(calculateLogsSize(logs))} / {formatSize(MAX_LOG_SIZE_MB * BYTES_PER_MB)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Log size - click Clear Logs to free up memory</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Clear Logs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={logContainerRef} className="p-4 h-64 overflow-y-auto font-mono text-xs">
        {logsTrimmed && (
          <div className="mb-2 text-yellow-500 italic">
            Older logs have been cleared to maintain performance
          </div>
        )}
        {logs.map((log: LogEntry, index: number) => (
          <div key={index} className="mb-2">
            <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={`ml-2 ${
              log.status === 'succeeded' ? 'text-green-500' : 
              log.status === 'processing' ? 'text-yellow-500' : 
              log.status === 'failed' ? 'text-red-500' : 
              'text-blue-500'
            }`}>
              {log.status.toUpperCase()}:
            </span>
            <pre className="whitespace-pre-wrap break-words">{log.message}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
