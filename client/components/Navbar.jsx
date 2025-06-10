"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import IconBrain from "./icons/IconBrain";
import IconShield from "./icons/IconShield";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <nav className="w-full bg-white/90 dark:bg-slate-900/90 shadow-lg border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="bg-gradient-to-r from-blue-700 to-cyan-500 rounded-lg p-2 shadow-md transition-transform group-hover:scale-110">
            <IconBrain />
          </span>
          <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500 tracking-tight select-none">
            LegalAI
          </span>
        </Link>
        <Link href="/upload" className="hidden md:inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-md text-base font-bold">↑</span>
          <span>Upload</span>
        </Link>
        <Link href="/chatbot" className="hidden md:inline-block text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          Chatbot
        </Link>
        <Link href="/docs" className="hidden md:inline-block text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          API Docs
        </Link>
        <Link href="/websearch" className="hidden md:inline-block text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          Web Search
        </Link>
        <Link href="/uploads" className="hidden md:inline-block text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-cyan-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          My Uploads
        </Link>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {!isAuthenticated && (
          <Link
            href="/auth/login"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 border border-blue-600/30"
          >
            Login
          </Link>
        )}
        {isAuthenticated && (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-cyan-300 px-5 py-2 rounded-xl font-semibold shadow hover:bg-blue-100 dark:hover:bg-slate-700 transition-all duration-200 border border-blue-700/10"
            >
              <span className="w-7 h-7 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.name ? user.name[0].toUpperCase() : <IconShield />}
              </span>
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200 border border-red-500/30"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
