import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Dashboard from './Dashboard';
import StudentDashboard from './StudentDashboard';
import StudentHome from './pages/student/StudentHome';
import Books from './pages/student/Books';
import Borrowed from './pages/student/Borrowed';
import Returned from './pages/student/Returned';
import Profile from './pages/student/Profile';
import Settings from './pages/student/Settings';
import './index.css';

function App() {
  // Check if user is logged in
  const isAuthenticated = () => {
    return localStorage.getItem('user') !== null;
  };

  // Get user role
  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'student';
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated() ? <Navigate to="/student-dashboard" /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/student-dashboard" 
          element={isAuthenticated() ? <StudentDashboard /> : <Navigate to="/login" />}
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
          element={<Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
