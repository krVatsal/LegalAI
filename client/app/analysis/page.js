'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';

export default function AnalysisPage() {
    const searchParams = useSearchParams();
    const fileId = searchParams.get('fileId');
    const fileName = searchParams.get('fileName');
    
    const [analysisData, setAnalysisData] = useState(null);    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);    const [extractedText, setExtractedText] = useState('');
    const [chunks, setChunks] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreChunks, setHasMoreChunks] = useState(false);
    const [loadingChunks, setLoadingChunks] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (fileId && fileName && mounted) {
            fetchAnalysisData();
        }
    }, [fileId, fileName, mounted]);    const fetchAnalysisData = async () => {
        try {
            setLoading(true);
            
            // Try to get stored OCR results from localStorage first
            const storedResults = localStorage.getItem(`ocr_${fileId}`);
            if (storedResults) {
                const parsedResults = JSON.parse(storedResults);
                setAnalysisData(parsedResults);
                setExtractedText(parsedResults.data?.extractedText || '');
                setChunks(parsedResults.data?.chunks || []);
                setLoading(false);
                return;
            }

            // If no stored results, try to fetch from server using fileId
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/ocr/result/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAnalysisData(data);
                setExtractedText(data.data?.extractedText || 'No text extracted');
                setChunks(data.data?.chunks || []);
                
                // Store results in localStorage for future access
                localStorage.setItem(`ocr_${fileId}`, JSON.stringify(data));
            } else if (response.status === 404) {
                // OCR result not found, show empty state
                setAnalysisData({
                    success: true,
                    data: {
                        filename: fileName,
                        fileId: fileId,
                        analysisComplete: false
                    }
                });
                setExtractedText('');
                setChunks([]);
            } else {
                throw new Error('Failed to fetch analysis data');
            }
        } catch (err) {
            console.error('Error fetching analysis:', err);
            setError('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };    const performOCRAnalysis = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }
            
            // In a real implementation, the file should have been uploaded already
            // and we would just trigger reprocessing if needed
            // For now, we'll show a message that the file needs to be uploaded first
            setError('Please upload a file first to perform OCR analysis. This page is for viewing existing results.');
            
        } catch (err) {
            console.error('Error performing OCR:', err);
            setError('Failed to perform OCR analysis');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreChunks = async () => {
        try {
            setLoadingChunks(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }
            
            const response = await fetch(`http://localhost:5000/api/ocr/chunks/${fileId}?page=${currentPage + 1}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setChunks(prev => [...prev, ...data.data.chunks]);
                setCurrentPage(prev => prev + 1);
                setHasMoreChunks(data.data.hasMore);
            } else {
                throw new Error('Failed to load more chunks');
            }
        } catch (err) {
            console.error('Error loading more chunks:', err);
            setError('Failed to load more chunks');
        } finally {
            setLoadingChunks(false);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Text copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Text copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading analysis...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Error</h2>
                        <p className="text-red-600 dark:text-red-300">{error}</p>
                        <button 
                            onClick={fetchAnalysisData}
                            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Document Analysis
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Analysis results for: <span className="font-medium">{fileName}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        File ID: {fileId}
                    </p>
                </div>

                {/* Analysis Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Available Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={performOCRAnalysis}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Extract Text (OCR)
                        </button>
                        
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                            onClick={() => alert('Legal analysis coming soon!')}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            Legal Analysis
                        </button>
                        
                        <button
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                            onClick={() => alert('Summary generation coming soon!')}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate Summary
                        </button>
                    </div>
                </div>

                {/* Analysis Results */}
                {analysisData && (
                    <div className="space-y-6">
                        {/* Statistics */}
                        {analysisData.data?.textStats && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Text Statistics
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {analysisData.data.textStats.wordCount}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">Words</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {analysisData.data.textStats.characterCount}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">Characters</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {analysisData.data.textStats.chunkCount}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">Chunks</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Extracted Text */}
                        {extractedText && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Extracted Text
                                </h2>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                                        {extractedText}
                                    </pre>
                                </div>
                            </div>
                        )}                        {/* Text Chunks */}
                        {chunks.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Text Chunks ({chunks.length})
                                    </h2>
                                    <button
                                        onClick={() => copyToClipboard(extractedText)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Copy All Text
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {chunks.map((chunk, index) => (
                                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    Chunk {chunk.index + 1}
                                                </h3>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {chunk.wordCount || chunk.length} {chunk.wordCount ? 'words' : 'chars'}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(chunk.content)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {chunk.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Chunks Button */}
                                {hasMoreChunks && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={loadMoreChunks}
                                            disabled={loadingChunks}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center mx-auto"
                                        >
                                            {loadingChunks ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            ) : null}
                                            Load More Chunks
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
