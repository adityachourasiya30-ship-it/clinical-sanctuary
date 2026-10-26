import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { MedicalProfilePage } from './pages/MedicalProfilePage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { TrackIncidentPage } from './pages/TrackIncidentPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { ResponderPage } from './pages/ResponderPage';
import { DispatcherPage } from './pages/DispatcherPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--teal-primary)',
          fontSize: '0.9rem',
          fontWeight: '700',
        }}
      >
        Initializing Secure Emergency Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Public Emergency Tracking Route */}
          <Route path="/track/:incidentCode" element={<TrackIncidentPage />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* Main Citizen Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/hospitals"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <HospitalsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ContactsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/medical-profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MedicalProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <IncidentHistoryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Operational Role Routes */}
          <Route
            path="/responder"
            element={
              <ProtectedRoute allowedRoles={['RESPONDER', 'ADMIN']}>
                <MainLayout>
                  <ResponderPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dispatch"
            element={
              <ProtectedRoute allowedRoles={['DISPATCHER', 'ADMIN']}>
                <MainLayout>
                  <DispatcherPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
