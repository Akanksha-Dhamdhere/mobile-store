import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { devWarn, devError } from "../utils/logger";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Inputs are now editable
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Call backend login endpoint with credentials to ensure cookies are sent
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Critical: tells browser to send cookies
        body: JSON.stringify({ email: form.username, password: form.password, role: "admin" })
      });
      
      if (!res.ok) {
        const data = await res.json();
        // Show correct error for role
        if (data.message && data.message.includes('Only user can login here.')) {
          setError('Only admin can login here.');
        } else {
          setError(data.message || "Invalid credentials");
        }
        return;
      }
      
      // Success: backend sets cookie and returns the user
      const data = await res.json();
      if (data && data.user && data.user.role === 'admin') {
        // Mark frontend as admin (used by route guard)
        localStorage.setItem('isAdmin', 'true');
        
        // Verify the cookie was set by calling /api/auth/me
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const meData = await meRes.json();
          // Update Auth context user with verified data from backend
          try { 
            await login(meData.user || { email: form.username, password: form.password }); 
          } catch (e) {
            devWarn('Failed to update auth context:', e);
          }
        }
        
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 100);
      } else {
        setError('Only admin can login here.');
      }
    } catch (err) {
      devError('Login error:', err);
      setError("Login failed. Please try again.");
    }
  };


  return (
  <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'linear-gradient(rgba(30,30,30,0.7), rgba(30,30,30,0.7)), url("' + require('../assets/admin-bg.jpg') + '") center/cover no-repeat' }}>
      <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
      <form className="bg-white bg-opacity-90 p-10 rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col items-center" onSubmit={handleLogin} style={{ backdropFilter: 'blur(4px)' }}>
        <h2 className="text-3xl font-extrabold mb-8 text-purple-700 text-center tracking-wide drop-shadow">Admin Login</h2>
        <input
          type="text"
          name="username"
          placeholder="Admin Email"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-6 px-4 py-3 border-2 border-purple-200 rounded-lg bg-gray-50 focus:border-purple-500 focus:outline-none text-lg"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-6 px-4 py-3 border-2 border-purple-200 rounded-lg bg-gray-50 focus:border-purple-500 focus:outline-none text-lg"
          required
        />
        {error && <div className="text-red-500 mb-6 text-center font-semibold text-base">{error}</div>}
        <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-3 rounded-lg font-bold text-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition">Login</button>
      </form>
    </div>
  );
}
