"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const FileSummaryCard = ({ file }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'processing': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'processing': return '⟳';
      case 'error': return '!';
      default: return '?';
    }
  };

  const formatText = (text, maxLength = 150) => {
    if (!text) return "No content available";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleAnalyze = () => {
    if (file.status === 'completed' && file.id) {
      router.push(`/analysis?fileId=${file.id}&fileName=${encodeURIComponent(file.name)}`);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${getStatusColor(file.status)}`}>
                {getStatusIcon(file.status)}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {file.name}
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">{file.type}</span>
              <span>{file.size}</span>
              <span>{file.uploadDate}</span>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            {file.status === 'completed' && (
              <button
                onClick={handleAnalyze}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyze
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Document Summary</h4>
            {file.summary && (
              <button
                onClick={() => copyToClipboard(file.summary)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Copy
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {formatText(file.summary || "Summary not available", isExpanded ? 500 : 150)}
          </p>
          {file.summary && file.summary.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* OCR Stats */}
        {file.ocrResult && file.ocrResult.textStats && (
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {file.ocrResult.textStats.wordCount || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {file.ocrResult.textStats.characterCount || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {file.ocrResult.textStats.chunkCount || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Chunks</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {file.status === 'error' && file.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-semibold">Error:</span> {file.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileSummaryCard;
