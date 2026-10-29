import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();

import { createContext, useState, useContext } from 'react';

import { useMemo } from 'react'
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [isLogedIn, setIsLogedIn] = useState(false);

    const [isLoading, setIsloading] = useState(true);

    const value = useMemo(() => ({
        isLogedIn,
        setIsLogedIn,
        isLoading,
        setIsloading,
    }), [isLogedIn, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    <GoogleOAuthProvider clientId="711670289986-5fuuf4adudbcugr0k6u9ckq10feabbvv.apps.googleusercontent.com">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter> 
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
