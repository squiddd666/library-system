import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import ForgotPassword from './ForgotPassword';
import Dashboard from './Dashboard';
import StudentDashboard from './StudentDashboard';
import StudentHome from './pages/student/StudentHome';
import Books from './pages/student/Books';
import Borrowed from './pages/student/Borrowed';
import Returned from './pages/student/Returned';
import Profile from './pages/student/Profile';
import Settings from './pages/student/Settings';
import { getUserRole, isAuthenticated } from './auth';
import './index.css';

const StudentOnlyRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (getUserRole() === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<Login />} 
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route 
          path="/admin-dashboard"
          element={isAuthenticated() ? (getUserRole() === 'admin' ? <Dashboard /> : <Navigate to="/student-dashboard" replace />) : <Navigate to="/login" replace />}
        />
        <Route path="/dashboard" element={<Navigate to="/admin-dashboard" replace />} />
        <Route 
          path="/student-dashboard" 
          element={getUserRole() === 'admin' ? <Navigate to="/admin-dashboard" replace /> : <StudentDashboard />}
        >
          <Route index element={<StudentHome />} />
          <Route path="books" element={<Books />} />
          <Route path="borrowed" element={<StudentOnlyRoute><Borrowed /></StudentOnlyRoute>} />
          <Route path="returned" element={<StudentOnlyRoute><Returned /></StudentOnlyRoute>} />
          <Route path="profile" element={<StudentOnlyRoute><Profile /></StudentOnlyRoute>} />
          <Route path="settings" element={<StudentOnlyRoute><Settings /></StudentOnlyRoute>} />
        </Route>
        <Route 
          path="/" 
          element={<Navigate to="/student-dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
