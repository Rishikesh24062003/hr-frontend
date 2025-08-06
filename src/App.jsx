import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import Jobs from './pages/Jobs';
import Rankings from './pages/Rankings';
import Analytics from './pages/Analytics';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          user ? (
            <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="resumes" element={<Resumes />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="rankings" element={<Rankings />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
