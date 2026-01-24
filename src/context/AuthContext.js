import React, { createContext, useContext, useState, useEffect } from "react";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	// On mount, hydrate user from backend if token exists
	useEffect(() => {
		async function hydrateUser() {
			try {
				const res = await fetch("/api/auth/me", { credentials: "include" });
				if (res.ok) {
					const data = await res.json();
					if (data && data.user) {
						setUser(data.user);
						// Keep localStorage aligned with admin role
						if (data.user.role === 'admin') localStorage.setItem('isAdmin', 'true');
						else localStorage.removeItem('isAdmin');
					}
				}
			} catch {}
		}
		hydrateUser();
	}, []);

	// Derived helper
	const isAdmin = !!(user && user.role === 'admin');

	const login = async (userData) => {
		// Prefer hitting /api/auth/me to get the current authenticated user (after backend login sets cookie)
		try {
			const meRes = await fetch('/api/auth/me', { credentials: 'include' });
			if (meRes.ok) {
				const meData = await meRes.json();
				if (meData && meData.user) {
					setUser(meData.user);
					if (meData.user.role === 'admin') localStorage.setItem('isAdmin', 'true');
					else localStorage.removeItem('isAdmin');
					return;
				}
			}
			// Fallback: try by-email (useful for Clerk/local logins)
			const res = await fetch(`/api/users/by-email/${encodeURIComponent(userData.email)}`);
			if (res.ok) {
				const data = await res.json();
				if (data && data.data) {
					setUser(data.data);
					if (data.data.role === 'admin') localStorage.setItem('isAdmin', 'true');
					else localStorage.removeItem('isAdmin');
					return;
				}
			}
		} catch (err) {
			// Ignore; if both calls fail we'll set the provided userData
		}
		setUser(userData);
	};

	const logout = async () => {
		setUser(null);
		localStorage.removeItem('isAdmin');
		try {
			await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		} catch {}
	};

	return (
		<AuthContext.Provider value={{ user, isAdmin, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
