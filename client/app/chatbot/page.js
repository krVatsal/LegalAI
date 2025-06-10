"use client";
import React from 'react';
import Chatbot from '../../components/Chatbot';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';

export default function ChatbotPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-8 px-2">
          <div className="w-full max-w-2xl mx-auto bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl p-0 sm:p-8 border border-slate-200 dark:border-slate-700 flex flex-col justify-center animate-fade-in">
            <Chatbot />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
