import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  getActivityData,
  getBooksData,
  getBorrowedData,
  getReturnedData
} from './studentStorage';

const StudentHome = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalBooks: 0,
    borrowed: 0,
    returned: 0,
    overdue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Mock data for announcements
  const announcements = [
    { id: 1, title: "Library Holiday Closure", date: "2024-01-20", content: "The library will be closed on Monday for the holiday." },
    { id: 2, title: "New Book Collection", date: "2024-01-18", content: "Check out our new collection of programming books!" },
    { id: 3, title: "Extended Borrowing Hours", date: "2024-01-15", content: "Library hours extended during finals week." }
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    if (userData.email) {
      fetchStudentData(userData.email);
    } else {
      const localBooks = getBooksData();
      const localBorrowed = getBorrowedData();
      const localReturned = getReturnedData();
      setSummaryData({
        totalBooks: localBooks.length,
        borrowed: localBorrowed.length,
        returned: localReturned.length,
        overdue: localBorrowed.filter((item) => item.status === 'overdue').length
      });
      setRecentActivity(getActivityData());
      setLoading(false);
    }
  }, []);

  const fetchStudentData = async (email) => {
    const localBooks = getBooksData();
    const localBorrowed = getBorrowedData();
    const localReturned = getReturnedData();
    const localActivity = getActivityData();

    try {
      setLoading(true);
      setError(null);

      const [summaryResult, activityResult] = await Promise.all([
        api.getStudentSummary(email),
        api.getRecentActivity(email)
      ]);

      const apiSummary = summaryResult.success ? summaryResult.data : null;
      const nextSummary = {
        totalBooks: apiSummary?.totalBooks ?? localBooks.length,
        borrowed: localBorrowed.length,
        returned: localReturned.length,
        overdue: localBorrowed.filter((item) => item.status === 'overdue').length
      };
      setSummaryData(nextSummary);

      if (localActivity.length > 0) {
        setRecentActivity(localActivity);
      } else if (activityResult.success) {
        setRecentActivity(activityResult.data);
      } else {
        setRecentActivity([]);
      }

      if (!summaryResult.success) {
        console.error('Summary error:', summaryResult.message);
      }
      if (!activityResult.success && localActivity.length === 0) {
        console.error('Activity error:', activityResult.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setSummaryData({
        totalBooks: localBooks.length,
        borrowed: localBorrowed.length,
        returned: localReturned.length,
        overdue: localBorrowed.filter((item) => item.status === 'overdue').length
      });
      setRecentActivity(localActivity);
      setError('Failed to load server data. Showing local data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredActivity = recentActivity.filter(item =>
    item.book_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="student-home">
      {/* Welcome Card */}
      <div className="welcome-card">
        <div className="welcome-info">
          <h2>Welcome back, {user.first_name} {user.last_name}!</h2>
          <p>Course: BS Computer Science | Section: 3-A</p>
          <p className="user-email">{user.email}</p>
        </div>
        <div className="welcome-avatar">
          <span>{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
        </div>
      </div>

      {/* Search */}
      <div className="search-container" style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search activity..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📚</div>
            <div className="card-info">
              <h3>...</h3>
              <p>Total Books</p>
            </div>
          </div>
          <div className="summary-card borrowed">
            <div className="card-icon">📖</div>
            <div className="card-info">
              <h3>...</h3>
              <p>Borrowed</p>
            </div>
          </div>
          <div className="summary-card returned">
            <div className="card-icon">✅</div>
            <div className="card-info">
              <h3>...</h3>
              <p>Returned</p>
            </div>
          </div>
          <div className="summary-card overdue">
            <div className="card-icon">⚠️</div>
            <div className="card-info">
              <h3>...</h3>
              <p>Overdue</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📚</div>
            <div className="card-info">
              <h3>{summaryData.totalBooks}</h3>
              <p>Total Books</p>
            </div>
          </div>
          <div className="summary-card borrowed">
            <div className="card-icon">📖</div>
            <div className="card-info">
              <h3>{summaryData.borrowed}</h3>
              <p>Borrowed</p>
            </div>
          </div>
          <div className="summary-card returned">
            <div className="card-icon">✅</div>
            <div className="card-info">
              <h3>{summaryData.returned}</h3>
              <p>Returned</p>
            </div>
          </div>
          <div className="summary-card overdue">
            <div className="card-icon">⚠️</div>
            <div className="card-info">
              <h3>{summaryData.overdue}</h3>
              <p>Overdue</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="content-section">
        <h3 className="section-title">Recent Activity</h3>
        {error && (
          <div className="no-results" style={{ marginBottom: '15px', color: '#ff6b6b' }}>
            {error}
          </div>
        )}
        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Action</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="no-results">Loading...</td>
                </tr>
              ) : filteredActivity.length > 0 ? (
                filteredActivity.map((item, index) => (
                  <tr key={index}>
                    <td>{item.book_title}</td>
                    <td>
                      <span className={`action-badge ${item.action?.toLowerCase()}`}>
                        {item.action}
                      </span>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">No results found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="content-section">
        <h3 className="section-title">Announcements</h3>
        <div className="announcements-grid">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <h4>{announcement.title}</h4>
                <span className="announcement-date">{announcement.date}</span>
              </div>
              <p>{announcement.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
