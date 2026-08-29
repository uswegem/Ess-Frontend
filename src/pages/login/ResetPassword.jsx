import './login.css';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '@mui/material';
import { LoginPaper } from '../../components/Styles';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/authService';

// Matches Login.jsx's current visual pattern - see ForgotPassword.jsx for the same note on
// why this isn't using the (not yet implemented) redesign tokens.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const inputEvent = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Client-side only - the backend's own schema-level minlength:6 on User.password is the
  // real enforcement, same as every other password entry point in this app (login/change-
  // password don't enforce complexity beyond that either). This is just to catch obvious
  // mismatches/too-short entries before round-tripping to the server.
  const validate = () => {
    if (!form.newPassword || form.newPassword.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (form.newPassword !== form.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error('This reset link is missing its token. Please request a new one.');
      return;
    }
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword(token, form.newPassword);
      toast.success(result.message || 'Password reset - please log in.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="loginBg">
      <Container maxWidth="xs">
        <LoginPaper data-aos="zoom-in">
          <div className="login-page">
            <div className="loginBrand">
              <img src="/images/miraadmin-logo.ico" alt="MiraAdmin logo" className="loginLogoMark" />
              <div className="loginWordmark">MiraAdmin</div>
              <div className="loginSubtitle">Reset Password</div>
            </div>

            {!token ? (
              <div className="fields">
                <p style={{ textAlign: 'center', fontSize: 13, color: '#475467', margin: 0 }}>
                  This reset link is invalid or missing its token.
                </p>
                <button
                  type="button"
                  className="custom-button w-100"
                  onClick={() => navigate('/forgot-password')}
                >
                  Request a new link
                </button>
              </div>
            ) : (
              <form onSubmit={submitForm}>
                <div className="fields">
                  <label>
                    New Password
                    <input
                      required
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      placeholder="********"
                      autoComplete="new-password"
                      onChange={inputEvent}
                    />
                  </label>
                  <label>
                    Confirm New Password
                    <input
                      required
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="********"
                      autoComplete="new-password"
                      onChange={inputEvent}
                    />
                  </label>
                  <button type="submit" className="custom-button w-100" disabled={submitting}>
                    {submitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <div className="forgotPassword" style={{ textAlign: 'center' }}>
                    <span onClick={() => navigate('/')}>Back to Sign In</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </LoginPaper>
      </Container>
    </div>
  );
}
