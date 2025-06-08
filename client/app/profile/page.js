"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-lg">You are not logged in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full max-w-md">
        <p className="mb-2"><span className="font-semibold">Name:</span> {user.name || "N/A"}</p>
        <p className="mb-2"><span className="font-semibold">Email:</span> {user.email || "N/A"}</p>
      </div>
    </div>
  );
}
