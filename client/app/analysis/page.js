'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import dynamic from 'next/dynamic';

// Client-side only component for formatted legal analysis
const FormattedLegalContent = ({ content, mounted }) => {
    if (!mounted || !content) {
        return (
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {content || ''}
            </div>
        );
    }    const formatLegalAnalysis = (text) => {
        if (!text) return '';

        // Debug log to see what we're receiving
        console.log('formatLegalAnalysis received:', typeof text, text);        // Handle different data structures
        let textString = '';
        if (typeof text === 'string') {
            textString = text;
        } else if (typeof text === 'object' && text !== null) {
            // Try to extract text from various possible object structures with proper null checks
            textString = text.analysis || 
                        text.summary || 
                        (text.executiveSummary && typeof text.executiveSummary === 'object' ? text.executiveSummary.content : text.executiveSummary) || 
                        text.quickSummary || 
                        text.entities ||
                        text.content;

            // If still not found, try nested structures
            if (!textString && text.data) {
                textString = text.data.analysis || 
                            text.data.summary || 
                            text.data.content || 
                            (text.data.executiveSummary && typeof text.data.executiveSummary === 'object' ? text.data.executiveSummary.content : text.data.executiveSummary) || 
                            text.data.quickSummary || 
                            text.data.entities;
            }

            // If still nothing, stringify the object for debugging
            if (!textString) {
                textString = JSON.stringify(text, null, 2);
            }
        } else {
            textString = String(text);
        }

        // Ensure we have a string
        if (typeof textString !== 'string') {
            console.warn('textString is not a string after processing:', typeof textString, textString);
            textString = String(textString);
        }

        return textString
            // Convert markdown-style headers to HTML
            .replace(/## (.*?)$/gm, '<h3 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">$1</h3>')
            .replace(/# (.*?)$/gm, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b-2 border-blue-500 pb-2">$1</h2>')

            // Convert **bold** text to HTML
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')

            // Convert bullet points to styled lists
            .replace(/^- (.*?)$/gm, '<li class="ml-4 mb-2 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span>$1</span></li>')

            // Convert numbered lists
            .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 mb-2 flex items-start"><span class="text-blue-600 font-semibold mr-2 min-w-[20px]">$&</span></li>')

            // Wrap consecutive list items in ul tags
            .replace(/((?:<li class="ml-4[^>]*>.*?<\/li>\s*)+)/gs, '<ul class="space-y-1 mb-4">$1</ul>')

            // Add emphasis for important terms
            .replace(/\b(IMPORTANT|WARNING|NOTE|CRITICAL|ATTENTION|DISCLAIMER)\b/g, '<span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-semibold">$1</span>')

            // Add styling for risk indicators
            .replace(/\b(risk|risks|liability|breach|violation|penalty|penalties)\b/gi, '<span class="text-red-600 dark:text-red-400 font-medium">$1</span>')

            // Add styling for positive terms
            .replace(/\b(benefit|benefits|advantage|advantages|protection|protected|secure|guaranteed)\b/gi, '<span class="text-green-600 dark:text-green-400 font-medium">$1</span>')

            // Convert line breaks to proper spacing
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/\n/g, '<br>')

            // Wrap the content in a paragraph if it doesn't start with a heading
            .replace(/^(?!<h[1-6]|<ul|<p)/, '<p class="mb-4">')

            // Close any unclosed paragraph at the end
            .replace(/(?<!<\/p>)$/, '</p>');
    };

    return (
        <div
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{
                __html: formatLegalAnalysis(content)
            }}
        />
    );
};

// Dynamically import the formatted content to prevent SSR issues
const DynamicFormattedContent = dynamic(() => Promise.resolve(FormattedLegalContent), {
    ssr: false,
    loading: () => <div className="text-gray-700 dark:text-gray-300 leading-relaxed animate-pulse">Loading formatted content...</div>
});

export default function AnalysisPage() {
    const searchParams = useSearchParams();
    const fileId = searchParams.get('fileId');
    const fileName = searchParams.get('fileName');

    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [chunks, setChunks] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreChunks, setHasMoreChunks] = useState(false);
    const [loadingChunks, setLoadingChunks] = useState(false);
    const [allUploads, setAllUploads] = useState([]);
    // Legal Analysis States
    const [legalAnalysis, setLegalAnalysis] = useState(null);
    const [summaries, setSummaries] = useState(null);
    const [legalEntities, setLegalEntities] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);    const [summaryLoading, setSummaryLoading] = useState(false);
    const [entitiesLoading, setEntitiesLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ocr');
    
    // Web Search States
    const [webSearchResults, setWebSearchResults] = useState(null);
    const [webSearchLoading, setWebSearchLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Load uploads for sidebar (copy from upload page)
        async function loadUploads() {
          try {
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
                      size: (result.fileSize/1024/1024).toFixed(1) + ' MB',
                      type: result.fileType?.includes('pdf') ? 'PDF' : 'Image',
                      uploadDate: new Date(result.createdAt).toISOString().split('T')[0],
                      status: result.processingStatus || 'completed',
                    }));
                    setAllUploads(serverUploads);
                    return;
                  }
                }
              } catch (e) { /* fallback below */ }
            }
            setAllUploads([]);
          } catch (e) {
            setAllUploads([]);
          }
        }
        loadUploads();
    }, []);

    useEffect(() => {
        if (fileId && fileName && mounted) {
            fetchAnalysisData();
            fetchLegalAnalysisResults();
        }
    }, [fileId, fileName, mounted]);

    // Prevent SSR hydration issues by ensuring client-side only rendering
    if (!mounted) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Document Analysis
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Loading analysis interface...
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    const fetchLegalAnalysisResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/analysis/results/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setLegalAnalysis(data.data.legalAnalysis);
                    setSummaries(data.data.summaries);
                    setLegalEntities(data.data.legalEntities);
                }
            }
        } catch (err) {
            console.log('No existing legal analysis found');
        }
    };

    const performLegalAnalysis = async () => {
        try {
            setAnalysisLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/analysis/analyze/${fileId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Legal Analysis Response:', data.data);
                    setLegalAnalysis(data.data.analysis);
                    setActiveTab('legal');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to perform legal analysis');
            }
        } catch (err) {
            console.error('Error performing legal analysis:', err);
            setError(`Failed to perform legal analysis: ${err.message}`);
        } finally {
            setAnalysisLoading(false);
        }
    };

    const generateSummary = async () => {
        try {
            setSummaryLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/analysis/summary/${fileId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bulletCount: 5 // Default bullet count for quick summary
                })
            });            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Summary Response - Full data:', data);
                    console.log('Summary Response - data.data:', data.data);
                    setSummaries(data.data);
                    setActiveTab('summary');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate summary');
            }
        } catch (err) {
            console.error('Error generating summary:', err);
            setError(`Failed to generate summary: ${err.message}`);
        } finally {
            setSummaryLoading(false);
        }
    };

    const extractLegalEntities = async () => {
        try {
            setEntitiesLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/analysis/entities/${fileId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setLegalEntities(data.data);
                    setActiveTab('entities');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to extract legal entities');
            }
        } catch (err) {
            console.error('Error extracting legal entities:', err);
            setError(`Failed to extract legal entities: ${err.message}`);
        } finally {
            setEntitiesLoading(false);
        }
    };

    const performWebSearch = async () => {
        try {
            setWebSearchLoading(true);
            
            if (!extractedText) {
                setError('No extracted text available for web search');
                return;
            }

            const response = await fetch('https://mcp-legal-search.onrender.com/api/legal/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ 
                    contract_text: extractedText.substring(0, 2000) // Limit text to avoid too long requests
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Web search response:', data); // Debug log
                
                if (data && (data.similar_contracts || data.analysis)) {
                    setWebSearchResults(data);
                    setActiveTab('websearch');
                } else {
                    throw new Error('Invalid response format from web search API');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to perform web search');
            }
        } catch (err) {
            console.error('Error performing web search:', err);
            setError(`Failed to perform web search: ${err.message}`);
        } finally {
            setWebSearchLoading(false);
        }
    };

    const fetchAnalysisData = async () => {
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

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/result/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Data: ", data);
                setAnalysisData(data);

                if (data.success && data.data) {
                    setExtractedText(data.data.extractedText || '');
                    setChunks(data.data.chunks || []);
                    setCurrentPage(data.data.currentPage || 1);
                    setHasMoreChunks(data.data.hasMore || false);
                } else {
                    setError('No OCR data found for this file');
                }
            } else {
                setError('Failed to load analysis data');
            }
        } catch (err) {
            console.error('Error fetching analysis:', err);
            setError('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    const performOCRAnalysis = async () => {
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

            const response = await fetch(`https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/ocr/chunks/${fileId}?page=${currentPage + 1}&limit=10`, {
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

    // Add handler for Chat with Contract
    const handleChatWithContract = () => {
        if (extractedText) {
            sessionStorage.setItem('chat_contract_context', extractedText);
            sessionStorage.setItem('chat_contract_name', fileName || 'your contract');
            window.open('/chatbot?context=contract', '_blank');
        } else {
            alert('No extracted text available to chat with.');
        }
    };

    // Utility function to download PDF from backend
    const downloadPDF = (content, fileName, type = 'analysis') => {
        const token = localStorage.getItem('token');
        fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/document/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: typeof content === 'string' ? content : (content.analysis || content.summary || JSON.stringify(content, null, 2)),
                fileName: fileName || 'document',
                type
            })
        })
            .then(async res => {
                if (!res.ok) {
                    let msg = 'Failed to generate PDF';
                    try {
                        const data = await res.json();
                        if (data && data.error) msg = `PDF Error: ${data.error}`;
                    } catch {}
                    throw new Error(msg);
                }
                return res.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName || 'document'}-${type}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                alert('Failed to download PDF: ' + err.message);
            });
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
            <div className="max-w-7xl mx-auto px-4 py-12" suppressHydrationWarning={true}>
                {/* Main Analysis Content */}
                <div className="flex flex-col gap-8">
                    {/* Document Title and Metadata */}
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Available Actions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                                onClick={performLegalAnalysis}
                                disabled={analysisLoading || !extractedText}
                            >
                                {analysisLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                )}
                                Legal Analysis
                            </button>

                            <button
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                                onClick={generateSummary}
                                disabled={summaryLoading || !extractedText}
                            >
                                {summaryLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                                Generate Summary
                            </button>

                            <button
                                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                                onClick={extractLegalEntities}
                                disabled={entitiesLoading || !extractedText}
                            >
                                {entitiesLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                )}
                                Extract Entities
                            </button>                            <button
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                                onClick={handleChatWithContract}
                                disabled={!extractedText}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3H9a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" />
                                </svg>
                                Chat with Contract
                            </button>                            <button
                                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                                onClick={performWebSearch}
                                disabled={webSearchLoading || !extractedText}
                            >
                                {webSearchLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                                Web Search
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="flex space-x-8 px-6">
                                <button
                                    onClick={() => setActiveTab('ocr')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'ocr'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    OCR Results
                                </button>
                                <button
                                    onClick={() => setActiveTab('legal')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'legal'
                                            ? 'border-green-500 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Legal Analysis {legalAnalysis && '✓'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'summary'
                                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Summaries {summaries && '✓'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('entities')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'entities'
                                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Legal Entities {legalEntities && '✓'}
                                </button>                                <button
                                    onClick={() => setActiveTab('websearch')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'websearch'
                                            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Web Search {webSearchResults && '✓'}
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {analysisData && (
                        <div className="space-y-6">
                            {/* OCR Results Tab */}
                            {activeTab === 'ocr' && (
                                <>
                                    {/* Statistics */}
                                    {analysisData.data?.textStats && (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
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
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                                Extracted Text
                                            </h2>
                                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                                                    {extractedText}
                                                </pre>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={() => copyToClipboard(extractedText)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Copy All Text
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Chunks */}
                                    {chunks.length > 0 && (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    Text Chunks ({chunks.length})
                                                </h2>
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
                                </>
                            )}

                            {/* Legal Analysis Tab */}
                            {activeTab === 'legal' && (
                                <div className="space-y-6">
                                    {legalAnalysis ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                                    <span className="mr-3 text-3xl">⚖️</span>
                                                    Legal Analysis Results
                                                </h2>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const textContent = typeof legalAnalysis === 'string' ? legalAnalysis :
                                                                legalAnalysis.analysis || JSON.stringify(legalAnalysis, null, 2);
                                                            copyToClipboard(textContent);
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        Copy Analysis
                                                    </button>
                                                    <button
                                                        onClick={() => downloadPDF(legalAnalysis, fileName, 'analysis')}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        Download PDF
                                                    </button>
                                                </div>
                                            </div>                                        <div className="prose prose-lg dark:prose-invert max-w-none" suppressHydrationWarning={true}>
                                                <DynamicFormattedContent
                                                    content={legalAnalysis}
                                                    mounted={mounted}
                                                />
                                            </div>

                                            {/* Analysis Metadata */}
                                            {legalAnalysis.timestamp && (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mt-6 border border-blue-200 dark:border-blue-700">
                                                    <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {new Date(legalAnalysis.timestamp).toLocaleString()}
                                                        </div>
                                                        {legalAnalysis.wordCount && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Original: {legalAnalysis.wordCount} words
                                                            </div>
                                                        )}
                                                        {legalAnalysis.analysisLength && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                </svg>
                                                                Analysis: {legalAnalysis.analysisLength} words
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
                                            <div className="text-gray-400 mb-4">
                                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                No Legal Analysis Available
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Click "Legal Analysis" above to perform AI-powered legal document analysis.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summaries Tab */}
                            {activeTab === 'summary' && (
                                <div className="space-y-6">
                                    {summaries ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center">
                                                    <span className="mr-3 text-3xl">📋</span>
                                                    Document Summary
                                                </h2>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const textContent = typeof summaries === 'string' ? summaries :
                                                                summaries.summary || summaries.content || summaries.executiveSummary || summaries.quickSummary || JSON.stringify(summaries, null, 2);
                                                            copyToClipboard(textContent);
                                                        }}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        Copy Summary
                                                    </button>
                                                    <button
                                                        onClick={() => downloadPDF(summaries, fileName, 'summary')}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                    >
                                                        Download PDF
                                                    </button>
                                                </div>
                                            </div>                                        <div className="prose prose-lg dark:prose-invert max-w-none" suppressHydrationWarning={true}>
                                                <DynamicFormattedContent
                                                    content={summaries}
                                                    mounted={mounted}
                                                />
                                            </div>

                                            {/* Summary Metadata */}
                                            {summaries.timestamp && (
                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mt-6 border border-purple-200 dark:border-purple-700">
                                                    <div className="flex items-center space-x-4 text-sm text-purple-700 dark:text-purple-300">
                                                        <div className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {new Date(summaries.timestamp).toLocaleString()}
                                                        </div>
                                                        {summaries.stats?.compressionRatio && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                                Compression: {summaries.stats.compressionRatio}%
                                                            </div>
                                                        )}
                                                        {summaries.stats?.originalWordCount && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Original: {summaries.stats.originalWordCount} words
                                                            </div>
                                                        )}
                                                        {summaries.stats?.summaryWordCount && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                </svg>
                                                                Summary: {summaries.stats.summaryWordCount} words
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
                                            <div className="text-gray-400 mb-4">
                                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                No Summaries Available
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Click "Generate Summary" above to create AI-powered document summaries.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Legal Entities Tab */}
                            {activeTab === 'entities' && (
                                <div className="space-y-6">
                                    {legalEntities ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center">
                                                    <span className="mr-3 text-3xl">🏷️</span>
                                                    Extracted Legal Entities
                                                </h2>                                            <button
                                                    onClick={() => {
                                                        const textContent = typeof legalEntities === 'string' ? legalEntities :
                                                            legalEntities.entities || JSON.stringify(legalEntities, null, 2);
                                                        copyToClipboard(textContent);
                                                    }}
                                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                >
                                                    Copy Entities
                                                </button>
                                            </div>                                        <div className="prose prose-lg dark:prose-invert max-w-none" suppressHydrationWarning={true}>
                                                <DynamicFormattedContent
                                                    content={legalEntities}
                                                    mounted={mounted}
                                                />
                                            </div>

                                            {/* Entities Metadata */}
                                            {legalEntities.timestamp && (
                                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 mt-6 border border-orange-200 dark:border-orange-700">
                                                    <div className="flex items-center text-sm text-orange-700 dark:text-orange-300">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Entities extracted on {new Date(legalEntities.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 text-center">
                                            <div className="text-gray-400 mb-4">
                                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                No Legal Entities Extracted
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Click "Extract Entities" above to identify key legal entities in the document.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Web Search Tab */}
                            {activeTab === 'websearch' && (
                                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Web Search Results
                                        </h2>                        <button
                            onClick={performWebSearch}
                            disabled={webSearchLoading}
                            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                        >
                            {webSearchLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            ) : (
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            )}
                            Perform Web Search
                        </button>
                                    </div>                                    {webSearchResults ? (
                                        <div className="space-y-6">
                                            {/* Analysis Section */}
                                            {webSearchResults.analysis && (
                                                <div className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                        Contract Analysis
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contract Type:</p>
                                                            <p className="text-gray-900 dark:text-white">{webSearchResults.analysis.contract_type || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</p>
                                                            <p className="text-gray-900 dark:text-white">{webSearchResults.analysis.location || 'Not specified'}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject Matter:</p>
                                                            <p className="text-gray-900 dark:text-white">{webSearchResults.analysis.subject_matter || 'Not specified'}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Jurisdiction:</p>
                                                            <p className="text-gray-900 dark:text-white">{webSearchResults.analysis.jurisdiction || 'Not specified'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {webSearchResults.analysis.key_terms && webSearchResults.analysis.key_terms.length > 0 && (
                                                        <div className="mb-4">
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Key Terms:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {webSearchResults.analysis.key_terms.map((term, index) => (
                                                                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                                                        {term}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {webSearchResults.analysis.parties && webSearchResults.analysis.parties.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Parties:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {webSearchResults.analysis.parties.map((party, index) => (
                                                                    <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                                                                        {party}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Similar Contracts Section */}
                                            {webSearchResults.similar_contracts && webSearchResults.similar_contracts.length > 0 && (
                                                <>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Similar Contracts ({webSearchResults.similar_contracts.length})
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {webSearchResults.similar_contracts.map((contract, index) => (
                                                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h4 className="text-md font-medium text-gray-900 dark:text-white flex-1 mr-3">
                                                                        {contract.title || 'Untitled Contract'}
                                                                    </h4>
                                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                                        contract.relevance_score?.toLowerCase() === 'high' 
                                                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                                            : contract.relevance_score?.toLowerCase() === 'medium'
                                                                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                                    }`}>
                                                                        {contract.relevance_score || 'Unknown'} Relevance
                                                                    </span>
                                                                </div>
                                                                
                                                                <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm leading-relaxed">
                                                                    {contract.snippet || 'No preview available'}
                                                                </p>
                                                                
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                                                                    <div>
                                                                        <p className="font-medium text-gray-600 dark:text-gray-400">Type:</p>
                                                                        <p className="text-gray-900 dark:text-white">{contract.contract_type || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-600 dark:text-gray-400">Source:</p>
                                                                        <p className="text-gray-900 dark:text-white">{contract.source || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-600 dark:text-gray-400">Domain:</p>
                                                                        <p className="text-gray-900 dark:text-white">{contract.domain || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                                
                                                                {contract.url && (
                                                                    <a
                                                                        href={contract.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
                                                                    >
                                                                        📄 {contract.clickable_description || 'View Document'}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                            
                                            {webSearchResults.similar_contracts && webSearchResults.similar_contracts.length === 0 && (
                                                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                                    <div className="text-gray-500 dark:text-gray-400">
                                                        <p className="text-lg mb-2">No similar contracts found</p>
                                                        <p className="text-sm">Try refining your contract text or search terms</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                                            No web search results found. Perform a web search to see results here.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
