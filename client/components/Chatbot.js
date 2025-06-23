import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const [currentStep, setCurrentStep] = useState('chat');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [contractContext, setContractContext] = useState(null);
  const [contractName, setContractName] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const context = sessionStorage.getItem('chat_contract_context');
    const name = sessionStorage.getItem('chat_contract_name');
    if (context) {
      setContractContext(context);
      setContractName(name || 'your contract');
      setResponses([]); // Do NOT show welcome message if contract mode
      sessionStorage.removeItem('chat_contract_context');
      sessionStorage.removeItem('chat_contract_name');
      setCurrentStep('chat');
    } else if (responses.length === 0) {
      // Only set welcome message if there is no contract context
      setResponses([
        { type: 'bot', content: 'Welcome! How can I assist you today?' }
      ]);
      setCurrentStep('chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePDF = async (conversation) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/document/generate', {
        conversation,
        answers: {} // Always send an object to avoid backend errors
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = `https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net${response.data.pdfUrl}`;
      link.target = '_blank';
      link.download = `legal-consultation-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setResponses(prev => [...prev, {
        type: 'bot',
        content: 'Your consultation summary has been downloaded as a PDF.'
      }]);
    } catch (error) {
      let msg = 'Sorry, there was an error generating the PDF. Please try again.';
      if (error.response && error.response.data && error.response.data.error) {
        msg = `PDF Error: ${error.response.data.error}`;
      }
      setResponses(prev => [...prev, {
        type: 'bot',
        content: msg
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Modify handleQuerySubmit to use correct API contract
  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const userQuery = query;
    setQuery('');
    try {
      setResponses(prev => {
        let filtered = prev.filter(r => r.type !== 'bot' || (r.type === 'bot' && !/^welcome!/i.test(r.content)));
        return [...filtered, { type: 'user', content: userQuery }];
      });
      // Always prepend contract context as system message if present
      let history = responses
        .filter(r => r.type === 'user' || r.type === 'bot')
        .map(r => ({ role: r.type === 'user' ? 'user' : 'assistant', content: r.content }));
      if (contractContext) {
        const systemPrompt = `The following contract is the context for this conversation: ${contractContext}`;
        console.log('Gemini system prompt:', systemPrompt); // <-- Add this log
        history = [
          { role: 'system', content: systemPrompt },
          ...history.filter(h => h.role !== 'system')
        ];
      }      const token = localStorage.getItem('token');
      const response = await axios.post('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/legal/ask', {
        message: userQuery,
        history
      }, { 
        withCredentials: true,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      // Format the bot's response for better readability
      // Format bot responses: if the message contains example prompts, extract and format as bullet points
      const formatBotResponse = (text) => {
        if (!text) return '';
        text = text.replace(/It looks like you're starting a conversation\.|I'm ready for your request\.|Please ask your question\./gi, '').trim();
        text = text.replace(/(Waiting for your request\.|Let me know what you need!.*|So, what's on your mind\?|Please let me know how I can be of service\.)/gi, '').trim();
        // Format divorce steps and similar lists for better presentation
        if (/steps.*divorce|general overview of potential steps|here is.*overview/i.test(text)) {
          // Extract numbered steps
          const stepMatch = text.match(/\d+\.\s+.+/gs);
          let steps = '';
          if (stepMatch) {
            steps = stepMatch[0]
              .split(/\n\d+\.\s+/)
              .map((s, i) => s ? `${i+1}. ${s.trim()}` : null)
              .filter(Boolean)
              .join('\n');
          }
          // Extract bullet points for next areas of inquiry
          const bulletMatch = text.match(/\*\*In general, here are some potential next areas of inquiry.*?\*\*In the meantime,|\*\*Do you know where your spouse is\?.*?\*\*Do you own property together\?.*?\*\*/gs);
          let bullets = '';
          if (bulletMatch) {
            bullets = bulletMatch[0]
              .replace(/\*\*/g, '')
              .split(/\*\s+/)
              .map(s => s.trim())
              .filter(Boolean)
              .map(s => `• ${s}`)
              .join('\n');
          }
          // Compose formatted response with markdown-like bold headings
          let formatted = '';
          if (/location/i.test(text)) {
            formatted += '**To provide the most accurate divorce steps, please let me know your state or country.**\n\n';
          }
          if (bullets) {
            formatted += '**Key questions to consider before proceeding:**\n' + bullets + '\n\n';
          }
          if (steps) {
            formatted += '**General Steps to Get a Divorce:**\n' + steps + '\n';
          }
          formatted += '\n_Note: This is not legal advice. Please consult a qualified attorney in your jurisdiction for specific guidance._';
          return formatted.trim();
        }
        // Extract example prompts and format as bullet points (no intro)
        const exampleMatch = text.match(/For example, you could ask:(.*)/is);
        if (exampleMatch) {
          let examples = exampleMatch[1]
            .split(/\*\s+/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => `• ${s.replace(/"/g, '')}`)
            .join('\n');
          return examples;
        }
        if (!text) return 'How can I assist you with your legal matter?';
        let paragraphs = text.split(/\n\n|(?<=\.)\s+/);
        paragraphs = paragraphs.map(p => p.charAt(0).toUpperCase() + p.slice(1));
        return paragraphs.join('\n\n');
      };
      setResponses(prev => [
        ...prev.filter(r => r.type !== 'bot' || !/^welcome!/i.test(r.content)),
        { type: 'bot', content: formatBotResponse(response.data.message) }
      ]);
    } catch (error) {
      let msg = "I apologize, but I'm having trouble processing your request. Please try again in a moment.";
      if (error.response && error.response.data && error.response.data.error) {
        msg = `Error: ${error.response.data.error}`;
      }
      setResponses(prev => [...prev,
        { type: 'user', content: userQuery },
        { type: 'bot', content: msg }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-white mb-6 text-center border-b border-blue-100 dark:border-slate-800 pb-4 bg-white/80 dark:bg-slate-900/80 rounded-t-2xl">
        Legal Assistant Chatbot
      </h2>
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 bg-white dark:bg-slate-900 rounded-b-2xl">
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {responses.map((response, index) => (
            <div key={index} className={`space-y-2 ${response.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-4 rounded-2xl max-w-[80%] shadow-md ${
                response.type === 'user'
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100'
              }`}>
                {response.type === 'bot' ? (
                  <ReactMarkdown
                    components={{
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-2" {...props} />
                    }}
                  >
                    {response.content}
                  </ReactMarkdown>
                ) : response.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-center">
              <div className="animate-pulse text-blue-400">Thinking...</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-6 px-2 sm:px-6 pb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
          className="flex-1 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border border-blue-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 shadow"
          placeholder="Type your legal question..."
        />
        <button
          onClick={handleQuerySubmit}
          disabled={loading || !query.trim()}
          className="px-6 py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 shadow"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </div>
      <div className="flex justify-end px-2 sm:px-6 pb-2">
        <button
          onClick={() => generatePDF(responses)}
          disabled={loading || responses.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download PDF
        </button>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e0e7ef;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #b6c2e2;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
