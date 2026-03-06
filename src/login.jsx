<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
import emailIcon from "./Components/email.png";
import passIcon from "./Components/password.png";
import './login.css';
import { api } from './api';

const Login = () => {
<<<<<<< HEAD
=======
  const navigate = useNavigate();
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
  const [action, setAction] = useState("Login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Additional fields for signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
<<<<<<< HEAD
  const [signupVerificationEnabled, setSignupVerificationEnabled] = useState(true);

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
=======
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552

  const resetSignupState = () => {
    setOtp("");
    setOtpSent(false);
  };

  // ================= EMAIL VALIDATION =================
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    const allowedDomains = ["cvsu.edu.ph", "gmail.com", "yahoo.com"];
    const parts = value.split("@");

    if (parts.length !== 2) {
      setEmailError("");
      return;
    }

    const domain = parts[1].toLowerCase();

    if (!allowedDomains.includes(domain)) {
      setEmailError("Email must be cvsu.edu.ph, gmail.com or yahoo.com");
    } else {
      setEmailError("");
    }
  };

  // ================= PASSWORD VALIDATION =================
  const handlePasswordChange = (e) => {
    let value = e.target.value;

    // Remove spaces automatically
    if (value.includes(" ")) {
      setPasswordError("Password cannot contain spaces");
      value = value.replace(/\s/g, "");
    }

    setPassword(value);

    if (value.length < 8 || value.length > 16) {
      setPasswordError("Password must be 8 to 16 characters");
    } else {
      setPasswordError("");
    }

    // Check match
    if (confirmPassword && value !== confirmPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  };

  // ================= CONFIRM PASSWORD =================
  const handleConfirmChange = (e) => {
    let value = e.target.value;

    if (value.includes(" ")) {
      setConfirmError("Password cannot contain spaces");
      value = value.replace(/\s/g, "");
    }

    setConfirmPassword(value);

    if (password !== value) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  };

  // ================= HANDLE LOGIN =================
  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please fill in all fields");
      return;
    }

    if (emailError || passwordError) {
      setMessage("Please fix the errors above");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await api.login(email, password);
    
    setLoading(false);
    
    if (result.success) {
      setMessage("Login successful!");
      console.log("User:", result.user);
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(result.user));
      // Redirect based on role
      const role = result.user.role || 'student';
      if (role === 'admin') {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/student-dashboard';
      }
    } else {
      setMessage(result.message);
    }
  };

  // ================= HANDLE SIGNUP =================
  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setMessage("Please fill in all fields");
      return;
    }

    if (emailError || passwordError || confirmError) {
      setMessage("Please fix the errors above");
      return;
    }

    setLoading(true);
    setMessage("");

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      birthday: birthday || null,
      gender: gender || null
    };
    let result;
<<<<<<< HEAD
    if (!signupVerificationEnabled || !otpSent) {
=======
    if (!otpSent) {
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
      result = await api.requestSignupOtp(userData);
    } else {
      if (!/^\d{6}$/.test(otp)) {
        setLoading(false);
        setMessage("Enter a valid 6-digit OTP");
        return;
      }
      result = await api.verifySignupOtp(userData, otp);
    }
    
    setLoading(false);
    
    if (result.success && result.otp_required) {
      setOtpSent(true);
      setMessage(result.message || "OTP sent to your email.");
      return;
    }

    if (result.success) {
      setMessage("Registration successful! Please login.");
      setAction("Login");
      resetSignupState();
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBirthday("");
      setGender("");
<<<<<<< HEAD
      setOtp("");
=======
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
    } else {
      setMessage(result.message);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      {/* Status Message */}
      {message && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '15px',
          color: message.includes('successful') ? '#7cff0e' : '#ff6b6b',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div className="inputs">

        {action === "Login" ? (
          <>
            {/* EMAIL */}
            <div className="input" style={{ flexDirection: "column", position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <img 
                  src={emailIcon} 
                  alt="email icon" 
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", zIndex: 1 }} 
                />
                <input
                  type="email"
                  placeholder="Email ID"
                  value={email}
                  onChange={handleEmailChange}
                  style={{ paddingLeft: "40px", width: "100%", boxSizing: "border-box" }}
                />
              </div>
              {emailError && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {emailError}
                </span>
              )}
            </div>

            {/* PASSWORD */}
            <div className="input" style={{ flexDirection: "column", position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <img 
                  src={passIcon} 
                  alt="password icon" 
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", zIndex: 1 }} 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  maxLength={16}
                  style={{ paddingLeft: "40px", paddingRight: "45px", width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    opacity: 1,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    marginRight: "-4px",
                    zIndex: 1
                  }}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
              {passwordError && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {passwordError}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="input">
              <input 
                type="text" 
                placeholder="First Name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="input">
              <input 
                type="text" 
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)} 
              />
            </div>

            <div className="input">
              <label>Birthday:</label>
              <input 
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)} 
              />
            </div>

            <div className="input">
              <label>Gender:</label>
              <input 
                type="radio" 
                name="gender" 
                value="male"
                checked={gender === "male"}
                onChange={(e) => setGender(e.target.value)}
              /> Male
              <input 
                type="radio" 
                name="gender" 
                value="female"
                checked={gender === "female"}
                onChange={(e) => setGender(e.target.value)}
              /> Female
            </div>

            {/* EMAIL */}
            <div className="input" style={{ flexDirection: "column", position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <img 
                  src={emailIcon} 
                  alt="email icon" 
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", zIndex: 1 }} 
                />
                <input
                  type="email"
                  placeholder="Email ID"
                  value={email}
                  onChange={handleEmailChange}
                  style={{ paddingLeft: "40px", width: "100%", boxSizing: "border-box" }}
                />
              </div>
              {emailError && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {emailError}
                </span>
              )}
            </div>

            {/* PASSWORD */}
            <div className="input" style={{ flexDirection: "column", position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <img 
                  src={passIcon} 
                  alt="password icon" 
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", zIndex: 1 }} 
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  maxLength={16}
                  style={{ paddingLeft: "40px", paddingRight: "45px", width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    opacity: 1,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    marginRight: "-4px",
                    zIndex: 1
                  }}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
              {passwordError && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {passwordError}
                </span>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="input" style={{ flexDirection: "column", position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <img 
                  src={passIcon} 
                  alt="confirm password icon" 
                  style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", zIndex: 1 }} 
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                  maxLength={16}
                  style={{ paddingLeft: "40px", paddingRight: "45px", width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    opacity: 1,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    marginRight: "-4px",
                    zIndex: 1
                  }}
                >
                  <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
              {confirmError && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {confirmError}
                </span>
              )}
            </div>

<<<<<<< HEAD
            {signupVerificationEnabled && otpSent && (
=======
            {otpSent && (
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
              <div className="input" style={{ flexDirection: "column", position: "relative" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    style={{ width: "100%", boxSizing: "border-box", letterSpacing: "3px" }}
                  />
                </div>
                <span style={{ color: "#ddd", fontSize: "12px" }}>
                  Check your email for the OTP (valid for 5 minutes).
                </span>
              </div>
            )}
          </>
        )}

      </div>

      {action === "Login" && (
        <div className="forgetpass">
          Forgot Password? <span>Click here!</span>
        </div>
      )}

      <div className="submit-container">
        <div
          className={action === "Login" ? "submit gray" : "submit"}
          onClick={() => {
<<<<<<< HEAD
            if (loading) {
              return;
            }
=======
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
            if (action === "Login") {
              setAction("Sign up");
              setMessage("");
              resetSignupState();
            } else {
              handleSignup();
            }
          }}
        >
<<<<<<< HEAD
          {loading && action === "Sign up"
            ? "Processing..."
            : action === "Login"
              ? "Sign up"
              : !signupVerificationEnabled
                ? "Create Account"
              : otpSent
                ? "Verify OTP & Sign up"
                : "Send OTP"}
=======
          {action === "Login" ? "Sign up" : otpSent ? "Verify OTP & Sign up" : "Send OTP"}
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
        </div>

        <div
          className={action === "Sign up" ? "submit gray" : "submit"}
          type="button"
          onClick={() => {
<<<<<<< HEAD
            if (loading) {
              return;
            }
=======
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
            if (action === "Sign up") {
              setAction("Login");
              setMessage("");
              resetSignupState();
            } else {
              handleLogin();
            }
          }}
        >
<<<<<<< HEAD
          {loading && action === "Login" ? "Logging in..." : "Login"}
        </div>
      </div>

      {action === "Sign up" && signupVerificationEnabled && otpSent && (
=======
          Login
        </div>
      </div>

      {action === "Sign up" && otpSent && (
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
        <div className="submit-container" style={{ marginTop: "10px" }}>
          <div
            className="submit gray"
            onClick={async () => {
<<<<<<< HEAD
              if (loading) {
                return;
              }
=======
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
              if (!firstName || !lastName || !email || !password || !confirmPassword) {
                setMessage("Please complete signup details before resending OTP");
                return;
              }
              setLoading(true);
              setMessage("");
              const userData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                birthday: birthday || null,
                gender: gender || null
              };
              const result = await api.requestSignupOtp(userData);
              setLoading(false);
              setMessage(result.message || (result.success ? "OTP resent." : "Failed to resend OTP"));
            }}
          >
<<<<<<< HEAD
            {loading ? "Sending..." : "Resend OTP"}
=======
            Resend OTP
>>>>>>> 0d7331d11a6e03c0ce33d9cdecd05482a0d68552
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
