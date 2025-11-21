import { Check, X } from 'lucide-react';
import Image from 'next/image';

interface ReviewCardProps {
  originalName: string;
  matchedName: string;
  matchedUrl: string;
  score: number;
  upc: string;
  photoId: string;
  onKeep: () => void;
  onReject: () => void;
  currentIndex: number;
  totalItems: number;
}

export default function ReviewCard({
  originalName,
  matchedName,
  matchedUrl,
  score,
  upc,
  photoId,
  onKeep,
  onReject,
  currentIndex,
  totalItems,
}: ReviewCardProps) {
  const scoreColor = 
    score >= 8 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
    score >= 7 ? 'bg-orange-100 text-orange-800 border-orange-300' :
    score >= 6 ? 'bg-red-100 text-red-800 border-red-300' :
    'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border border-gray-200">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Review Progress
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {currentIndex} / {totalItems}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Product Image */}
      <div className="mb-6 bg-gray-50 rounded-xl p-6 flex items-center justify-center min-h-[250px]">
        {matchedUrl ? (
          <img 
            src={matchedUrl}
            alt={matchedName}
            className="max-h-[200px] max-w-full object-contain"
          />
        ) : (
          <div className="text-gray-400">No image available</div>
        )}
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-yellow-700 mb-2">
            📝 Your Input
          </div>
          <div className="text-sm font-medium text-gray-800">
            {originalName}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-green-700 mb-2">
            🖼️ Matched Product
          </div>
          <div className="text-sm font-medium text-gray-800">
            {matchedName}
          </div>
        </div>
      </div>

      {/* Score & Details */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-600 mb-1">UPC</div>
          <div className="font-mono text-sm font-medium">{upc}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Photo ID</div>
          <div className="font-mono text-sm font-medium">{photoId}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Match Score</div>
          <div className={`px-4 py-2 rounded-full text-lg font-bold border-2 ${scoreColor}`}>
            {score.toFixed(1)}/10
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onReject}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          <X className="w-6 h-6" />
          Reject Match
        </button>
        <button
          onClick={onKeep}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          <Check className="w-6 h-6" />
          Keep Match
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Keyboard shortcuts: Enter = Keep | Backspace = Reject
      </div>
    </div>
  );
}



