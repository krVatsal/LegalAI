"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from '../../components/Layout';

function formatSize(size) {
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const initialFiles = [
  {
    id: "1",
    name: "Service_Agreement_2024.pdf",
    size: "2.4 MB",
    type: "PDF",
    uploadDate: "2024-01-15",
    status: "completed",
  },
  {
    id: "2",
    name: "Employment_Contract.pdf",
    size: "1.8 MB",
    type: "PDF",
    uploadDate: "2024-01-14",
    status: "completed",
  },
];

export default function UploadPage() {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const [allUploads, setAllUploads] = useState([]); // <-- all uploads history
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, []);  const processFiles = async (files) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setUploadProgress(0);
      try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      console.log('Processing files, token present:', !!token);

      if (!token) {
        alert('Please log in to upload files');
        setIsProcessing(false);
        return;
      }

      // Process multiple files
      if (files.length === 1) {
        // Single file upload
        await processSingleFile(files[0], token);
      } else {
        // Multiple file upload
        await processMultipleFiles(files, token);
      }

    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + error.message);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const processSingleFile = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

   
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Upload and process with OCR
      const response = await fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/upload-single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();

        const newFile = {
          id: result.data.fileId || Date.now().toString(),
          name: file.name,
          size: formatSize(file.size),
          type: file.type.includes("pdf") ? "PDF" : "Image",
          uploadDate: new Date().toISOString().split("T")[0],
          status: "completed",
          ocrResult: result.data,
          summary: generateSummary(result.data.extractedText)
        };

        setUploadedFiles((prev) => [newFile, ...prev]);

        // Store OCR result in localStorage for analysis page
        if (result.data.fileId) {
          localStorage.setItem(`ocr_${result.data.fileId}`, JSON.stringify(result));
        }

        // Redirect to analysis page with the file data
        setTimeout(() => {
          router.push(`/analysis?fileId=${result.data.fileId || newFile.id}&fileName=${encodeURIComponent(newFile.name)}`);
        }, 1000);
          } else {
        const errorData = await response.json();
        console.error('Single upload failed:', errorData);

        // Check for specific authentication errors
        if (response.status === 401 || response.status === 403) {
          alert('Authentication failed. Please log in again.');
          // Optionally redirect to login
          // router.push('/auth/login');
        } else {
          handleUploadError(file, errorData);
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      handleUploadError(file, { message: error.message });
    }
  };
  const processMultipleFiles = async (files, token) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    // Simulate progress for multiple files
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);
      try {
      console.log('Making multiple file upload request with token:', token ? 'present' : 'missing');
      const response = await fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/upload-multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Multiple upload response status:', response.status);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();

        // Process each file result
        const newFiles = result.data.results.map((fileResult, index) => ({
          id: fileResult.fileId || `${Date.now()}-${index}`,
          name: fileResult.filename,
          size: formatSize(files[index].size),
          type: fileResult.fileType?.includes("pdf") ? "PDF" : "Image",
          uploadDate: new Date().toISOString().split("T")[0],
          status: fileResult.success ? "completed" : "error",
          ocrResult: fileResult.success ? fileResult : null,
          summary: fileResult.success ? generateSummary(fileResult.extractedText) : "Processing failed",
          error: fileResult.error || null
        }));

        setUploadedFiles((prev) => [...newFiles, ...prev]);

        // Store successful OCR results in localStorage
        newFiles.forEach(file => {
          if (file.status === "completed" && file.ocrResult) {
            localStorage.setItem(`ocr_${file.id}`, JSON.stringify({
              success: true,
              data: file.ocrResult
            }));
          }
        });

        // Show detailed summary of results
        const successCount = result.data.successfulFiles;
        const totalCount = result.data.totalFiles;
        const failedCount = result.data.failedFiles;

        showUploadSummary(newFiles, successCount, totalCount, failedCount);

        // Auto-redirect to uploads page if multiple files processed successfully
        if (successCount > 1) {
          setTimeout(() => {
            router.push('/uploads');
          }, 3000);
        } else if (successCount === 1) {
          // If only one file successful, go to analysis
          const successfulFile = newFiles.find(f => f.status === 'completed');
          if (successfulFile) {
            setTimeout(() => {
              router.push(`/analysis?fileId=${successfulFile.id}&fileName=${encodeURIComponent(successfulFile.name)}`);
            }, 2000);
          }
        }
          } else {
        const errorData = await response.json();
        console.error('Multiple upload failed:', errorData);

        // Check for specific authentication errors
        if (response.status === 401 || response.status === 403) {
          alert('Authentication failed. Please log in again.');
          // Optionally redirect to login
          // router.push('/auth/login');
        } else {
          alert('Upload failed: ' + (errorData.message || 'Unknown error'));
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading multiple files:', error);
      alert('Error uploading files: ' + error.message);
    }
  };

  const handleUploadError = (file, errorData) => {
    console.error('Upload failed:', errorData);
    alert('Upload failed: ' + (errorData.message || 'Unknown error'));

    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      size: formatSize(file.size),
      type: file.type.includes("pdf") ? "PDF" : "Image",
      uploadDate: new Date().toISOString().split("T")[0],
      status: "error",
      error: errorData.message || 'Upload failed'
    };

    setUploadedFiles((prev) => [newFile, ...prev]);
  };
  const generateSummary = (text) => {
    if (!text || text.length < 50) return "No content extracted";

    // Simple extractive summary - take first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ').trim();

    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary + '.';
  };

  const showUploadSummary = (files, successCount, totalCount, failedCount) => {
    setUploadSummary({
      files,
      successCount,
      totalCount,
      failedCount
    });
    setShowSummaryModal(true);

    // Auto-close modal after 5 seconds
    setTimeout(() => {
      setShowSummaryModal(false);
    }, 5000);
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return <span className="text-green-500 font-bold">✓</span>;
    if (status === "processing") return <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />;
    if (status === "error") return <span className="text-red-500 font-bold">!</span>;
    return null;
  };

  // Load all uploads from server/localStorage on mount
  useEffect(() => {
    async function loadUploads() {
      try {
        // Try to fetch from server first
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/history?page=1&limit=50', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const data = await response.json();
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
                setAllUploads(serverUploads);
                return;
              }
            }
          } catch (e) { /* fallback below */ }
        }
        // Fallback to localStorage
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
            } catch (e) {}
          }
        }
        setAllUploads(localUploads);
      } catch (e) {
        setAllUploads([]);
      }
    }
    loadUploads();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-blue-900 dark:text-white mb-4">Upload Your Contract</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload a PDF document or capture an image of your contract for instant AI analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Zone */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-blue-100 dark:border-blue-800">
                <div
                  className={`$${isDragOver ? 'border-blue-500 bg-blue-100/70 dark:bg-blue-900/40' : 'border-dashed border-2 border-gray-300 dark:border-gray-600'} p-12 text-center cursor-pointer transition-all duration-300`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl">↑</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Drag and drop your files here</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">or click to browse your files</p>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-bold">PDF</span>
                      <span>Documents</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-bold">IMG</span>
                      <span>Images (JPG, PNG)</span>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition">Select Files</button>
                </div>
                {/* Camera Option */}
                <div className="mt-6 pt-6 border-t border-blue-100 dark:border-blue-800">
                  <div className="text-center">
                    <button className="border border-blue-400 dark:border-blue-600 px-4 py-2 rounded-lg text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition w-full sm:w-auto">
                      <span className="mr-2">📷</span> Capture with Camera
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Take a photo of your contract document</p>
                  </div>
                </div>
                {/* Upload Progress */}
                {isProcessing && (
                  <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Processing your contract...</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-2">
                      <div className="h-2 bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">OCR extraction and AI analysis in progress</p>
                  </div>
                )}
              </div>
            </div>
            {/* Upload History Sidebar */}
            <div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="font-bold">PDF</span>
                  <span>Recent Uploads</span>
                </div>
                <div className="space-y-4">
                  {allUploads.length > 0 ? allUploads.map((file) => (
                    <div key={file.id} className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(file.status)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{file.type}</span>
                            <span>{file.size}</span>
                            <span>{file.uploadDate}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          {file.status === 'completed' && (
                            <button
                              onClick={() => router.push('/analysis?fileId=' + file.id + '&fileName=' + encodeURIComponent(file.name))}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            >
                              <span className="font-bold">📄</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <span className="text-4xl">📄</span>
                      <p className="text-sm">No uploads yet</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Supported Formats */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-blue-100 dark:border-blue-800 mt-6">
                <div className="text-sm font-bold mb-2">Supported Formats</div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold">PDF</span>
                  <span>Documents</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold">IMG</span>
                  <span>JPEG, PNG Images</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Maximum file size: 10 MB</p>            </div>
            </div>
          </div>

          {/* Upload Summary Modal */}
          {showSummaryModal && uploadSummary && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Upload Summary
                    </h3>
                    <button
                      onClick={() => setShowSummaryModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{uploadSummary.successCount}</div>
                      <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{uploadSummary.failedCount}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{uploadSummary.totalCount}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="space-y-3">
                    {uploadSummary.files.map((file, index) => (
                      <div key={file.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${
                            file.status === 'completed' ? 'bg-green-500' :
                            file.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {file.type} • {file.size}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm">
                          {file.status === 'completed' && (
                            <span className="text-green-600 font-medium">✓ Processed</span>
                          )}
                          {file.status === 'error' && (
                            <span className="text-red-600 font-medium">✗ Failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {uploadSummary.successCount > 1 && (
                      <button
                        onClick={() => {
                          setShowSummaryModal(false);
                          router.push('/uploads');
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        View All Uploads
                      </button>
                    )}
                    {uploadSummary.successCount === 1 && (
                      <button
                        onClick={() => {
                          const successfulFile = uploadSummary.files.find(f => f.status === 'completed');
                          if (successfulFile) {
                            setShowSummaryModal(false);
                            router.push(`/analysis?fileId=${successfulFile.id}&fileName=${encodeURIComponent(successfulFile.name)}`);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Analyze Document
                      </button>
                    )}
                    <button
                      onClick={() => setShowSummaryModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
