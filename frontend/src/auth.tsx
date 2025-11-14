import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextValue {
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('meme-marketplace-token');
  });

  const setToken = (value: string | null) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem('meme-marketplace-token', value);
    } else {
      localStorage.removeItem('meme-marketplace-token');
    }
  };

  useEffect(() => {
    // token is already synced via setToken; this ensures state is consistent on mount
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getCognitoLoginUrl(): string {
  const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
  const domain = import.meta.env.VITE_COGNITO_DOMAIN || '';
  const fallbackRedirect =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:5173/auth/callback';
  const redirectUri = encodeURIComponent(
    import.meta.env.VITE_COGNITO_REDIRECT_URI || fallbackRedirect
  );

  // Hosted UI login (sign-in). The page also includes a sign-up link.
  return `https://${domain}.auth.${region}.amazoncognito.com/login?client_id=${clientId}&response_type=token&scope=openid+email+profile&redirect_uri=${redirectUri}`;
}

export function getCognitoSignupUrl(): string {
  const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
  const domain = import.meta.env.VITE_COGNITO_DOMAIN || '';
  const fallbackRedirect =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:5173/auth/callback';
  const redirectUri = encodeURIComponent(
    import.meta.env.VITE_COGNITO_REDIRECT_URI || fallbackRedirect
  );

  // Same hosted UI, but with screen_hint=signup so the sign-up form is shown first.
  return `https://${domain}.auth.${region}.amazoncognito.com/login?client_id=${clientId}&response_type=token&scope=openid+email+profile&redirect_uri=${redirectUri}&screen_hint=signup`;
}
