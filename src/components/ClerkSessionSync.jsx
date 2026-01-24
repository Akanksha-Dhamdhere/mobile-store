
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useClerk } from "@clerk/clerk-react";
import { devLog, devError } from "../utils/logger";


export default function ClerkSessionSync() {
  const auth = useAuth() || {};
  const login = auth.login;
  const { user } = useClerk();
  const hasSyncedRef = useRef(false);


  useEffect(() => {
    // Only run once per session
    if (!user || hasSyncedRef.current) return;
    let email = null;
    let name = null;
    
    try {
      if (user?.primaryEmailAddress?.emailAddress) {
        email = user.primaryEmailAddress.emailAddress;
      } else if (Array.isArray(user?.emailAddresses) && user.emailAddresses.length > 0) {
        email = user.emailAddresses[0]?.emailAddress;
      }
      if (user?.fullName) {
        name = user.fullName;
      }
    } catch (err) {
      devError('[ClerkSessionSync] Error extracting Clerk user data:', err);
      return;
    }
    
    if (!email) return;

    // Prevent duplicate upserts
    hasSyncedRef.current = true;

    // Check if user exists in backend first
    (async () => {
      try {
        devLog("[ClerkSessionSync] Checking/Upserting user in backend:", { email, name });
        
        const checkRes = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`);
        let exists = false;
        
        try {
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData && (checkData.email || checkData.data?.email)) {
              exists = true;
            }
          }
        } catch (parseErr) {
          devError('[ClerkSessionSync] Error parsing check response:', parseErr);
        }
        
        if (!exists) {
          // Upsert user in backend
          const upsertRes = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, role: "user" })
          });
          const upsertData = await upsertRes.json().catch(() => ({}));
          if (!upsertRes.ok) {
            devError("[ClerkSessionSync] Backend upsert error:", upsertData);
          } else {
            devLog("[ClerkSessionSync] User upserted in backend:", upsertData);
          }
        } else {
          devLog("[ClerkSessionSync] User already exists in backend:", email);
        }

        // Attempt to create a backend session (sets JWT cookie) so routes using cookie-based auth work
        try {
          const loginRes = await fetch('/api/auth/login/clerk', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (loginRes.ok) {
            devLog('[ClerkSessionSync] Clerk login succeeded, hydrating auth.');
            // Re-hydrate auth context from server (pulls user via cookie)
            if (typeof login === 'function') {
              login({ email, role: 'user' });
            }
          } else {
            const errData = await loginRes.json().catch(() => ({}));
            devError('[ClerkSessionSync] Clerk login failed:', errData);
            // Fallback to local login state
            if (typeof login === 'function') {
              login({ email, role: 'user' });
            }
          }
        } catch (err) {
          devError('[ClerkSessionSync] Clerk login network error:', err);
          if (typeof login === 'function') {
            login({ email, role: 'user' });
          }
        }
      } catch (err) {
        devError("[ClerkSessionSync] Error syncing user to backend:", err);
      }
    })();
  }, [user, login]);

  return null;
}
