import { isAuthenticated } from '../../auth';

const STORAGE_PREFIX = 'library.student';

const DEFAULT_BOOKS = [
  // eslint-disable-next-line no-script-url
  {
    id: 1,
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    category: 'Programming',
    available: 5,
    cover: '/book-covers/javascript-good-parts.svg',
    intro: 'A compact guide to the strongest features and best practices of JavaScript.'
  },
  {
    id: 2,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Programming',
    available: 3,
    cover: '/book-covers/clean-code.svg',
    intro: 'Learn practical habits for writing readable, maintainable, and professional code.'
  },
  {
    id: 3,
    title: 'Design Patterns',
    author: 'Gang of Four',
    category: 'Programming',
    available: 2,
    cover: '/book-covers/design-patterns.svg',
    intro: 'Classic software design solutions for common object-oriented development problems.'
  },
  {
    id: 4,
    title: 'Introduction to Algorithms',
    author: 'Thomas Cormen',
    category: 'Computer Science',
    available: 4,
    cover: '/book-covers/intro-to-algorithms.svg',
    intro: 'A foundational algorithms textbook covering theory, data structures, and analysis.'
  },
  {
    id: 5,
    title: 'The Pragmatic Programmer',
    author: 'David Thomas',
    category: 'Programming',
    available: 6,
    cover: '/book-covers/pragmatic-programmer.svg',
    intro: 'Timeless advice to improve developer mindset, craft, and day-to-day coding workflow.'
  },
  {
    id: 6,
    title: 'Computer Networking',
    author: 'James Kurose',
    category: 'Computer Science',
    available: 3,
    cover: '/book-covers/computer-networking.svg',
    intro: 'Clear explanation of networking concepts from application layer to network core.'
  },
  {
    id: 7,
    title: 'Database System Concepts',
    author: 'Silberschatz',
    category: 'Database',
    available: 4,
    cover: '/book-covers/database-system-concepts.svg',
    intro: 'Comprehensive overview of database design, SQL, transactions, and storage systems.'
  },
  {
    id: 8,
    title: 'Operating System Concepts',
    author: 'Abraham Silberschatz',
    category: 'Computer Science',
    available: 2,
    cover: '/book-covers/operating-system-concepts.svg',
    intro: 'Core operating system topics including processes, memory management, and scheduling.'
  },
  {
    id: 9,
    title: 'Artificial Intelligence',
    author: 'Stuart Russell',
    category: 'AI',
    available: 5,
    cover: '/book-covers/artificial-intelligence.svg',
    intro: 'A broad introduction to intelligent agents, reasoning, search, and learning systems.'
  },
  {
    id: 10,
    title: 'Machine Learning',
    author: 'Tom Mitchell',
    category: 'AI',
    available: 3,
    cover: '/book-covers/machine-learning.svg',
    intro: 'Introduces key machine learning ideas, models, and evaluation techniques.'
  }
];

const DEFAULT_BOOKS_BY_ID = DEFAULT_BOOKS.reduce((acc, book) => {
  acc[book.id] = book;
  return acc;
}, {});

const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: false,
  weekly: true
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const getUserEmail = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.email || 'guest';
};

const keyFor = (name) => `${STORAGE_PREFIX}.${getUserEmail()}.${name}`;

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeBorrowed = (items) =>
  items.map((item) => {
    if (item.status === 'active' && item.dueDate < formatDate(new Date())) {
      return { ...item, status: 'overdue' };
    }
    return item;
  });

const saveBorrowedData = (items) => {
  const normalized = normalizeBorrowed(items);
  writeJSON(keyFor('borrowed'), normalized);
  return normalized;
};

export const getBooksData = () => {
  const key = keyFor('books');
  const books = readJSON(key, null);
  if (!Array.isArray(books) || books.length === 0) {
    writeJSON(key, DEFAULT_BOOKS);
    return DEFAULT_BOOKS;
  }
  const normalized = books.map((book) => {
    const defaults = DEFAULT_BOOKS_BY_ID[book.id];
    if (!defaults) return book;
    return { ...defaults, ...book };
  });
  writeJSON(key, normalized);
  return normalized;
};

export const setBooksData = (books) => {
  if (!Array.isArray(books) || books.length === 0) return;
  const normalized = books.map((book) => ({
    ...book,
    id: Number(book.id),
    available: Number(book.available ?? book.copies_available ?? 0),
    quantity: Number(book.quantity ?? book.copies_total ?? 0),
    title: String(book.title || ''),
    author: String(book.author || ''),
    category: String(book.category || ''),
    cover: String(book.cover_image_url || book.cover || '')
  }));
  writeJSON(keyFor('books'), normalized);
};

export const getBorrowedData = () => {
  const borrowed = readJSON(keyFor('borrowed'), []);
  return saveBorrowedData(Array.isArray(borrowed) ? borrowed : []);
};

export const getReturnedData = () => {
  const returned = readJSON(keyFor('returned'), []);
  return Array.isArray(returned) ? returned : [];
};

export const getNotificationSettings = () => {
  const settings = readJSON(keyFor('notifications'), null);
  if (!settings) {
    writeJSON(keyFor('notifications'), DEFAULT_NOTIFICATIONS);
    return DEFAULT_NOTIFICATIONS;
  }
  return settings;
};

export const setNotificationSettings = (settings) => {
  writeJSON(keyFor('notifications'), settings);
};

const appendActivity = (entry) => {
  const current = readJSON(keyFor('activity'), []);
  const next = [entry, ...current].slice(0, 30);
  writeJSON(keyFor('activity'), next);
};

export const getActivityData = () => {
  const activity = readJSON(keyFor('activity'), []);
  return Array.isArray(activity) ? activity : [];
};

export const borrowBookById = (bookId) => {
  if (!isAuthenticated()) {
    return {
      success: false,
      message: 'Please login or create an account to borrow books.'
    };
  }

  const books = getBooksData();
  const borrowed = getBorrowedData();

  const index = books.findIndex((book) => book.id === bookId);
  if (index < 0) {
    return { success: false, message: 'Book not found.' };
  }

  const selectedBook = books[index];
  const alreadyBorrowed = borrowed.some((item) => item.bookId === bookId);
  if (alreadyBorrowed) {
    return { success: false, message: 'You already borrowed this book.' };
  }

  if (selectedBook.available <= 0) {
    return { success: false, message: 'Book is currently unavailable.' };
  }

  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + 14);

  const updatedBooks = [...books];
  updatedBooks[index] = { ...selectedBook, available: selectedBook.available - 1 };
  writeJSON(keyFor('books'), updatedBooks);

  const newBorrow = {
    id: Date.now(),
    bookId: selectedBook.id,
    title: selectedBook.title,
    borrowDate: formatDate(today),
    dueDate: formatDate(dueDate),
    status: 'active'
  };

  saveBorrowedData([newBorrow, ...borrowed]);
  appendActivity({
    book_title: selectedBook.title,
    action: 'Borrowed',
    date: formatDate(today),
    status: 'Active'
  });

  return { success: true, message: 'Book borrowed successfully.' };
};

export const returnBorrowedBook = (borrowId) => {
  const borrowed = getBorrowedData();
  const record = borrowed.find((item) => item.id === borrowId);
  if (!record) {
    return { success: false, message: 'Borrow record not found.' };
  }

  const books = getBooksData();
  const index = books.findIndex((book) => book.id === record.bookId);
  if (index >= 0) {
    const updatedBooks = [...books];
    updatedBooks[index] = { ...updatedBooks[index], available: updatedBooks[index].available + 1 };
    writeJSON(keyFor('books'), updatedBooks);
  }

  const remaining = borrowed.filter((item) => item.id !== borrowId);
  saveBorrowedData(remaining);

  const returned = getReturnedData();
  const returnDate = formatDate(new Date());
  const updatedReturned = [
    {
      id: Date.now(),
      bookId: record.bookId,
      title: record.title,
      borrowDate: record.borrowDate,
      returnDate,
      status: 'completed'
    },
    ...returned
  ];
  writeJSON(keyFor('returned'), updatedReturned);

  appendActivity({
    book_title: record.title,
    action: 'Returned',
    date: returnDate,
    status: 'Completed'
  });

  return { success: true, message: 'Book returned successfully.' };
};

export const clearStudentHistory = () => {
  writeJSON(keyFor('returned'), []);
  writeJSON(keyFor('activity'), []);
};
