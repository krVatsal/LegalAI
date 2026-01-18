"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.push('/auth/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      // Set token as cookie for server auth
      document.cookie = `token=${token}; path=/;`;
      // Fetch user data
      fetch('https://legalai-backend-atdugxa9h3g0dbbg.centralindia-01.azurewebsites.net/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch user data');
          }
          return res.json();
        })
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/auth/verify');
          } else {
            throw new Error('Invalid user data received');
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          localStorage.removeItem('token'); // Clear invalid token
          router.push('/auth/login?error=' + encodeURIComponent(err.message));
        });
    } else {
      router.push('/auth/login?error=' + encodeURIComponent('No token received'));
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-white">Completing authentication...</p>
      </div>
    </div>
  );
}