import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { ReviewProvider } from './context/ReviewContext';
import { AuthProvider } from './context/AuthContext';

const clerkFrontendApi = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_dmFzdC1zdGluZ3JheS03Ny5jbGVyay5hY2NvdW50cy5kZXYk"; // fallback test key for local dev

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <ClerkProvider publishableKey={clerkFrontendApi}>
      <AuthProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <ReviewProvider>
              <App />
            </ReviewProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ClerkProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();