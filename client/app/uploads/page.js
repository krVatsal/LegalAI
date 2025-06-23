"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileSummaryCard from '../../components/FileSummaryCard';

export default function UploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, processing, error
  const [sortBy, setSortBy] = useState('date'); // date, name, status

  useEffect(() => {
    loadUploads();
  }, []);
  const loadUploads = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from server first
      const token = localStorage.getItem('token');
      console.log('Loading uploads, token present:', !!token);
      
      if (token) {
        try {
          console.log('Fetching from server...');
          const response = await fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/history?page=1&limit=50', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Server response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Server data received:', data);
            
            if (data.success && data.data && data.data.results) {
              const serverUploads = data.data.results.map(result => ({
                id: result.fileId,
                name: result.originalName,
                size: formatSize(result.fileSize),
                type: result.fileType?.includes('pdf') ? 'PDF' : 'Image',
                uploadDate: new Date(result.createdAt).toISOString().split('T')[0],
                status: result.processingStatus || 'completed',
                ocrResult: {
                  extractedText: result.extractedText,
                  textStats: result.textStats,
                  chunks: result.chunks
                },
                summary: generateSummary(result.extractedText),
                error: result.error
              }));
              console.log('Processed server uploads:', serverUploads.length);
              setUploads(serverUploads);
              setLoading(false);
              return;
            }
          } else {
            console.warn('Server response not ok:', await response.text());
          }
        } catch (serverError) {
          console.warn('Could not fetch from server, falling back to localStorage:', serverError);
        }
      }

      // Fallback to localStorage
      console.log('Loading from localStorage...');
      const localUploads = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ocr_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.data) {
              localUploads.push({
                id: data.data.fileId || key.replace('ocr_', ''),
                name: data.data.filename || 'Unknown file',
                size: formatSize(data.data.fileSize || 0),
                type: data.data.fileType?.includes('pdf') ? 'PDF' : 'Image',
                uploadDate: new Date().toISOString().split('T')[0],
                status: 'completed',
                ocrResult: data.data,
                summary: generateSummary(data.data.extractedText),
                error: data.data.error
              });
            }
          } catch (parseError) {
            console.warn('Error parsing localStorage item:', key, parseError);
          }
        }
      }
      console.log('Loaded from localStorage:', localUploads.length);
      setUploads(localUploads);
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (size) => {
    if (!size || size === 0) return '0 MB';
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  const generateSummary = (text) => {
    if (!text || text.length < 50) return "No content extracted";
    
    // Simple extractive summary - take first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 3).join('. ').trim();
    
    return summary.length > 300 ? summary.substring(0, 300) + '...' : summary + '.';
  };

  const filteredUploads = uploads.filter(upload => {
    if (filter === 'all') return true;
    return upload.status === filter;
  });

  const sortedUploads = [...filteredUploads].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'date':
      default:
        return new Date(b.uploadDate) - new Date(a.uploadDate);
    }
  });

  const getFilterCount = (status) => {
    if (status === 'all') return uploads.length;
    return uploads.filter(upload => upload.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your uploads...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Document Uploads
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            View summaries and analysis of all your uploaded documents
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Completed' },
              { key: 'processing', label: 'Processing' },
              { key: 'error', label: 'Errors' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label} ({getFilterCount(key)})
              </button>
            ))}
          </div>

          {/* Sort and Actions */}
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Upload Grid */}
        {sortedUploads.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedUploads.map((upload) => (
              <FileSummaryCard key={upload.id} file={upload} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-4xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No uploads yet' : `No ${filter} uploads`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Upload your first document to get started with AI analysis'
                : `You don't have any ${filter} uploads at the moment`
              }
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Upload Documents
            </button>
          </div>
        )}

        {/* Statistics */}
        {uploads.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {uploads.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Uploads</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-green-600">
                {getFilterCount('completed')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-yellow-600">
                {getFilterCount('processing')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-red-600">
                {getFilterCount('error')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
