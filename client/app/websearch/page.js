"use client";

import React, { useState } from 'react';
import WebSearch from '../../components/WebSearch';
import Layout from '../../components/Layout';

const WebSearchPage = () => {
  const [contractText, setContractText] = useState('');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Web Search</h1>
        <p className="text-gray-600 mb-8">Search for similar contracts on the web.</p>
        <textarea
          className="w-full h-64 p-4 border rounded-lg mb-4"
          placeholder="Paste your contract text here..."
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
        />
        <WebSearch contractText={contractText} />
      </div>
    </Layout>
  );
};

export default WebSearchPage;
