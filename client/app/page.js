"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

// Custom Icon Components (minimal, legal/saas style)
function IconBrain() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 32,
				height: 32,
				background: "#2563eb",
				borderRadius: "8px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 20,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			AI
		</span>
	);
}
function IconFile() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 32,
				height: 32,
				background: "#06b6d4",
				borderRadius: "8px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 20,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			DOC
		</span>
	);
}
function IconShield() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 32,
				height: 32,
				background: "#f43f5e",
				borderRadius: "8px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 20,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			⚖️
		</span>
	);
}
function IconZap() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 32,
				height: 32,
				background: "#facc15",
				borderRadius: "8px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 20,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			⚡
		</span>
	);
}
function IconCheck() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 24,
				height: 24,
				background: "#22c55e",
				borderRadius: "50%",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 16,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			✓
		</span>
	);
}
function IconUpload() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 24,
				height: 24,
				background: "#2563eb",
				borderRadius: "6px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 16,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			↑
		</span>
	);
}
function IconDownload() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 24,
				height: 24,
				background: "#06b6d4",
				borderRadius: "6px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 16,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			↓
		</span>
	);
}
function IconSearch() {
	return (
		<span
			style={{
				display: "inline-block",
				width: 24,
				height: 24,
				background: "#f59e42",
				borderRadius: "6px",
				color: "#fff",
				fontWeight: "bold",
				fontSize: 16,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			🔍
		</span>
	);
}

const features = [
	{
		icon: <IconBrain />,
		title: "AI-Powered Analysis",
		description: "Extract key insights from your contracts using advanced AI.",
	},
	{
		icon: <IconFile />,
		title: "Smart Extraction",
		description: "Identify parties, terms, dates, and critical clauses instantly.",
	},
	{
		icon: <IconShield />,
		title: "Risk Detection",
		description: "Spot potential legal risks and problematic clauses.",
	},
	{
		icon: <IconZap />,
		title: "Instant Results",
		description: "Get comprehensive analysis results in seconds.",
	},
];

const steps = [
	{
		icon: <IconUpload />,
		title: "Upload Contract",
		description: "Drag and drop your PDF or image.",
	},
	{
		icon: <IconSearch />,
		title: "AI Analysis",
		description: "Our AI extracts and analyzes key contract elements.",
	},
	{
		icon: <IconDownload />,
		title: "Get Results",
		description: "Download comprehensive insights and summaries.",
	},
];

function SaaSButton({ children, className, ...props }) {
	return (
		<button
			className={`rounded-xl font-semibold shadow-lg px-8 py-4 text-lg transition-all duration-200 ${className}`}
			style={{
				background: "linear-gradient(90deg,#2563eb 0%,#06b6d4 100%)",
				color: "#fff",
			}}
			{...props}
		>
			{children}
		</button>
	);
}

export default function Home() {
	useEffect(() => {
		const btn = document.createElement('button');
		btn.id = 'floating-chatbot-btn';
		btn.title = 'Open Chatbot';
		btn.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#2563eb"/><path d="M10 22V10h12v12H10zm2-2h8V12h-8v8zm1-7h6v6h-6v-6z" fill="#fff"/></svg>`;
		btn.style.position = 'fixed';
		btn.style.bottom = '32px';
		btn.style.right = '32px';
		btn.style.width = '64px';
		btn.style.height = '64px';
		btn.style.borderRadius = '50%';
		btn.style.background = 'linear-gradient(135deg,#2563eb 0%,#06b6d4 100%)';
		btn.style.boxShadow = '0 4px 24px 0 rgba(37,99,235,0.15)';
		btn.style.display = 'flex';
		btn.style.alignItems = 'center';
		btn.style.justifyContent = 'center';
		btn.style.zIndex = '1000';
		btn.style.border = 'none';
		btn.style.cursor = 'pointer';
		btn.style.transition = 'box-shadow 0.2s';
		btn.onmouseenter = () => btn.style.boxShadow = '0 8px 32px 0 rgba(37,99,235,0.25)';
		btn.onmouseleave = () => btn.style.boxShadow = '0 4px 24px 0 rgba(37,99,235,0.15)';
		btn.onclick = () => window.open('/chatbot', '_blank');
		if (!document.getElementById('floating-chatbot-btn')) {
			document.body.appendChild(btn);
		}
		return () => {
			const b = document.getElementById('floating-chatbot-btn');
			if (b) b.remove();
		};
	}, []);
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
			<Navbar />
			{/* Hero Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-700/80 to-cyan-500/80 opacity-90"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
					<div className="text-center animate-fade-in">
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
							Legal AI SaaS Platform
							<br />
							<span className="text-accent-300">Smart Contract Analyzer</span>
						</h1>
						<p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
							Upload your contract. Get instant summaries, key term extraction, and
							legal insights powered by advanced AI technology.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/upload">
								<SaaSButton>Get Started Free</SaaSButton>
							</Link>
							<Link href="/docs">
								<SaaSButton
									style={{
										background: "#fff",
										color: "#2563eb",
										border: "1px solid #2563eb",
									}}
								>
									View API Docs
								</SaaSButton>
							</Link>
						</div>
					</div>
					{/* Hero Illustration */}
					<div className="mt-16 relative">
						<div className="rounded-3xl p-8 mx-auto max-w-4xl bg-white/80 dark:bg-slate-800/80 shadow-xl">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="space-y-4">
									<div className="h-4 bg-gradient-to-r from-primary-300 to-primary-400 rounded w-3/4"></div>
									<div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"></div>
									<div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6"></div>
									<div className="h-8 bg-gradient-to-r from-accent-300 to-accent-400 rounded w-2/3"></div>
								</div>
								<div className="flex items-center justify-center">
									<div className="relative">
										<div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-2xl flex items-center justify-center">
											<IconBrain />
										</div>
										<div className="absolute -top-2 -right-2">
											<IconCheck />
										</div>
									</div>
								</div>
								<div className="space-y-4">
									<div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
										<div className="text-sm font-semibold text-green-800 dark:text-green-200">
											Key Terms Extracted
										</div>
										<div className="text-xs text-green-600 dark:text-green-400 mt-1">
											Party A: Acme Corp
										</div>
										<div className="text-xs text-green-600 dark:text-green-400">
											Value: $50,000
										</div>
									</div>
									<div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl">
										<div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
											Risk Detected
										</div>
										<div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
											Review liability clause
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-24 bg-white/50 dark:bg-slate-900/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
							Powerful AI Analysis Features
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
							Our advanced AI technology transforms complex legal documents into
							clear, actionable insights.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="hover:scale-105 transition-transform duration-300 bg-white/80 dark:bg-slate-800/80 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700"
							>
								<div className="p-6 text-center">
									<div className="mb-4 flex justify-center">{feature.icon}</div>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
										{feature.title}
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										{feature.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
							How It Works
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
							Get started with contract analysis in three simple steps.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{steps.map((step, index) => (
							<div key={index} className="relative">
								<div className="text-center">
									<div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
										{step.icon}
									</div>
									<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
										{step.title}
									</h3>
									<p className="text-gray-600 dark:text-gray-400">
										{step.description}
									</p>
								</div>
								{index < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-accent-300 transform -translate-x-8"></div>
								)}
							</div>
						))}
					</div>

					<div className="text-center mt-12">
						<Link href="/upload">
							<SaaSButton>Start Analyzing Now</SaaSButton>
						</Link>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 bg-gradient-to-br from-blue-700 to-cyan-500">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
						Ready to revolutionize your contract analysis?
					</h2>
					<p className="text-xl text-blue-100 mb-8">
						Join thousands of legal professionals who trust our AI-powered platform.
					</p>
					<Link href="/upload">
						<SaaSButton>Get Started Today</SaaSButton>
					</Link>
				</div>
			</section>
		</div>
	);
}
