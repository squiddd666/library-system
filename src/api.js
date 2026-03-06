const API_HOST = `${window.location.protocol}//${window.location.hostname}`;
const API_URL = `${API_HOST}/library-system-main/server`;

const parseResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    const fallbackMessage = text ? text.slice(0, 300) : 'Invalid server response';
    return { success: false, message: fallbackMessage };
  }
};

export const api = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error. Make sure XAMPP is running.' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await parseResponse(response);
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error. Make sure XAMPP is running.' };
    }
  },

  requestSignupOtp: async (userData) => {
    return api.register({ ...userData, action: 'send_otp' });
  },

  verifySignupOtp: async (userData, otp) => {
    return api.register({ ...userData, otp, action: 'verify_otp' });
  },

  getSignupSettings: async () => {
    try {
      const response = await fetch(`${API_URL}/signup-settings.php`);
      return await parseResponse(response);
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  updateSignupSettings: async (settings) => {
    try {
      const response = await fetch(`${API_URL}/signup-settings.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      return await parseResponse(response);
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },
  // Get all books
  getBooks: async () => {
    try {
      const response = await fetch(`${API_URL}/books.php`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  // Add book
  addBook: async (bookData) => {
    try {
      const response = await fetch(`${API_URL}/books.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });
      const data = await parseResponse(response);
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  // Update book
  updateBook: async (bookData) => {
    try {
      const response = await fetch(`${API_URL}/books.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  // Delete book
  deleteBook: async (id) => {
    try {
      const response = await fetch(`${API_URL}/books.php?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  // Get student summary
  getStudentSummary: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/student/summary.php?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },

  // Get recent activity
  getRecentActivity: async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/student/recent-activity.php?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  },
};
