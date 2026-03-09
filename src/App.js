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
          element={isAuthenticated() ? (getUserRole() !== 'admin' ? <StudentDashboard /> : <Navigate to="/admin-dashboard" replace />) : <Navigate to="/login" replace />}
        >
          <Route index element={<StudentHome />} />
          <Route path="books" element={<Books />} />
          <Route path="borrowed" element={<Borrowed />} />
          <Route path="returned" element={<Returned />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
