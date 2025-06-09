"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../components/ui/button";
import { ThemeToggle } from "../components/ThemeToggle";
import { Brain, Home, Upload, FileText, Phone, FolderOpen } from "lucide-react";

const Layout = ({ children }) => {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 card-glass dark:card-glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {" "}
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">
                ContractAI
              </span>
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>{" "}
              <Link
                href="/upload"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/upload")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Link>
              <Link
                href="/uploads"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/uploads")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span>My Uploads</span>
              </Link>
              <Link
                href="/uploads"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/uploads")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span>My Uploads</span>
              </Link>
              <Link
                href="/docs"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/docs")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>API Docs</span>
              </Link>
              <Link
                href="/contact"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive("/contact")
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </Link>
            </div>
            {/* Theme Toggle */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/upload">
                <Button className="btn-primary hidden sm:inline-flex">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="card-glass dark:card-glass-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient">
                  ContractAI
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                AI-powered smart contract analysis for legal professionals and
                businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Legal
              </h3>{" "}
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <span className="text-xs">
                    ⚠️ This tool provides analysis only, not legal advice
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Connect
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="https://github.com"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    API Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 ContractAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
