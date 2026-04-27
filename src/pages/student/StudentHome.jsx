import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import {
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
    overdue: 0,
    availableCopies: 0,
    categories: 0
  });
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const isGuest = !user?.email;

  const currentYear = new Date().getFullYear();

  const announcements = [
    {
      id: 1,
      title: 'Library Holiday Closure',
      date: `${currentYear}-05-01`,
      content: 'The library will be closed on Labor Day. Online catalog access remains available.'
    },
    {
      id: 2,
      title: 'New Book Collection',
      date: `${currentYear}-04-25`,
      content: 'New software engineering and AI titles are now in circulation.'
    },
    {
      id: 3,
      title: 'Extended Borrowing Hours',
      date: `${currentYear}-04-21`,
      content: 'Borrowing and return counters are open until 7:00 PM on weekdays.'
    }
  ];

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return 'Not available';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return String(dateValue);
    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const resolveCoverPath = (cover) => {
    if (!cover) return '/book-covers/javascript-good-parts.svg';
    if (cover.startsWith('/')) return cover;
    return `/book-covers/${cover}`;
  };

  const updateDerivedSections = (books, borrowed, returned, apiSummary = null) => {
    const borrowedBookIds = new Set(borrowed.map((item) => item.bookId));
    const recommended = books
      .filter((book) => book.available > 0 && !borrowedBookIds.has(book.id))
      .slice(0, 3);

    const availableCopies = books.reduce((total, book) => total + (Number(book.available) || 0), 0);
    const categories = new Set(books.map((book) => book.category).filter(Boolean)).size;
    const overdue = borrowed.filter((item) => item.status === 'overdue').length;

    setSummaryData({
      totalBooks: apiSummary?.totalBooks ?? books.length,
      borrowed: borrowed.length,
      returned: returned.length,
      overdue,
      availableCopies,
      categories
    });
    setRecommendedBooks(recommended);
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    if (userData.email) {
      fetchStudentData(userData.email);
      return;
    }

    const localBooks = getBooksData();
    const localBorrowed = getBorrowedData();
    const localReturned = getReturnedData();
    updateDerivedSections(localBooks, localBorrowed, localReturned);
    setLoading(false);
  }, []);

  const fetchStudentData = async (email) => {
    const localBooks = getBooksData();
    const localBorrowed = getBorrowedData();
    const localReturned = getReturnedData();

    try {
      setLoading(true);
      const summaryResult = await api.getStudentSummary(email);
      const apiSummary = summaryResult.success ? summaryResult.data : null;

      updateDerivedSections(localBooks, localBorrowed, localReturned, apiSummary);

      if (!summaryResult.success) {
        console.error('Summary error:', summaryResult.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      updateDerivedSections(localBooks, localBorrowed, localReturned);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-home">
      <div className="welcome-card">
        <div className="welcome-info">
          {isGuest ? (
            <>
              <h2>Welcome to the Library Dashboard!</h2>
              <p>Browse available books as a guest and explore what is in the catalog today.</p>
              <p className="hero-meta">Open 8:00 AM to 7:00 PM | Monday to Friday</p>
              <p className="user-email">Login or create an account to borrow, renew, and track due dates.</p>
              <div className="welcome-actions">
                <Link to="/student-dashboard/books" className="action-btn">Browse Books</Link>
                <Link to="/login" className="action-btn secondary-btn">Login / Create Account</Link>
              </div>
              <div className="hero-quick-links">
                <a href="#how-to-borrow">How Borrowing Works</a>
                <a href="#rules-help">Library Rules</a>
              </div>
            </>
          ) : (
            <>
              <h2>Welcome back, {user.first_name} {user.last_name}!</h2>
              <p>Review your current borrowing status and complete pending returns on time.</p>
              <p className="hero-meta">Open 8:00 AM to 7:00 PM | Monday to Friday</p>
              <p className="user-email">{user.email}</p>
              <div className="welcome-actions">
                <Link to="/student-dashboard/books" className="action-btn">Browse Books</Link>
                <Link to="/student-dashboard/borrowed" className="action-btn secondary-btn">View Borrowed</Link>
              </div>
              <div className="hero-quick-links">
                <a href="#how-to-borrow">How Borrowing Works</a>
                <a href="#rules-help">Library Rules</a>
              </div>
            </>
          )}
        </div>
        <div className="welcome-avatar">
          <span>{isGuest ? 'Guest' : `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`}</span>
        </div>
      </div>

      {loading ? (
        <div className="summary-cards loading-cards">
          {[1, 2, 3, 4].map((item) => (
            <div className="summary-card skeleton-card" key={item}>
              <div className="card-icon skeleton-block" />
              <div className="card-info">
                <h3 className="skeleton-text short" />
                <p className="skeleton-text long" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="summary-cards" aria-label="Dashboard summary">
          <div className="summary-card">
            <div className="card-icon" aria-hidden="true">TB</div>
            <div className="card-info">
              <h3>{summaryData.totalBooks}</h3>
              <p>Total Books</p>
            </div>
          </div>

          {isGuest ? (
            <>
              <div className="summary-card borrowed">
                <div className="card-icon" aria-hidden="true">AC</div>
                <div className="card-info">
                  <h3>{summaryData.availableCopies}</h3>
                  <p>Available Copies</p>
                </div>
              </div>
              <div className="summary-card returned">
                <div className="card-icon" aria-hidden="true">CT</div>
                <div className="card-info">
                  <h3>{summaryData.categories}</h3>
                  <p>Categories</p>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon" aria-hidden="true">HR</div>
                <div className="card-info">
                  <h3>8-7</h3>
                  <p>Open Hours</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="summary-card borrowed">
                <div className="card-icon" aria-hidden="true">BR</div>
                <div className="card-info">
                  <h3>{summaryData.borrowed}</h3>
                  <p>Borrowed</p>
                </div>
              </div>
              <div className="summary-card returned">
                <div className="card-icon" aria-hidden="true">RT</div>
                <div className="card-info">
                  <h3>{summaryData.returned}</h3>
                  <p>Returned</p>
                </div>
              </div>
              <div className="summary-card overdue">
                <div className="card-icon" aria-hidden="true">OD</div>
                <div className="card-info">
                  <h3>{summaryData.overdue}</h3>
                  <p>Overdue</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="dashboard-insights-grid">
        <div className="content-section" id="how-to-borrow">
          <h3 className="section-title">How to Borrow</h3>
          <div className="guide-list">
            <p><strong>1.</strong> Browse the catalog and choose an available title.</p>
            <p><strong>2.</strong> Click borrow and confirm your request.</p>
            <p><strong>3.</strong> Track due dates in the borrowed page.</p>
            <p><strong>4.</strong> Return books before the due date to avoid penalties.</p>
          </div>
        </div>

        <div className="content-section" id="rules-help">
          <h3 className="section-title">Library Rules and Help</h3>
          <div className="guide-list">
            <p><strong>Borrowing Limit:</strong> Up to 3 books per student account.</p>
            <p><strong>Borrowing Period:</strong> 14 days per title.</p>
            <p><strong>Contact:</strong> library.help@campus.edu</p>
            <p><strong>Hours:</strong> Monday to Friday, 8:00 AM to 7:00 PM.</p>
          </div>
        </div>
      </div>

      <div className="content-section">
        <h3 className="section-title">Recommended Books</h3>
        {recommendedBooks.length > 0 ? (
          <div className="recommendations-grid">
            {recommendedBooks.map((book) => (
              <article key={book.id} className="recommendation-card">
                <img
                  src={resolveCoverPath(book.cover)}
                  alt={`${book.title} cover`}
                  className="recommendation-cover"
                />
                <div className="recommendation-content">
                  <strong>{book.title}</strong>
                  <p>{book.author}</p>
                  <div className="recommendation-meta">
                    <span className="availability-badge available">{book.available} copies available</span>
                    <span className="recommendation-category">{book.category}</span>
                  </div>
                </div>
                <Link to="/student-dashboard/books" className="action-btn small-btn">View Details</Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-message">No recommendations at the moment.</p>
        )}
      </div>

      <div className="content-section">
        <h3 className="section-title">Announcements</h3>
        <div className="announcements-grid">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <h4>{announcement.title}</h4>
                <span className="announcement-date">{formatDisplayDate(announcement.date)}</span>
              </div>
              <p>{announcement.content}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="landing-footer">
        <p><strong>Phone Number:</strong> +63 9157727986</p>
        <p><strong>Facebook:</strong> fb.com/campuslibrary</p>
        <p><strong>Librarian Contact:</strong> library.help@campus.edu</p>
      </footer>
    </div>
  );
};

export default StudentHome;
