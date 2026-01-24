
import React, { useState, useEffect } from "react";
import PasswordResetModal from "./PasswordReset";
import { useSignUp, useClerk } from "@clerk/clerk-react";
import { useAuth } from "../context/AuthContext";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";



// role is now passed as a prop, not managed in modal
export default function AuthModal({ onClose, role }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [signupStep, setSignupStep] = useState(0); // 0: form, 1: verify email, 2: complete
  const [signupVerificationCode, setSignupVerificationCode] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(0); // 0: not open, 1: enter email, 2: check email
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  const [forgotError, setForgotError] = useState("");
  const [loading, setLoading] = useState(false);

  // If role prop changes, reset signup/login forms (optional, for safety)
  useEffect(() => {
    setLoginData({ email: "", password: "" });
    setSignupData({ email: "", password: "", confirmPassword: "" });
    setSignupStep(0);
    setSignupVerificationCode("");
    setForgotEmail("");
    setForgotStep(0);
    setLoginErrors({});
    setSignupErrors({});
    setForgotError("");
  }, [role]);

  const { signUp } = useSignUp();
  const { signOut } = useClerk();


  // Login handler using Clerk (robust error handling and friendly messages)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginErrors({});
    try {
      if (!loginData.email || !loginData.password) {
        setLoginErrors({ general: "Please fill all fields." });
        setLoading(false);
        return;
      }
      // Use backend login for all users
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });

      // Safely parse response (protect against non-JSON responses when server is down)
      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || res.statusText || "Invalid credentials";
        setLoginErrors({ general: msg });
        setLoading(false);
        return;
      }

      // Successful login
      const user = data?.user || { email: loginData.email, role: data?.role || role };
      login(user);
      toast.success("Welcome!");
      setLoginErrors({});
      onClose && onClose();
    } catch (err) {
      // Handle network errors separately to show a friendly message
      const lower = (err?.message || "").toLowerCase();
      const friendly = lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error')
        ? 'Could not reach server — check your network and try again.'
        : err.errors?.[0]?.message || err.message || 'Login failed.';
      setLoginErrors({ general: friendly });
    } finally {
      setLoading(false);
    }
  };

  // Signup handler using Clerk
  // Step 1: Request verification code for email
  const handleSignupRequestVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSignupErrors({});
    if (!signupData.email) {
      setSignupErrors({ general: "Please enter your email." });
      setLoading(false);
      return;
    }
    try {
      // Always sign out before starting a new signUp to avoid 'session already exists' error
      if (typeof signOut === 'function') await signOut();
      if (signUp && signUp.reset) signUp.reset();
      await signUp.create({ emailAddress: signupData.email });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSignupStep(1);
    } catch (err) {
      // If error is 'session_exists', force signOut and reset, then retry once
      if (err.errors && err.errors[0]?.code === 'session_exists') {
        try {
          if (typeof signOut === 'function') await signOut();
          if (signUp && signUp.reset) signUp.reset();
          await signUp.create({ emailAddress: signupData.email });
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setSignupStep(1);
          setLoading(false);
          return;
        } catch (err2) {
          setSignupErrors({ general: err2.errors?.[0]?.message || err2.message || "Could not send verification code." });
          setLoading(false);
          return;
        }
      }
      setSignupErrors({ general: err.errors?.[0]?.message || err.message || "Could not send verification code." });
    }
    setLoading(false);
  }

  // Step 2: Verify code and complete signup
  const handleSignupVerifyAndComplete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSignupErrors({});
    if (!signupVerificationCode) {
      setSignupErrors({ general: "Please enter the verification code sent to your email." });
      setLoading(false);
      return;
    }
    if (!signupData.password || !signupData.confirmPassword) {
      setSignupErrors({ general: "Please fill all fields." });
      setLoading(false);
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setSignupErrors({ confirmPassword: "Passwords do not match." });
      setLoading(false);
      return;
    }
    try {
      // Complete verification and update user info
      let verified = false;
      try {
        const verifyRes = await signUp.attemptEmailAddressVerification({ code: signupVerificationCode });
        if (verifyRes.status === "complete" || verifyRes.verifications?.emailAddress?.status === 'verified') {
          verified = true;
        }
      } catch (err) {
        // If already verified, Clerk throws an error with code 'verification_already_verified'
        if (err.errors && err.errors[0]?.code === 'verification_already_verified') {
          verified = true;
        } else {
          setSignupErrors({ general: err.errors?.[0]?.message || err.message || "Verification failed." });
          setLoading(false);
          return;
        }
      }
      if (verified) {
        await signUp.update({ password: signupData.password });
        // Create user in backend database with role
        try {
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: signupData.email, role, password: signupData.password })
          });
        } catch (err) {
          // Optionally show a warning, but don't block login
          toast.warn("Signup succeeded, but failed to save user in backend.");
        }
        setSignupErrors({});
        // Sign out to clear any session before switching to login
        if (typeof signOut === 'function') await signOut();
  setIsLogin(true);
  setLoginData({ email: signupData.email, password: "" });
  toast.success("Signup successful! Please log in.");
  setSignupStep(0);
  setSignupVerificationCode("");
  // Do NOT close modal; show login form with email prefilled
      } else {
        setSignupErrors({ general: "Invalid or expired code. Please try again." });
      }
    } catch (err) {
      setSignupErrors({ general: err.errors?.[0]?.message || err.message || "Verification failed." });
    }
    setLoading(false);
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-xs sm:max-w-md relative mx-2 my-8 shadow-xl flex flex-col items-center">
        <button
          className={`absolute top-2 right-2 text-xl text-gray-600 hover:text-black ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => { if (!loading) onClose && onClose(); }}
          disabled={loading}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
          {forgotStep ? "Forgot Password" : isLogin ? "Login" : "Sign Up"}
        </h2>
        {forgotError && <p className="text-red-600 mb-2">{forgotError}</p>}

        {forgotStep === 1 && showPasswordReset ? (
          <div>
            <PasswordResetModal
              showModal={showPasswordReset}
              setShowModal={setShowPasswordReset}
              user={{ email: forgotEmail, emailVerified: true }}
              // When password reset is successful, switch to login modal
              onSuccess={() => {
                setForgotStep(0);
                setForgotEmail("");
                setForgotError("");
                setShowPasswordReset(false);
                setIsLogin(true);
                toast.success("Password reset successful! Please log in.");
              }}
            />
            <button
              type="button"
              className="w-full mt-2 text-gray-600 underline"
              onClick={() => { setForgotStep(0); setForgotEmail(""); setForgotError(""); setShowPasswordReset(false); setIsLogin(true); }}
            >
              Back to Login
            </button>
          </div>
        ) : forgotStep === 2 ? (
          <div className="w-full text-center">
            <p className="text-green-700 mb-4">Check your email for a password reset link.</p>
            <button
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 text-base sm:text-sm"
              onClick={() => { setForgotStep(0); setForgotEmail(""); setForgotError(""); setIsLogin(true); }}
            >
              Back to Login
            </button>
          </div>
        ) : isLogin ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4 w-full">
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={e => { setLoginData({ ...loginData, email: e.target.value }); setLoginErrors({}); }}
                className="w-full border p-2 rounded text-sm"
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={e => { setLoginData({ ...loginData, password: e.target.value }); setLoginErrors({}); }}
                className="w-full border p-2 rounded text-sm"
                autoComplete="current-password"
              />
              <div className="w-full flex justify-end text-sm mt-1">
                <button type="button" onClick={() => { setForgotStep(1); setShowPasswordReset(true); }} className="text-blue-600 underline">Forgot password?</button>
              </div>
              {/* Role selection removed: role is passed as prop */}
              {loginErrors.general && <p className="text-red-600 text-sm mb-2">{loginErrors.general}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 text-base sm:text-sm"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="my-2 w-full flex flex-col items-center">
              
              
              <button
                type="button"
                className="w-full text-blue-600 underline text-sm mt-2"
                onClick={() => { setForgotStep(1); setForgotEmail(""); setForgotError(""); setShowPasswordReset(true); }}
              >
                Forgot password?
              </button>
            </div>
          </>
        ) : (
          <>
            {signupStep === 0 && (
              <form onSubmit={handleSignupRequestVerification} className="space-y-4 w-full">
                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                  autoComplete="username"
                />
                {/* Role selection removed: role is passed as prop */}
                {signupErrors.general && <p className="text-red-600 text-sm mb-2">{signupErrors.general}</p>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 text-base sm:text-sm"
                  disabled={loading}
                >
                  {loading ? "Sending code..." : "Send Verification Code"}
                </button>
              </form>
            )}
            {signupStep === 1 && (
              <form onSubmit={handleSignupVerifyAndComplete} className="space-y-4 w-full">
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={signupVerificationCode}
                  onChange={e => setSignupVerificationCode(e.target.value)}
                  className="w-full border p-2 rounded text-sm"
                  autoComplete="one-time-code"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                  autoComplete="new-password"
                />
                {/* Role selection removed: role is passed as prop */}
                {signupErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">{signupErrors.confirmPassword}</p>}
                {signupErrors.general && <p className="text-red-600 text-sm mb-2">{signupErrors.general}</p>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200 text-base sm:text-sm"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Complete Signup"}
                </button>
              </form>
            )}
            
          </>
        )}
        <p className="text-center mt-4 text-sm">
          {forgotStep ? null : isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setIsLogin(false); setLoginErrors({}); }}
                className="text-blue-600 underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setIsLogin(true); setSignupErrors({}); }}
                className="text-blue-600 underline"
              >
                Login
              </button>
            </>
          )}
        </p>
        <div className="text-center mt-2">
          <button
            onClick={() => { if (!loading) onClose && onClose(); }}
            className={`text-gray-500 hover:text-black text-sm underline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/*
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/