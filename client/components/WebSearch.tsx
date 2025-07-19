import React, { useState } from 'react';

interface WebSearchProps {
  contractText: string;
}

interface Toast {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface SimilarContract {
  title: string;
  url: string;
  snippet: string;
  contract_type: string;
  location: string;
  relevance_score: string;
  source: string;
  link_type: string;
  domain: string;
  clickable_description: string;
}

interface Analysis {
  location: string;
  contract_type: string;
  key_terms: string[];
  parties: string[];
  subject_matter: string;
  jurisdiction: string;
}

interface WebSearchResponse {
  analysis: Analysis;
  similar_contracts: SimilarContract[];
}

const showToast = (toast: Toast) => {
  const toastContainer = document.getElementById('toast-container');
  if (toastContainer) {
    const toastElement = document.createElement('div');
    toastElement.className = `p-4 rounded-lg mb-4 shadow-lg ${
      toast.variant === 'destructive'
        ? 'bg-red-100 text-red-700 border border-red-300'
        : toast.variant === 'success'
        ? 'bg-green-100 text-green-700 border border-green-300'
        : 'bg-gray-100 text-gray-700 border border-gray-300'
    }`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex items-center';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'flex-1 min-w-0';
    
    const titleP = document.createElement('p');
    titleP.className = 'text-sm font-medium';
    titleP.textContent = toast.title;
    
    const descP = document.createElement('p');
    descP.className = 'mt-1 text-sm text-gray-600';
    descP.textContent = toast.description;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-4 text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600';
    closeButton.textContent = '×';
    closeButton.onclick = () => toastElement.remove();
    
    textDiv.appendChild(titleP);
    textDiv.appendChild(descP);
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(closeButton);
    toastElement.appendChild(contentDiv);
    
    toastContainer.appendChild(toastElement);

    setTimeout(() => {
      if (toastElement.parentElement) {
         toastElement.remove();
      }
    }, 5000);
  }
};

const WebSearch: React.FC<WebSearchProps> = ({ contractText }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WebSearchResponse | null>(null);


  const handleSearch = async () => {
    if (!contractText || !contractText.trim()) {
      showToast({
        title: "Error",
        description: "Please provide contract text to search.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults(null); // Clear previous results
    try {
      const response = await fetch('https://mcp-legal-search.onrender.com/api/legal/analyze', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ contract_text: contractText }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        showToast({
          title: "Success",
          description: data.similar_contracts && data.similar_contracts.length > 0 
            ? `Found ${data.similar_contracts.length} similar contracts.` 
            : "Analysis complete. No similar contracts found.",
          variant: "success",
        });
      } else {
        throw new Error(data.error || 'Failed to perform web search');
      }
    } catch (error) {
      console.error('Web search error:', error);
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred during web search.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '10px 15px',
          border: '1px solid transparent',
          fontSize: '0.875rem',
          fontWeight: '500',
          borderRadius: '0.375rem',
          color: 'white',
          backgroundColor: loading ? '#60A5FA' : '#3B82F6', // Lighter blue when loading
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = '#2563EB'); }}
        onMouseOut={(e) => { if (!loading) (e.currentTarget.style.backgroundColor = '#3B82F6'); }}
      >
        {loading ? (
          <>
            <svg style={{ marginRight: '8px', width: '20px', height: '20px', fill: 'white' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75A11,11,0,0,0,12,1,11,11,0,0,0,1,10.25A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/></path></svg>
            Searching...
          </>
        ) : 'Search Similar Contracts'}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          {/* Analysis Section */}
          {results.analysis && (
            <div style={{
              padding: '20px',
              backgroundColor: '#F8FAFC',
              borderRadius: '0.5rem',
              border: '1px solid #E2E8F0',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '15px', color: '#1F2937' }}>
                Contract Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Contract Type:</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{results.analysis.contract_type || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Location:</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{results.analysis.location || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Subject Matter:</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{results.analysis.subject_matter || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Jurisdiction:</p>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{results.analysis.jurisdiction || 'Not specified'}</p>
                </div>
              </div>
              
              {results.analysis.key_terms && results.analysis.key_terms.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Key Terms:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {results.analysis.key_terms.map((term, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {results.analysis.parties && results.analysis.parties.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Parties:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {results.analysis.parties.map((party, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: '#F0FDF4',
                        color: '#166534',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Similar Contracts Section */}
          {results.similar_contracts && results.similar_contracts.length > 0 && (
            <>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '15px', color: '#1F2937' }}>
                Similar Contracts ({results.similar_contracts.length})
              </h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {results.similar_contracts.map((contract: SimilarContract, index: number) => (
                  <div key={index} style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: '600', fontSize: '1rem', color: '#1F2937', flex: 1, marginRight: '10px' }}>
                        {contract.title || 'Untitled Contract'}
                      </h4>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: contract.relevance_score?.toLowerCase() === 'high' ? '#DCFCE7' : 
                                        contract.relevance_score?.toLowerCase() === 'medium' ? '#FEF3C7' : '#FEE2E2',
                        color: contract.relevance_score?.toLowerCase() === 'high' ? '#166534' : 
                               contract.relevance_score?.toLowerCase() === 'medium' ? '#92400E' : '#991B1B'
                      }}>
                        {contract.relevance_score || 'Unknown'} Relevance
                      </span>
                    </div>
                    
                    <p style={{ color: '#4B5563', marginBottom: '12px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                      {contract.snippet || 'No preview available'}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6B7280', marginBottom: '2px' }}>Type:</p>
                        <p style={{ fontSize: '0.875rem', color: '#374151' }}>{contract.contract_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6B7280', marginBottom: '2px' }}>Source:</p>
                        <p style={{ fontSize: '0.875rem', color: '#374151' }}>{contract.source || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6B7280', marginBottom: '2px' }}>Domain:</p>
                        <p style={{ fontSize: '0.875rem', color: '#374151' }}>{contract.domain || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {contract.url && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <a
                          href={contract.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#3B82F6',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            backgroundColor: '#EFF6FF',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#DBEAFE';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          📄 {contract.clickable_description || 'View Document'}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {results.similar_contracts && results.similar_contracts.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: '0.5rem',
              border: '2px dashed #D1D5DB'
            }}>
              <p style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '8px' }}>No similar contracts found</p>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Try refining your contract text or search terms</p>
            </div>
          )}
        </div>
      )}

      <div id="toast-container" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 50,
        width: '350px',
        display: 'flex',
        flexDirection: 'column-reverse', // New toasts appear on top
      }} />
    </div>
  );
};

export default WebSearch;
