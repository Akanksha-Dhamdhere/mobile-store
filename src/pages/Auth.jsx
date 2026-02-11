import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", mobile: "" });
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (isLogin) {
      // Login
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, password: form.password, role: 'user' })
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            setMessage(data.message || 'Login failed');
            setPopupType('error');
            setShowPopup(true);
            return;
          }
          setPopupType('success');
          setMessage('Login Successful!');
          setShowPopup(true);
          setTimeout(() => {
            navigate("/");
          }, 1500);
        })
        .catch(() => {
          setMessage('Login failed');
          setPopupType('error');
          setShowPopup(true);
        });
    } else {
      // Signup
      if (form.password !== form.confirmPassword) {
        setMessage('Passwords do not match');
        setPopupType('error');
        setShowPopup(true);
        return;
      }

      fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password, 
          mobile: form.mobile 
        })
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            setMessage(data.message || 'Signup failed');
            setPopupType('error');
            setShowPopup(true);
            return;
          }
          setPopupType('success');
          setMessage('Signup Successful! Redirecting...');
          setShowPopup(true);
          setTimeout(() => {
            navigate("/");
          }, 1500);
        })
        .catch(() => {
          setMessage('Signup failed');
          setPopupType('error');
          setShowPopup(true);
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">{isLogin ? "Login" : "Sign Up"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border px-4 py-2 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full border px-4 py-2 rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          {!isLogin && (
            <input
              type="tel"
              placeholder="Mobile (Optional)"
              className="w-full border px-4 py-2 rounded"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            className="w-full border px-4 py-2 rounded"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full border px-4 py-2 rounded"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => { 
              setIsLogin(!isLogin); 
              setMessage(""); 
              setForm({ name: "", email: "", password: "", confirmPassword: "", mobile: "" });
            }} 
            className="text-blue-500 underline"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </p>

        {message && (
          <p className={`mt-2 text-sm text-center ${popupType === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>

      {showPopup && (
        <div className={`fixed top-5 ${popupType === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-2 rounded shadow-lg animate-bounce`}>
          {popupType === 'error' ? 'Error' : 'Success'}
        </div>
      )}
    </div>
  );
};;

export default Auth;
