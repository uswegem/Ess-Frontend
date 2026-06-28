import React, { useEffect, useState } from 'react';
import { EmailOutlined, PersonOutlineOutlined, AccountCircleOutlined } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { getProfile } from '../../services/authService';

export default function Profile() {
  const authUser = useSelector((state) => state.auth.user);
  const [obj, setObj] = useState(authUser || {});

  useEffect(() => {
    getProfile().then((data) => {
      setObj(data.user || {});
    }).catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <h4 className="fw-bold mb-3">Account Information</h4>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <div className="mb-3">
            <label className="fw-semibold d-flex align-items-center mb-1">
              <AccountCircleOutlined style={{ marginRight: 5 }} /> Username
            </label>
            <input type="text" disabled value={obj?.username || ''} className="form-control" />
          </div>
          <div className="mb-3">
            <label className="fw-semibold d-flex align-items-center mb-1">
              <EmailOutlined style={{ marginRight: 5 }} /> Email
            </label>
            <input type="text" disabled value={obj?.email || ''} className="form-control" />
          </div>
          <div className="mb-3">
            <label className="fw-semibold d-flex align-items-center mb-1">
              <PersonOutlineOutlined style={{ marginRight: 5 }} /> Full Name
            </label>
            <input type="text" disabled value={obj?.fullName || ''} className="form-control" />
          </div>
          <div className="mb-3">
            <label className="fw-semibold">Role</label>
            <input type="text" disabled value={obj?.role || ''} className="form-control" />
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
