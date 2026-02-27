import React, { useState } from 'react';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>⚙️ Settings</h2>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-section">
        <h3>Notification Preferences</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Email Notifications</p>
              <p className="setting-description">Receive email updates about your borrowed books</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Push Notifications</p>
              <p className="setting-description">Receive push notifications on your device</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Weekly Summary</p>
              <p className="setting-description">Receive a weekly summary of your library activity</p>
            </div>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={notifications.weekly}
                onChange={() => handleNotificationChange('weekly')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Account</h3>
        <div className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Change Password</p>
              <p className="setting-description">Update your account password</p>
            </div>
            <button className="action-btn">Change</button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Clear History</p>
              <p className="setting-description">Clear your browsing and activity history</p>
            </div>
            <button className="action-btn danger">Clear</button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-page {
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
        .settings-section {
          margin-bottom: 30px;
        }
        .settings-section h3 {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 15px;
        }
        .settings-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .setting-item:last-child {
          border-bottom: none;
        }
        .setting-info {
          flex: 1;
        }
        .setting-label {
          color: white;
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .setting-description {
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }
        .toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
          flex-shrink: 0;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.3s;
          border-radius: 26px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        .toggle input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        .action-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .action-btn:hover {
          transform: scale(1.05);
        }
        .action-btn.danger {
          background: linear-gradient(135deg, #ea4335 0%, #d33426 100%);
        }
      `}</style>
    </div>
  );
};

export default Settings;
