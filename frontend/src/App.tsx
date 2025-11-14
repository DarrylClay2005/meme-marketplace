import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MemeDetailPage } from './pages/MemeDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { getCognitoLoginUrl, useAuth } from './auth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const { token, setToken } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Meme Marketplace</span>
          <nav className="flex gap-3 text-sm text-slate-300">
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/upload">Upload</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <span className="text-xs text-slate-300">Logged in</span>
              <button
                onClick={() => setToken(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href={getCognitoLoginUrl()}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs"
            >
              Login with Cognito
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/memes/:id" element={<MemeDetailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};
