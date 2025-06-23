import React, { useState } from 'react';
import axios from 'axios';

const LegalActions = () => {
  const [processName, setProcessName] = useState('');
  const [formData, setFormData] = useState({});
  const [guide, setGuide] = useState('');
  const [documentType, setDocumentType] = useState('');

  const handleProcessSubmit = async () => {
    if (!processName) return;
    try {
      const response = await axios.post('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/guide', { processName });
      setGuide(response.data.guide);
    } catch (error) {
      let msg = 'Error fetching process guide.';
      if (error.response && error.response.data && error.response.data.error) {
        msg = `Guide Error: ${error.response.data.error}`;
      }
      console.error(msg, error);
      setGuide(msg);
    }
  };

  const handleDocumentGeneration = async () => {
    try {
      const response = await axios.post('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/document/generate', {
        documentType,
        formData,
      });
      window.location.href = response.data.downloadUrl;
    } catch (error) {
      let msg = 'Error generating document.';
      if (error.response && error.response.data && error.response.data.error) {
        msg = `Document Error: ${error.response.data.error}`;
      }
      console.error(msg, error);
      alert(msg);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 space-y-6">
      {/* Legal Process Guide */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h2 className="text-2xl font-semibold text-[#1D4ED8] mb-4">Legal Process Guide</h2>
        <input
          type="text"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          placeholder="Enter legal process (e.g., FIR)"
        />
        <button
          onClick={handleProcessSubmit}
          className="w-full bg-[#9333EA] text-white px-6 py-3 rounded-lg hover:bg-[#1D4ED8] transition"
        >
          Get Guide
        </button>
        {guide && <div className="mt-6 text-[#555555]">{guide}</div>}
      </div>

      {/* Document Generator */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h2 className="text-2xl font-semibold text-[#1D4ED8] mb-4">Generate Legal Document</h2>
        <input
          type="text"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          placeholder="Enter document type (e.g., Rent Agreement)"
        />
        <button
          onClick={handleDocumentGeneration}
          className="w-full bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#9333EA] transition"
        >
          Generate Document
        </button>
      </div>
    </div>
  );
};

export default LegalActions;
