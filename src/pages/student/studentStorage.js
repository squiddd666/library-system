const STORAGE_PREFIX = 'library.student';

const DEFAULT_BOOKS = [
  { id: 1, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 'Programming', available: 5 },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', available: 3 },
  { id: 3, title: 'Design Patterns', author: 'Gang of Four', category: 'Programming', available: 2 },
  { id: 4, title: 'Introduction to Algorithms', author: 'Thomas Cormen', category: 'Computer Science', available: 4 },
  { id: 5, title: 'The Pragmatic Programmer', author: 'David Thomas', category: 'Programming', available: 6 },
  { id: 6, title: 'Computer Networking', author: 'James Kurose', category: 'Computer Science', available: 3 },
  { id: 7, title: 'Database System Concepts', author: 'Silberschatz', category: 'Database', available: 4 },
  { id: 8, title: 'Operating System Concepts', author: 'Abraham Silberschatz', category: 'Computer Science', available: 2 },
  { id: 9, title: 'Artificial Intelligence', author: 'Stuart Russell', category: 'AI', available: 5 },
  { id: 10, title: 'Machine Learning', author: 'Tom Mitchell', category: 'AI', available: 3 }
];

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
  return books;
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
