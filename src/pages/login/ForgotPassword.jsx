import './login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import { LoginPaper } from '../../components/Styles';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../services/authService';

// Matches Login.jsx's current visual pattern (LoginPaper + login.css classes) rather than
// the not-yet-implemented redesign tokens - the broader Login/App-Shell restyle is a
// separate, paused piece of work; once it proceeds this page should get the same treatment
// then, so it doesn't sit visually inconsistent with an already-restyled Login page.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Backend always returns the same generic message whether or not the email is registered
  // (avoids account enumeration) - once submitted, just show that message and stop, rather
  // than looping back to a re-editable form that implies "try a different email".
  const [submitted, setSubmitted] = useState(false);

  const submitForm = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await forgotPassword(email);
      setSubmitted(true);
      toast.success(result.message);
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
              <div className="loginSubtitle">Forgot Password</div>
            </div>

            {submitted ? (
              <div className="fields">
                <p style={{ textAlign: 'center', fontSize: 13, color: '#475467', margin: 0 }}>
                  If an account exists for that email, a reset link has been sent. Check your
                  inbox and follow the link to set a new password.
                </p>
                <button
                  type="button"
                  className="custom-button w-100"
                  onClick={() => navigate('/')}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={submitForm}>
                <div className="fields">
                  <label>
                    Email
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="custom-button w-100" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Reset Link'}
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
