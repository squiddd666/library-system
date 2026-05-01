import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailIcon from './Components/email.png';
import passIcon from './Components/password.png';
import './login.css';
import { api } from './api';
import { clearAuth, getStoredUser } from './auth';

const allowedDomains = ['cvsu.edu.ph', 'gmail.com', 'yahoo.com'];

const maskEmail = (email) => {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || '*'}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name[name.length - 1]}@${domain}`;
};

const getPasswordStrength = (value) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return { score, label: 'Weak', className: 'weak' };
  if (score <= 4) return { score, label: 'Medium', className: 'medium' };
  return { score, label: 'Strong', className: 'strong' };
};

const isValidRealName = (value) => {
  const trimmed = String(value || '').trim();
  if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(trimmed)) return false;
  const letterCount = (trimmed.match(/[A-Za-z]/g) || []).length;
  return letterCount >= 3;
};

const isValidBirthday = (value) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

const Login = () => {
  const navigate = useNavigate();
  const [action, setAction] = useState('Login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('home');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [affiliation, setAffiliation] = useState('student');
  const [institutionId, setInstitutionId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupStep, setSignupStep] = useState(1);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [signupVerificationEnabled, setSignupVerificationEnabled] = useState(true);
  const [signupErrors, setSignupErrors] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadSignupSettings = async () => {
      const result = await api.getSignupSettings();
      if (mounted && result.success && result.settings) {
        setSignupVerificationEnabled(Boolean(result.settings.email_verification_enabled));
      }
    };
    loadSignupSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setRetryAfterSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (otpCountdown <= 0) return undefined;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const maskedSignupEmail = useMemo(() => maskEmail(email), [email]);
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const resetSignup = () => {
    setFirstName('');
    setLastName('');
    setBirthday('');
    setGender('');
    setAffiliation('student');
    setInstitutionId('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setSignupStep(1);
    setOtpCountdown(0);
    setPolicyAccepted(false);
    setSignupErrors([]);
  };

  const validateEmail = (value) => {
    const parts = String(value).trim().split('@');
    if (parts.length !== 2) return false;
    return allowedDomains.includes(parts[1].toLowerCase());
  };

  const validateSignupStep = (step) => {
    const errors = [];

    if (step === 1) {
      if (!isValidRealName(firstName)) {
        errors.push('First name is not acceptable. Please input a real name (minimum 3 letters, no numbers).');
      }
      if (!isValidRealName(lastName)) {
        errors.push('Last name is not acceptable. Please input a real name (minimum 3 letters, no numbers).');
      }
      if (!birthday) {
        errors.push('Birthday is required.');
      } else if (!isValidBirthday(birthday)) {
        errors.push('Birthday is not valid. Please select a real date that is not in the future.');
      }
      if (!gender) errors.push('Please select a gender.');
      if (!affiliation) errors.push('Please choose affiliation.');
      if (!institutionId.trim()) {
        errors.push('Institution ID is required.');
      } else if (!/^[A-Za-z0-9-]{6,20}$/.test(institutionId.trim())) {
        errors.push('Institution ID must be 6-20 letters/numbers.');
      }
    }

    if (step === 2) {
      if (!validateEmail(email)) errors.push('Use cvsu.edu.ph, gmail.com, or yahoo.com email.');
      if (password.length < 8 || password.length > 16 || /\s/.test(password)) {
        errors.push('Password must be 8 to 16 characters without spaces.');
      }
      if (passwordStrength.className === 'weak') {
        errors.push('Use a medium or strong password.');
      }
      if (confirmPassword !== password) errors.push('Confirm password must match password.');
      if (!policyAccepted) errors.push('You must accept the Privacy Notice and Terms.');
    }

    if (step === 3) {
      if (!/^\d{6}$/.test(otp)) errors.push('Enter a valid 6-digit OTP.');
    }

    setSignupErrors(errors);
    return errors.length === 0;
  };

  const handleLogin = async () => {
    if (retryAfterSeconds > 0) {
      setMessage(`Too many attempts. Try again in ${retryAfterSeconds}s.`);
      return;
    }

    if (!email || !password) {
      setMessage('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Use cvsu.edu.ph, gmail.com, or yahoo.com email.');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await api.login(email, password);
    setLoading(false);

    if (result.success) {
      const user = result.user && typeof result.user === 'object' ? result.user : null;
      if (!user) {
        setMessage('Login response is missing user data. Please try again.');
        return;
      }

      clearAuth();
      sessionStorage.setItem('user', JSON.stringify(user));
      // Keep a localStorage copy for compatibility across pages and hard refreshes.
      localStorage.setItem('user', JSON.stringify(user));

      const storedUser = getStoredUser();
      if (!storedUser) {
        setMessage('Unable to save login session. Please try again.');
        return;
      }

      const role = storedUser.role || 'student';
      const targetPath = role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
      navigate(targetPath, { replace: true });
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          window.location.assign(targetPath);
        }
      }, 120);
    } else {
      if (result.retry_after_seconds) {
        setRetryAfterSeconds(Number(result.retry_after_seconds) || 0);
      }
      setMessage(result.message || 'Authentication service is currently unavailable. Please try again.');
    }
  };

  const requestSignupOtp = async () => {
    if (!validateSignupStep(2)) return;

    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      birthday: birthday || null,
      gender: gender || null,
      affiliation,
      institution_id: institutionId.trim()
    };

    setLoading(true);
    setMessage('');
    const result = await api.requestSignupOtp(userData);
    setLoading(false);

    if (result.success && result.otp_required) {
      setSignupStep(3);
      setOtpCountdown(60);
      setOtp('');
      setSignupErrors([]);
      setMessage(result.message || 'OTP sent to your email.');
      return;
    }

    if (result.success && !result.otp_required) {
      setMessage('Registration successful! Please login.');
      setAction('Login');
      resetSignup();
      return;
    }

    setMessage(result.message || 'Unable to send OTP right now.');
  };

  const verifySignupOtpAndCreate = async () => {
    if (!validateSignupStep(3)) return;

    const userData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      birthday: birthday || null,
      gender: gender || null,
      affiliation,
      institution_id: institutionId.trim()
    };

    setLoading(true);
    setMessage('');
    const result = await api.verifySignupOtp(userData, otp);
    setLoading(false);

    if (result.success) {
      setMessage('Registration successful! Please login.');
      setAction('Login');
      resetSignup();
    } else {
      setMessage(result.message || 'OTP verification failed.');
    }
  };

  const handleSignupPrimary = async () => {
    if (signupStep === 1) {
      if (!validateSignupStep(1)) return;
      setSignupStep(2);
      setSignupErrors([]);
      return;
    }

    if (signupStep === 2) {
      if (!signupVerificationEnabled) {
        if (!validateSignupStep(2)) return;
        const userData = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          birthday: birthday || null,
          gender: gender || null,
          affiliation,
          institution_id: institutionId.trim()
        };
        setLoading(true);
        setMessage('');
        const result = await api.register(userData);
        setLoading(false);
        if (result.success) {
          setMessage('Registration successful! Please login.');
          setAction('Login');
          resetSignup();
        } else {
          setMessage(result.message || 'Registration failed.');
        }
        return;
      }
      await requestSignupOtp();
      return;
    }

    await verifySignupOtpAndCreate();
  };

  const signupPrimaryText = () => {
    if (loading) return 'Processing...';
    if (signupStep === 1) return 'Continue';
    if (signupStep === 2) return signupVerificationEnabled ? 'Send OTP' : 'Create Account';
    return 'Verify OTP & Sign up';
  };

  const handleSidebarSelect = (item) => {
    setActiveMenuItem(item);
    setSidebarOpen(false);

    if (item === 'home') {
      navigate('/student-dashboard');
      return;
    }

    if (item === 'books') {
      navigate('/student-dashboard/books');
    }
  };

  return (
    <div className="login-shell">
      <button
        type="button"
        className="login-menu-btn"
        aria-label="Toggle menu"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        ☰
      </button>

      <aside className={`login-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Login navigation">
        <div className="login-sidebar-title">Menu</div>
        <button
          type="button"
          className={`login-sidebar-item ${activeMenuItem === 'home' ? 'active' : ''}`}
          onClick={() => handleSidebarSelect('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={`login-sidebar-item ${activeMenuItem === 'books' ? 'active' : ''}`}
          onClick={() => handleSidebarSelect('books')}
        >
          Books
        </button>
      </aside>
      {sidebarOpen && (
        <button type="button" aria-label="Close menu" className="login-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="login-layout">
      <section className="login-visual-pane" aria-hidden="true">
        <div className="login-visual-content">
          <div className="login-visual-eyebrow">Library</div>
          <h1>Explore the books you need.</h1>
          <p>Borrow, track, and manage your library activity in one portal.</p>
        </div>
      </section>

      <section className="login-form-pane">
      <div className="container login-pro">
      <div className="login-brand">Library Portal</div>
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      {action === 'Sign up' && (
        <div className="signup-stepper" aria-label="Signup progress">
          <div className={`signup-step ${signupStep >= 1 ? 'active' : ''}`}>1. Profile</div>
          <div className={`signup-step ${signupStep >= 2 ? 'active' : ''}`}>2. Account</div>
          {signupVerificationEnabled && (
            <div className={`signup-step ${signupStep >= 3 ? 'active' : ''}`}>3. Verify</div>
          )}
        </div>
      )}

      {message && (
        <div className={`status-box ${message.toLowerCase().includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {action === 'Sign up' && signupErrors.length > 0 && (
        <div className="status-box error" role="alert" aria-live="assertive">
          {signupErrors.map((err) => <div key={err}>{err}</div>)}
        </div>
      )}

      <div className="inputs">
        {action === 'Login' ? (
          <>
            <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
              <label htmlFor="login-email" className="login-field-label">Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img src={emailIcon} alt="email icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 1 }} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
              <label htmlFor="login-password" className="login-field-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img src={passIcon} alt="password icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 1 }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={16}
                  style={{ paddingLeft: '40px', paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    marginRight: '-4px',
                    zIndex: 1
                  }}
                >
                  <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                </button>
              </div>
            </div>

            <div className="login-meta-row">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me on this device</span>
              </label>
            </div>
          </>
        ) : (
          <>
            {signupStep === 1 && (
              <>
                <div className="input" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label className="login-field-label" htmlFor="signup-first-name">First Name</label>
                  <input id="signup-first-name" type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <small className="helper-text">Minimum 3 letters, no numbers.</small>
                </div>
                <div className="input" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label className="login-field-label" htmlFor="signup-last-name">Last Name</label>
                  <input id="signup-last-name" type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <small className="helper-text">Minimum 3 letters, no numbers.</small>
                </div>
                <div className="input" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label className="login-field-label" htmlFor="signup-birthday">Birthday</label>
                  <input id="signup-birthday" type="date" value={birthday} max={todayISO} onChange={(e) => setBirthday(e.target.value)} />
                  <small className="helper-text">Use your real birth date (future dates are not allowed).</small>
                </div>

                <fieldset className="segmented-group">
                  <legend>Gender</legend>
                  <label><input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={(e) => setGender(e.target.value)} />Male</label>
                  <label><input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={(e) => setGender(e.target.value)} />Female</label>
                </fieldset>

                <fieldset className="segmented-group">
                  <legend>Affiliation</legend>
                  <label><input type="radio" name="affiliation" value="student" checked={affiliation === 'student'} onChange={(e) => setAffiliation(e.target.value)} />Student</label>
                  <label><input type="radio" name="affiliation" value="faculty" checked={affiliation === 'faculty'} onChange={(e) => setAffiliation(e.target.value)} />Faculty</label>
                  <label><input type="radio" name="affiliation" value="staff" checked={affiliation === 'staff'} onChange={(e) => setAffiliation(e.target.value)} />Staff</label>
                </fieldset>

                <div className="input" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label className="login-field-label" htmlFor="signup-id">Institution ID</label>
                  <input id="signup-id" type="text" placeholder="e.g. 2024-12345" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} maxLength={20} />
                  <small className="helper-text">Used for institutional verification.</small>
                </div>
              </>
            )}

            {signupStep === 2 && (
              <>
                <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
                  <label className="login-field-label" htmlFor="signup-email">Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img src={emailIcon} alt="email icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 1 }} />
                    <input id="signup-email" type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <small className="helper-text">Accepted: cvsu.edu.ph, gmail.com, yahoo.com</small>
                </div>

                <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
                  <label className="login-field-label" htmlFor="signup-password">Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img src={passIcon} alt="password icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 1 }} />
                    <input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={16} style={{ paddingLeft: '40px', paddingRight: '45px', width: '100%', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', marginRight: '-4px', zIndex: 1 }}>
                      <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>

                  <div className="password-strength-row">
                    <div className={`strength-pill ${passwordStrength.className}`}>{passwordStrength.label}</div>
                    <small className="helper-text">Use 8-16 chars, upper/lowercase, number, special char.</small>
                  </div>
                  <ul className="password-checklist">
                    <li className={password.length >= 8 ? 'ok' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? 'ok' : ''}>Uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? 'ok' : ''}>Lowercase letter</li>
                    <li className={/\d/.test(password) ? 'ok' : ''}>Number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? 'ok' : ''}>Special character</li>
                  </ul>
                </div>

                <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
                  <label className="login-field-label" htmlFor="signup-confirm">Confirm Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img src={passIcon} alt="confirm password icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', zIndex: 1 }} />
                    <input id="signup-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} maxLength={16} style={{ paddingLeft: '40px', paddingRight: '45px', width: '100%', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', marginRight: '-4px', zIndex: 1 }}>
                      <i className={showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <label className="policy-check">
                  <input type="checkbox" checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} />
                  <span>By signing up, you agree to our Privacy Notice and Terms.</span>
                </label>
              </>
            )}

            {signupStep === 3 && signupVerificationEnabled && (
              <>
                <div className="locked-summary">
                  <div><strong>Name:</strong> {firstName} {lastName}</div>
                  <div><strong>Email:</strong> {maskedSignupEmail}</div>
                  <div><strong>Affiliation:</strong> {affiliation}</div>
                </div>

                <div className="input" style={{ flexDirection: 'column', position: 'relative' }}>
                  <label className="login-field-label" htmlFor="signup-otp">One-Time Password (OTP)</label>
                  <input id="signup-otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ width: '100%', boxSizing: 'border-box', letterSpacing: '3px' }} />
                  <small className="helper-text">Code expires in 5 minutes.</small>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {action === 'Login' && (
        <div className="forgetpass">
          <span role="button" tabIndex={0} onClick={() => !loading && navigate('/forgot-password')} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !loading && navigate('/forgot-password')}>
            Forgot password?
          </span>
          {' | '}
          <span
            role="button"
            tabIndex={0}
            onClick={() => {
              if (loading) return;
              setAction('Sign up');
              setMessage('');
              resetSignup();
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                setAction('Sign up');
                setMessage('');
                resetSignup();
              }
            }}
          >
            Create account
          </span>
        </div>
      )}

      <div className="submit-container">
        <button
          className="submit"
          type="button"
          disabled={loading || (action === 'Login' && retryAfterSeconds > 0)}
          onClick={() => {
            if (action === 'Login') {
              handleLogin();
            } else {
              handleSignupPrimary();
            }
          }}
        >
          {action === 'Login'
            ? loading
              ? 'Logging in...'
              : retryAfterSeconds > 0
                ? `Try again in ${retryAfterSeconds}s`
                : 'Login'
            : signupPrimaryText()}
        </button>

        {action === 'Sign up' && (
          <button
            className="submit gray"
            type="button"
            disabled={loading}
            onClick={async () => {
              if (signupStep === 3) {
                if (otpCountdown > 0) return;
                await requestSignupOtp();
                return;
              }

              if (signupStep > 1) {
                setSignupStep((prev) => prev - 1);
                setSignupErrors([]);
              } else {
                setAction('Login');
                setMessage('');
                resetSignup();
              }
            }}
          >
            {signupStep === 3 ? (otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP') : signupStep > 1 ? 'Back' : 'Back to Login'}
          </button>
        )}
      </div>

      <div className="login-footer">
        <a href="/privacy" onClick={(e) => e.preventDefault()}>Privacy Notice</a>
        <span>|</span>
        <a href="/terms" onClick={(e) => e.preventDefault()}>Terms</a>
        <span>|</span>
        <a href="mailto:support@library-system.local">Help</a>
      </div>
    </div>
    </section>
    </div>
    </div>
  );
};

export default Login;
