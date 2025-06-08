"use client";
import React, { useState } from 'react';
import Chatbot from '../components/Chatbot';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gray-900 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">Legal AI</h1>
            <p className="text-sm text-gray-400 mt-1">Your Legal Assistant</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Chat Assistant</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Documents</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Legal Guide</span>
              </div>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">Powered by AI</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-white">
              {activeTab === 'chat' && 'Legal Assistant'}
              {activeTab === 'documents' && 'Legal Documents'}
              {activeTab === 'guide' && 'Legal Guide'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <Chatbot />}
            {activeTab === 'documents' && (
              <div className="h-full flex items-center justify-center text-gray-400">
                Documents feature coming soon...
              </div>
            )}
            {activeTab === 'guide' && (
              <div className="h-full flex items-center justify-center text-gray-400">
                Legal Guide feature coming soon...
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
