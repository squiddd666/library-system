import React, { useState, useEffect } from 'react';

const Returned = () => {
  const [returnedBooks, setReturnedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock returned books data - in real app, fetch from API
    const mockReturned = [
      { id: 1, title: "Introduction to Algorithms", returnDate: "2024-01-14", borrowDate: "2024-01-01", status: "completed" },
      { id: 2, title: "The Pragmatic Programmer", returnDate: "2024-01-10", borrowDate: "2023-12-20", status: "completed" },
      { id: 3, title: "Computer Networking", returnDate: "2024-01-05", borrowDate: "2023-12-15", status: "completed" },
      { id: 4, title: "Operating System Concepts", returnDate: "2023-12-28", borrowDate: "2023-12-10", status: "completed" }
    ];
    
    setReturnedBooks(mockReturned);
    setLoading(false);
  }, []);

  return (
    <div className="returned-page">
      <div className="page-header">
        <h2>✅ Returned Books</h2>
        <p>History of your returned books</p>
      </div>

      {loading ? (
        <div className="no-results">Loading...</div>
      ) : returnedBooks.length > 0 ? (
        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Borrow Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returnedBooks.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.borrowDate}</td>
                  <td>{book.returnDate}</td>
                  <td>
                    <span className="status-badge completed">
                      Returned
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">No returned books yet</div>
      )}

      <style>{`
        .returned-page {
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
        .status-badge.completed {
          background: rgba(52, 168, 83, 0.2);
          color: #34a853;
        }
      `}</style>
    </div>
  );
};

export default Returned;
