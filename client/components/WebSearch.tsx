import React, { useState } from 'react';

interface WebSearchProps {
  contractText: string;
}

interface Toast {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
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
    toastElement.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: 0.875rem; font-weight: 500;">${toast.title}</p>
          <p style="margin-top: 0.25rem; font-size: 0.875rem; color: #4B5563;">${toast.description}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 1rem; color: #9CA3AF; background: transparent; border: none; cursor: pointer;">&times;</button>
      </div>
    `;
    toastContainer.appendChild(toastElement);
    
    setTimeout(() => {
      if (toastElement.parentElement) {
         toastElement.remove();
      }
    }, 5000); // Increased timeout to 5 seconds
  }
};

const WebSearch: React.FC<WebSearchProps> = ({ contractText }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

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
    setResults([]); // Clear previous results
    try {
      const response = await fetch('/api/webSearch/search-contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractText }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data.results || []); // Ensure results is an array
        showToast({
          title: "Success",
          description: data.results && data.results.length > 0 ? "Web search completed successfully." : "Search complete. No results found.",
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

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '10px' }}>Search Results</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {results.map((result, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>{result.title || 'No Title'}</h4>
                <p style={{ color: '#4B5563', marginTop: '8px', fontSize: '0.875rem' }}>{result.snippet || 'No Snippet'}</p>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#3B82F6',
                      textDecoration: 'none',
                      marginTop: '8px',
                      display: 'inline-block',
                      fontSize: '0.875rem'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    View Document
                  </a>
                )}
              </div>
            ))}
          </div>
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
