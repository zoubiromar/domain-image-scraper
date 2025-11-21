import { FaCheckCircle, FaTimes } from 'react-icons/fa';

interface Session {
  key: string;
  timestamp: string;
  rowCount: number;
  completed: boolean;
  error?: string;
  costs?: any;
  config?: any;
  [key: string]: any; // Allow tool-specific data
}

interface SessionHistoryProps {
  sessions: Session[];
  onLoad: (session: Session) => void;
  onDelete: (key: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  toolName: string; // For display purposes
}

export default function SessionHistory({
  sessions,
  onLoad,
  onDelete,
  onClearAll,
  onClose,
  toolName,
}: SessionHistoryProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-purple-50">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaCheckCircle className="text-purple-600" />
            {toolName} - Session History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No saved sessions</p>
              <p className="text-sm">Process some items and sessions will be saved automatically</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.key}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(session.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {session.rowCount} items
                        {session.costs?.totalCost && ` • $${session.costs.totalCost.toFixed(4)}`}
                        {' • '}
                        {session.completed ? '✅ Completed' : '⚠️ Partial'}
                        {session.error && ` • Error: ${session.error.substring(0, 50)}...`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoad(session)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDelete(session.key)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {session.config && (
                    <div className="text-xs text-gray-500">
                      {Object.entries(session.config).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {sessions.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              onClick={onClearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All History
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


