
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSelection } from './hooks/useSelection'
import { AuthForm } from './components/AuthForm'
import { SelectionPage } from './components/SelectionPage'
import { Dashboard } from './components/Dashboard'
import { StudentForm } from './components/StudentForm'

function App() {
  const { user, loading } = useAuth();
  const selection = useSelection();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Build dashboard path if selection exists
  let dashboardPath = null;
  if (selection.hasSelection()) {
    const { departmentCode, yearValue, semNumber } = selection;
    if (departmentCode && yearValue && semNumber) {
      dashboardPath = `/dashboard/${departmentCode}/${yearValue}/${semNumber}`;
    }
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            selection.hasSelection() && dashboardPath
              ? <Navigate to={dashboardPath} replace />
              : <Navigate to="/select" replace />
          }
        />
        <Route path="/select" element={<SelectionPage />} />
        <Route path="/dashboard/:dept/:year/:sem" element={<Dashboard />} />
        <Route path="/students/add" element={<StudentForm />} />
        <Route path="/students/:id" element={<StudentForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App