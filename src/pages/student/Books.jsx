import React, { useState, useEffect } from 'react';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Mock books data - in real app, fetch from API
    const mockBooks = [
      { id: 1, title: "JavaScript: The Good Parts", author: "Douglas Crockford", category: "Programming", available: 5 },
      { id: 2, title: "Clean Code", author: "Robert C. Martin", category: "Programming", available: 3 },
      { id: 3, title: "Design Patterns", author: "Gang of Four", category: "Programming", available: 2 },
      { id: 4, title: "Introduction to Algorithms", author: "Thomas Cormen", category: "Computer Science", available: 4 },
      { id: 5, title: "The Pragmatic Programmer", author: "David Thomas", category: "Programming", available: 6 },
      { id: 6, title: "Computer Networking", author: "James Kurose", category: "Computer Science", available: 3 },
      { id: 7, title: "Database System Concepts", author: "Silberschatz", category: "Database", available: 4 },
      { id: 8, title: "Operating System Concepts", author: "Abraham Silberschatz", category: "Computer Science", available: 2 },
      { id: 9, title: "Artificial Intelligence", author: "Stuart Russell", category: "AI", available: 5 },
      { id: 10, title: "Machine Learning", author: "Tom Mitchell", category: "AI", available: 3 }
    ];
    
    setBooks(mockBooks);
    setLoading(false);
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="books-page">
      <div className="page-header">
        <h2>📚 Available Books</h2>
        <p>Browse our library collection</p>
      </div>

      <div className="search-container" style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search books by title, author, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {loading ? (
        <div className="no-results">Loading books...</div>
      ) : (
        <div className="books-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div key={book.id} className="book-card">
                <div className="book-icon">📖</div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                  <p className="book-category">{book.category}</p>
                  <div className="book-availability">
                    <span className={`availability-badge ${book.available > 0 ? 'available' : 'unavailable'}`}>
                      {book.available > 0 ? `${book.available} available` : 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">No books found matching your search</div>
          )}
        </div>
      )}

      <style>{`
        .books-page {
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
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .book-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 15px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .book-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .book-icon {
          font-size: 40px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          flex-shrink: 0;
        }
        .book-info {
          flex: 1;
          min-width: 0;
        }
        .book-info h3 {
          font-size: 16px;
          color: white;
          margin-bottom: 5px;
          line-height: 1.3;
        }
        .book-author {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          margin-bottom: 5px;
        }
        .book-category {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          margin-bottom: 10px;
        }
        .availability-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .availability-badge.available {
          background: rgba(52, 168, 83, 0.2);
          color: #34a853;
        }
        .availability-badge.unavailable {
          background: rgba(234, 67, 53, 0.2);
          color: #ea4335;
        }
      `}</style>
    </div>
  );
};

export default Books;
