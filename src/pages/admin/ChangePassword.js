import React, { useState } from 'react';
import { BackPaper, DetailData } from '../../components/Styles';
import { Grid } from '@mui/material';
import toast from 'react-hot-toast';
import { changePassword } from '../../services/authService';

export default function ChangePassword() {
  const [message, setMessage] = useState('');
  const [obj, setObj] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const inputEvent = (e) => {
    setObj({ ...obj, [e.target.name]: e.target.value });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      if (obj.newPassword.length < 8) {
        setMessage('New password must be at least 8 characters.');
        return;
      }
      if (obj.newPassword !== obj.confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
      await changePassword({
        currentPassword: obj.currentPassword,
        newPassword: obj.newPassword,
      });
      toast.success('Password changed');
      setObj({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <BackPaper>
      <form onSubmit={submitForm}>
        <Grid container direction="column" justifyContent="center" alignItems="flex-start">
          <Grid item><div className="text-Change">Change Password</div></Grid>
          <Grid item><DetailData className="mt-4">Current Password</DetailData></Grid>
          <Grid item style={{ width: '40%' }}>
            <input required type="password" name="currentPassword" onChange={inputEvent} className="detailBarInput" value={obj.currentPassword} />
          </Grid>
          <Grid item><DetailData className="mt-4">New Password</DetailData></Grid>
          <Grid item style={{ width: '40%' }}>
            <input required type="password" name="newPassword" onChange={inputEvent} className="detailBarInput" value={obj.newPassword} />
          </Grid>
          <Grid item><DetailData className="mt-4">Confirm New Password</DetailData></Grid>
          <Grid item style={{ width: '40%' }}>
            <input required type="password" name="confirmPassword" onChange={inputEvent} className="detailBarInput" value={obj.confirmPassword} />
          </Grid>
          <Grid item>{message && <div className="errText">{message}</div>}</Grid>
          <Grid item><button type="submit" className="custom-button mt-2">Set Password</button></Grid>
        </Grid>
      </form>
    </BackPaper>
  );
}
