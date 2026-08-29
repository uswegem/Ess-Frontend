import './login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItemButton, ListItemText,
} from '@mui/material';
import { LoginPaper } from '../../components/Styles';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUser } from '../../slice/userInfo';
import { setAuthSession } from '../../slice/authSlice';
import { login, selectTenant } from '../../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [view, setView] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);
  const [obj, setObj] = useState({ username: '', password: '' });

  const handleView = () => setView(!view);

  const inputEvent = (e) => {
    setObj({ ...obj, [e.target.name]: e.target.value });
  };

  const applySession = (session) => {
    dispatch(setUser(session.user));
    dispatch(setAuthSession(session));
    navigate('/dashboard');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const toastId = toast.loading('Authenticating...');
    try {
      const session = await login(obj);
      toast.success('Login successful!', { id: toastId });

      const memberships = session.memberships || [];
      if (!session.activeTenant && memberships.length > 1) {
        setPendingSession(session);
        return;
      }
      applySession(session);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    }
  };

  const handleTenantPick = async (tenantId) => {
    try {
      const switched = await selectTenant(tenantId);
      const session = {
        ...pendingSession,
        token: switched.token,
        refreshToken: switched.refreshToken,
        activeTenant: switched.activeTenant,
        permissions: switched.permissions,
        authContext: switched.authContext,
      };
      setPendingSession(null);
      applySession(session);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <div className="loginBg">
        <Container maxWidth="xs">
          <LoginPaper data-aos="zoom-in">
            <form onSubmit={submitForm} method="post">
              <div className="login-page">
                <div className="loginBrand">
                  <img src="/images/miraadmin-logo.ico" alt="MiraAdmin logo" className="loginLogoMark" />
                  <div className="loginWordmark">MiraAdmin</div>
                  <div className="loginSubtitle">Sign in to your admin account</div>
                </div>
                <div className="fields">
                  <label>
                    Username
                    <input
                      required
                      autoComplete="username"
                      type="text"
                      id="username"
                      name="username"
                      placeholder="username"
                      onChange={inputEvent}
                    />
                  </label>
                  <label>
                    Password
                    <div className="w-100 view">
                      <input
                        required
                        type={view ? 'text' : 'password'}
                        autoComplete="current-password"
                        id="password"
                        name="password"
                        placeholder="********"
                        onChange={inputEvent}
                      />
                      <i
                        className={!view ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                        onClick={handleView}
                        role="button"
                        tabIndex={0}
                        onKeyDown={() => {}}
                      />
                    </div>
                  </label>
                  <div className="forgotPassword">
                    <span onClick={() => navigate('/forgot-password')}>Forgot password?</span>
                  </div>
                  <button type="submit" className="custom-button w-100">
                    Sign In
                  </button>
                </div>
              </div>
            </form>
          </LoginPaper>
        </Container>
      </div>

      <Dialog open={Boolean(pendingSession)} onClose={() => {}}>
        <DialogTitle>Select FSP tenant</DialogTitle>
        <DialogContent>
          <List>
            {(pendingSession?.memberships || []).map((m) => (
              <ListItemButton key={m.tenantId} onClick={() => handleTenantPick(m.tenantId)}>
                <ListItemText
                  primary={m.tenantName || m.tenantId}
                  secondary={`${m.fspCode} — ${m.role}`}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingSession(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
