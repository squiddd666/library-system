export const getStoredUser = () => {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => getStoredUser() !== null;

export const getUserRole = () => {
  const user = getStoredUser();
  if (!user) return null;
  return user.role === 'admin' ? 'admin' : 'student';
};

export const clearAuth = () => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};
