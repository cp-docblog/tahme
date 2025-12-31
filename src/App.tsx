import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Clients } from './pages/Clients';
import { NewClient } from './pages/NewClient';
import { Campaigns } from './pages/Campaigns';
import { SetPassword } from './pages/SetPassword';
import './lib/i18n';
import './styles/globals.css';
import './styles/animations.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/auth/callback" element={<SetPassword />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/users" element={
                <ProtectedRoute requireRole="admin">
                  <MainLayout>
                    <Users />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/clients" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Clients />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/clients/new" element={
                <ProtectedRoute requireRole="admin">
                  <MainLayout>
                    <NewClient />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/clients/edit/:clientId" element={
                <ProtectedRoute requireRole="admin">
                  <MainLayout>
                    <NewClient />
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Campaigns />
                  </MainLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
