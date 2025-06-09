import React, { useState, useEffect } from 'react';
import axios from 'axios';

const initialQuestions = [
  {
    id: 1,
    question: "What type of legal assistance are you seeking?",
    options: ["Criminal Law", "Civil Law", "Family Law", "Corporate Law", "Other"]
  },
  {
    id: 2,
    question: "Is this regarding a new case or an existing one?",
    options: ["New Case", "Existing Case"]
  },
  {
    id: 3,
    question: "What is your preferred language for communication?",
    options: ["English", "Spanish", "French", "Other"]
  }
];

const Chatbot = () => {
  const [currentStep, setCurrentStep] = useState('initial');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const generatePDF = async (conversation) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/document/generate', {
        conversation,
        answers
      });
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = `http://localhost:5000${response.data.pdfUrl}`;
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
      console.error('Error generating PDF:', error);
      setResponses(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, there was an error generating the PDF. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    const newAnswers = {
      ...answers,
      [initialQuestions[currentQuestionIndex].id]: answer
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < initialQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep('chat');
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/legal/initialize', {
          answers: newAnswers
        }, { withCredentials: true });
        setResponses([{ type: 'bot', content: response.data.message }]);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setResponses([{ 
          type: 'bot', 
          content: "I apologize, but I'm having trouble connecting to the server. Please try again in a moment.\n" + (error?.response?.data?.error || error.message)
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    const userQuery = query;
    setQuery('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/legal/ask', {
        query: userQuery,
        context: answers
      });
      
      setResponses(prev => [...prev, 
        { type: 'user', content: userQuery },
        { type: 'bot', content: response.data.answer, followUpQuestions: response.data.followUpQuestions }
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponses(prev => [...prev,
        { type: 'user', content: userQuery },
        { type: 'bot', content: "I apologize, but I'm having trouble processing your request. Please try again in a moment." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'initial') {
    const currentQuestion = initialQuestions[currentQuestionIndex];
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Legal Assistant</h2>
              <div className="text-gray-400">
                Question {currentQuestionIndex + 1} of {initialQuestions.length}
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="text-xl font-medium text-gray-200">
                {currentQuestion.question}
              </div>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full p-4 text-left rounded-xl border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:border-blue-500 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Legal Assistant</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => generatePDF(responses)}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <div className="text-gray-400 text-sm">
                Powered by AI
              </div>
            </div>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {responses.map((response, index) => (
              <div key={index} className={`space-y-2 ${response.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                  response.type === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-700 text-gray-200'
                }`}>
                  {response.content}
                </div>
                {response.followUpQuestions && (
                  <div className="mt-4 space-y-2">
                    {response.followUpQuestions.map((q, qIndex) => (
                      <div 
                        key={qIndex} 
                        className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => setQuery(q.question)}
                      >
                        • {q.question}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-center">
                <div className="animate-pulse text-gray-400">Thinking...</div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
              className="flex-1 p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Type your legal question..."
            />
            <button
              onClick={handleQuerySubmit}
              disabled={loading || !query.trim()}
              className="px-6 py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
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
        </div>

        {showPDF && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Legal Consultation Summary</h3>
                <button
                  onClick={() => setShowPDF(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <iframe
                src={pdfUrl}
                className="w-full h-[80vh] rounded-lg"
                title="Legal Consultation PDF"
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
