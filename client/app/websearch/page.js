"use client";

import React, { useState } from 'react';
import WebSearch from '../../components/WebSearch';
import Layout from '../../components/Layout';

const WebSearchPage = () => {
  const [contractText, setContractText] = useState('');

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-blue-900 dark:text-white mb-4">Web Search</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Search for similar contracts on the web.</p>
        <textarea
          className="w-full h-64 p-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your contract text here..."
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
        />
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-blue-800">
          <WebSearch contractText={contractText} />
        </div>
      </div>
    </Layout>
  );
};

export default WebSearchPage;
