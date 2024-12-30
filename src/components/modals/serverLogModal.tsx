import { useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

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

export default function ServerLogModal({ logs, showLogs, setShowLogs, clearLogs }: ServerLogModalProps) {
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

  useEffect(() => {
    shouldScrollRef.current = true;
  }, [logs]);

  return (
    <div className={`fixed bottom-16 left-4 w-[calc(100vw-2rem)] sm:w-[32rem] h-80 bg-gray-900 text-green-400 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${showLogs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="text-sm font-semibold">Generation Logs</h3>
        <div className="flex space-x-2">
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
        {logs.map((log, index) => (
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