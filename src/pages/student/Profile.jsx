import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="no-results">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>👤 My Profile</h2>
        <p>View and manage your account information</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <span>{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
        </div>
        <div className="profile-details">
          <div className="profile-field">
            <label>Full Name</label>
            <p>{user.first_name} {user.last_name}</p>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <p>{user.email}</p>
          </div>
          <div className="profile-field">
            <label>Role</label>
            <p>{user.role || 'Student'}</p>
          </div>
          <div className="profile-field">
            <label>Student ID</label>
            <p>{user.id || 'N/A'}</p>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          padding: 0;
        }
        .page-header {
          margin-bottom: 30px;
        }
        .page-header h2 {
          font-size: 28px;
          margin-bottom: 8px;
          color: white;
        }
        .page-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
        .profile-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 40px;
          align-items: flex-start;
        }
        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: 600;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          flex-shrink: 0;
        }
        .profile-details {
          flex: 1;
          display: grid;
          gap: 20px;
        }
        .profile-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-field label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .profile-field p {
          color: white;
          font-size: 16px;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .profile-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
