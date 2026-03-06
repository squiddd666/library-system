import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import './Dashboard.css';

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  quantity: 1
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activityLog, setActivityLog] = useState([]);
  const [studentActivityLog, setStudentActivityLog] = useState([]);
  const [signupSettings, setSignupSettings] = useState({
    email_verification_enabled: true
  });
  const [signupSettingsLoading, setSignupSettingsLoading] = useState(true);
  const [signupSettingsSaving, setSignupSettingsSaving] = useState(false);

  const logAction = (action, details) => {
    const now = Date.now();
    setActivityLog((prev) => [
      {
        id: now,
        action,
        details,
        time: new Date().toLocaleString(),
        timestamp: now
      },
      ...prev
    ]);
  };

  const loadStudentActivity = useCallback(() => {
    const prefix = 'library.student.';
    const suffix = '.activity';
    const collected = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix) || !key.endsWith(suffix)) continue;

      const studentEmail = key.slice(prefix.length, -suffix.length) || 'student';

      try {
        const raw = localStorage.getItem(key);
        const entries = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(entries)) continue;

        entries.forEach((entry, entryIndex) => {
          const timestamp = Number(entry?.timestamp) || Date.parse(entry?.date || '') || 0;
          collected.push({
            id: `student-${studentEmail}-${entry?.id || timestamp || entryIndex}`,
            source: 'Student',
            user: studentEmail,
            action: entry?.action || 'Activity',
            details: entry?.book_title || entry?.details || '-',
            time: entry?.time || entry?.date || '-',
            timestamp
          });
        });
      } catch (error) {
        // Ignore malformed student activity payloads.
      }
    }

    collected.sort((a, b) => b.timestamp - a.timestamp);
    setStudentActivityLog(collected);
  }, []);

  const menuItems = [
    { id: 'home', icon: '📊', label: 'Dashboard' },
    { id: 'books', icon: '📚', label: 'Manage Books' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'activity', icon: '🕒', label: 'Admin Activity' },
    { id: 'student-logs', icon: '🧾', label: 'Student Logs' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const getPageTitle = () => {
    if (activeSection === 'books') return 'BOOK MANAGEMENT';
    if (activeSection === 'analytics') return 'LIBRARY ANALYTICS';
    if (activeSection === 'activity') return 'ADMIN ACTIVITY LOG';
    if (activeSection === 'student-logs') return 'STUDENT ACTIVITY LOGS';
    if (activeSection === 'settings') return 'ADMIN SETTINGS';
    return 'ADMIN DASHBOARD HOME';
  };

  const loadBooks = async () => {
    setLoading(true);
    const result = await api.getBooks();
    if (result.success) {
      setBooks(Array.isArray(result.books) ? result.books : []);
      setMessage('');
    } else {
      setMessage(result.message || 'Failed to load books.');
    }
    setLoading(false);
  };

  const loadSignupSettings = useCallback(async () => {
    setSignupSettingsLoading(true);
    const result = await api.getSignupSettings();
    if (result.success && result.settings) {
      setSignupSettings({
        email_verification_enabled: Boolean(result.settings.email_verification_enabled)
      });
    } else {
      setMessage(result.message || 'Failed to load signup settings.');
    }
    setSignupSettingsLoading(false);
  }, []);

  useEffect(() => {
    loadBooks();
    loadStudentActivity();
    loadSignupSettings();
  }, [loadSignupSettings, loadStudentActivity]);

  useEffect(() => {
    const syncStudentActivity = () => loadStudentActivity();
    window.addEventListener('storage', syncStudentActivity);
    window.addEventListener('focus', syncStudentActivity);
    return () => {
      window.removeEventListener('storage', syncStudentActivity);
      window.removeEventListener('focus', syncStudentActivity);
    };
  }, [loadStudentActivity]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activeSection, isMobile]);

  const summary = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, book) => sum + Number(book.quantity || 0), 0);
    const availableCopies = books.reduce((sum, book) => sum + Number(book.available || 0), 0);
    const lowStock = books.filter((book) => Number(book.available || 0) > 0 && Number(book.available || 0) <= 2).length;
    const outOfStock = books.filter((book) => Number(book.available || 0) === 0).length;
    return {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies: Math.max(totalCopies - availableCopies, 0),
      lowStock,
      outOfStock
    };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      const matchesQuery = !query || (
        String(book.title || '').toLowerCase().includes(query) ||
        String(book.author || '').toLowerCase().includes(query) ||
        String(book.isbn || '').toLowerCase().includes(query) ||
        String(book.category || '').toLowerCase().includes(query)
      );

      if (!matchesQuery) return false;
      const available = Number(book.available || 0);
      if (stockFilter === 'low') return available > 0 && available <= 2;
      if (stockFilter === 'out') return available === 0;
      return true;
    });
  }, [books, searchQuery, stockFilter]);

  const categorySummary = useMemo(() => {
    const counts = books.reduce((acc, book) => {
      const key = book.category || 'Uncategorized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setMessage('Title and author are required.');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      category: form.category.trim(),
      quantity: Number(form.quantity || 1)
    };

    const result = editingId
      ? await api.updateBook({ id: editingId, ...payload })
      : await api.addBook(payload);

    setSaving(false);
    setMessage(result.message || (result.success ? 'Saved.' : 'Failed to save.'));
    if (result.success) {
      logAction(editingId ? 'Book Updated' : 'Book Added', payload.title);
      resetForm();
      loadBooks();
    }
  };

  const handleEdit = (book) => {
    setEditingId(Number(book.id));
    setForm({
      title: String(book.title || ''),
      author: String(book.author || ''),
      isbn: String(book.isbn || ''),
      category: String(book.category || ''),
      quantity: Number(book.quantity || 1)
    });
    setActiveSection('books');
  };

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm('Delete this book?');
    if (!confirmed) return;

    const result = await api.deleteBook(id);
    setMessage(result.message || (result.success ? 'Book deleted.' : 'Failed to delete book.'));
    if (result.success) {
      logAction('Book Deleted', title);
      loadBooks();
    }
  };

  const handleRestock = async (book) => {
    const payload = {
      id: Number(book.id),
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || '',
      quantity: Number(book.quantity || 0) + 1
    };
    const result = await api.updateBook(payload);
    setMessage(result.message || (result.success ? 'Book restocked.' : 'Restock failed.'));
    if (result.success) {
      logAction('Book Restocked', book.title);
      loadBooks();
    }
  };

  const handleExportCsv = () => {
    const header = ['Title', 'Author', 'ISBN', 'Category', 'Quantity', 'Available'];
    const rows = filteredBooks.map((book) => [
      `"${String(book.title || '').replace(/"/g, '""')}"`,
      `"${String(book.author || '').replace(/"/g, '""')}"`,
      `"${String(book.isbn || '').replace(/"/g, '""')}"`,
      `"${String(book.category || '').replace(/"/g, '""')}"`,
      Number(book.quantity || 0),
      Number(book.available || 0)
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'library-books.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    logAction('Export', 'CSV exported');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSignupVerificationToggle = async () => {
    const nextEnabled = !signupSettings.email_verification_enabled;
    setSignupSettingsSaving(true);

    const result = await api.updateSignupSettings({
      email_verification_enabled: nextEnabled
    });

    setSignupSettingsSaving(false);
    setMessage(result.message || (result.success ? 'Signup settings updated.' : 'Failed to update signup settings.'));

    if (result.success && result.settings) {
      setSignupSettings({
        email_verification_enabled: Boolean(result.settings.email_verification_enabled)
      });
      logAction(
        'Signup Email Verification',
        result.settings.email_verification_enabled ? 'Enabled' : 'Disabled'
      );
    }
  };

  const renderHome = () => (
    <>
      <div className="admin-welcome-card">
        <div className="welcome-info">
          <h2>Welcome, {user.first_name} {user.last_name}</h2>
          <p>Role: {user.role || 'admin'}</p>
          <p className="user-email">{user.email}</p>
        </div>
        <div className="welcome-avatar">
          <span>{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📚</div>
          <div className="card-info"><h3>{summary.totalTitles}</h3><p>Total Titles</p></div>
        </div>
        <div className="summary-card borrowed">
          <div className="card-icon">📦</div>
          <div className="card-info"><h3>{summary.totalCopies}</h3><p>Total Copies</p></div>
        </div>
        <div className="summary-card returned">
          <div className="card-icon">✅</div>
          <div className="card-info"><h3>{summary.availableCopies}</h3><p>Available</p></div>
        </div>
        <div className="summary-card overdue">
          <div className="card-icon">⚠️</div>
          <div className="card-info"><h3>{summary.lowStock}</h3><p>Low Stock</p></div>
        </div>
      </div>

      <div className="content-section">
        <h3 className="section-title">Low Stock Books</h3>
        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Available</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.filter((book) => Number(book.available || 0) <= 2).slice(0, 6).map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.category || '-'}</td>
                  <td>{book.available}</td>
                  <td>
                    <button type="button" className="action-btn" onClick={() => handleRestock(book)}>Restock +1</button>
                  </td>
                </tr>
              ))}
              {books.filter((book) => Number(book.available || 0) <= 2).length === 0 && (
                <tr><td colSpan="4" className="no-results">No low stock books</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderBooks = () => (
    <>
      <div className="admin-controls">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <select
          className="filter-select"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button type="button" className="action-btn" onClick={handleExportCsv}>Export CSV</button>
      </div>

      <div className="admin-grid">
        <div className="content-section">
          <h3 className="section-title">{editingId ? 'Edit Book' : 'Add Book'}</h3>
          <form className="book-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            <input type="text" placeholder="Author" value={form.author} onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))} />
            <input type="text" placeholder="ISBN" value={form.isbn} onChange={(e) => setForm((prev) => ({ ...prev, isbn: e.target.value }))} />
            <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
            <input type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} />
            <div className="form-actions">
              <button type="submit" className="action-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Book' : 'Add Book'}
              </button>
              {editingId && <button type="button" className="action-btn danger" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="content-section">
          <h3 className="section-title">Books Inventory</h3>
          <div className="table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Avail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="no-results">Loading...</td></tr>
                ) : filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <tr key={book.id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.category || '-'}</td>
                      <td>{book.quantity}</td>
                      <td>{book.available}</td>
                      <td>
                        <button type="button" className="table-btn" onClick={() => handleEdit(book)}>Edit</button>
                        <button type="button" className="table-btn" onClick={() => handleRestock(book)}>+1</button>
                        <button type="button" className="table-btn danger" onClick={() => handleDelete(book.id, book.title)}>Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="no-results">No books found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderAnalytics = () => (
    <div className="content-section">
      <h3 className="section-title">Category Breakdown</h3>
      <div className="table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Titles</th>
            </tr>
          </thead>
          <tbody>
            {categorySummary.map(([name, count]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{count}</td>
              </tr>
            ))}
            {categorySummary.length === 0 && (
              <tr><td colSpan="2" className="no-results">No category data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="content-section">
      <h3 className="section-title">Recent Admin Actions</h3>
      <div className="table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activityLog.length > 0 ? activityLog.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{entry.details}</td>
                <td>{entry.time}</td>
              </tr>
            )) : (
              <tr><td colSpan="3" className="no-results">No admin actions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStudentLogs = () => (
    <div className="content-section">
      <h3 className="section-title">Recent Student Activity</h3>
      <div className="table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Action</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {studentActivityLog.length > 0 ? studentActivityLog.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.user}</td>
                <td>{entry.action}</td>
                <td>{entry.details}</td>
                <td>{entry.time}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="no-results">No student activity yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="content-section">
      <h3 className="section-title">Admin Settings</h3>
      <div className="settings-card">
        <div className="setting-item">
          <div className="setting-info">
            <p className="setting-label">Clear Activity Log</p>
            <p className="setting-description">Remove all admin activity records.</p>
          </div>
          <button type="button" className="action-btn danger" onClick={() => setActivityLog([])}>Clear</button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <p className="setting-label">Refresh Library Data</p>
            <p className="setting-description">Reload latest data from server.</p>
          </div>
          <button type="button" className="action-btn" onClick={loadBooks}>Refresh</button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <p className="setting-label">Email Verification on Signup</p>
            <p className="setting-description">
              {signupSettingsLoading
                ? 'Loading signup verification setting...'
                : signupSettings.email_verification_enabled
                  ? 'Students must verify their email with an OTP before signup completes.'
                  : 'Students can sign up immediately without email verification.'}
            </p>
          </div>
          <button
            type="button"
            className={`action-btn ${signupSettings.email_verification_enabled ? '' : 'danger'}`}
            onClick={handleSignupVerificationToggle}
            disabled={signupSettingsLoading || signupSettingsSaving}
          >
            {signupSettingsLoading
              ? 'Loading...'
              : signupSettingsSaving
                ? 'Saving...'
                : signupSettings.email_verification_enabled
                  ? 'Disable'
                  : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <div className="header-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen((prev) => !prev)}>☰</button>
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        <div className="header-right">
          <button type="button" className="action-btn" onClick={loadBooks}>Refresh</button>
          <button type="button" className="action-btn danger" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        {isMobile && sidebarOpen && <button type="button" className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}

        <main className="main-content">
          <div className="content-wrapper">
            {message && <div className="dashboard-message">{message}</div>}
            {activeSection === 'home' && renderHome()}
            {activeSection === 'books' && renderBooks()}
            {activeSection === 'analytics' && renderAnalytics()}
            {activeSection === 'activity' && renderActivity()}
            {activeSection === 'student-logs' && renderStudentLogs()}
            {activeSection === 'settings' && renderSettings()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
