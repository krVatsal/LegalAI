"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  }, []);

  const processFiles = async (files) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(0);
    const intervals = [10, 30, 50, 70, 90, 100];
    for (let i = 0; i < intervals.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadProgress(intervals[i]);
    }
    const file = files[0];
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      size: formatSize(file.size),
      type: file.type.includes("pdf") ? "PDF" : "Image",
      uploadDate: new Date().toISOString().split("T")[0],
      status: "completed",
    };
    setUploadedFiles((prev) => [newFile, ...prev]);
    setIsProcessing(false);
    setTimeout(() => {
      router.push("/analysis?fileId=" + newFile.id + "&fileName=" + encodeURIComponent(newFile.name));
    }, 1000);
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

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Upload Your Contract</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload a PDF document or capture an image of your contract for instant AI analysis.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Zone */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
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
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <button className="border border-gray-400 dark:border-gray-600 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition w-full sm:w-auto">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <span className="font-bold">PDF</span>
                <span>Recent Uploads</span>
              </div>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
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
                        <button
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <span className="font-bold">✕</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-4xl">📄</span>
                    <p className="text-sm">No uploads yet</p>
                  </div>
                )}
              </div>
            </div>
            {/* Supported Formats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-gray-200 dark:border-gray-700 mt-6">
              <div className="text-sm font-bold mb-2">Supported Formats</div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold">PDF</span>
                <span>Documents</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold">IMG</span>
                <span>JPEG, PNG Images</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Maximum file size: 10 MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
