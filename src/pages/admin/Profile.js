import React, { useState } from "react";
import {
  AccountCircleOutlined,
  AddAPhoto,
  Close,
  EmailOutlined,
  Error,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/system";
import moment from "moment";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const Profile = () => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [image, setImage] = useState("");
  const [obj, setObj] = useState(JSON.parse(localStorage.getItem("user")));

  const handleChange = () => {
    setEdit(true);
    setOpen(true);
  };

  const imageChange = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  const discardChanges = () => {
    setOpen(false);
    setEdit(false);
    setImage("");
  };

  const handleClose = () => {
    setOpen(false);
    setEdit(false);
    setImage("");
  };

  return (
    <>
      <div className="p-4">
        {/* Top Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold">Account Information</h4>
          <div className="text-muted">
            Profile created on {moment(obj?.createdAt).format("LLL")}
          </div>
        </div>

        {/* Profile Info */}
        <div className="d-flex flex-row gap-3 align-items-center mb-4">
          {image || obj?.profile_pic ? (
            <img
              src={image || obj?.profile_pic}
              alt="user"
              className="rounded-circle"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          ) : (
            <img
              src="/images/blank_pic.png"
              alt="blank"
              className="rounded-circle"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          )}

          <div>
            <h5 className="mb-1">
              {obj?.username}{" "}
              {obj?.premiumStatus && (
                <Tooltip title="Premium User">
                  <img
                    src="/images/emailVerifiedIcon.svg"
                    alt="verified"
                    style={{ width: "18px", marginLeft: "5px" }}
                  />
                </Tooltip>
              )}
              {obj?.isBlocked && (
                <i
                  style={{ color: "red", marginLeft: "5px" }}
                  className="fa-solid fa-ban"
                ></i>
              )}
            </h5>
            <div className="text-muted d-flex align-items-center">
              <EmailOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
              {obj?.email}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="text-end mb-3">
          {!edit && (
            <button className="btn btn-primary px-4" onClick={handleChange}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Info Section */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            {/* Empty Left Column for future */}
          </Grid>
          <Grid item xs={12} md={8}>
            <div className="mb-3">
              <label className="fw-semibold d-flex align-items-center mb-1">
                <AccountCircleOutlined
                  style={{ marginRight: "5px", fontSize: "20px" }}
                />{" "}
                User Name
              </label>
              <input
                type="text"
                disabled
                value={obj?.username}
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label className="fw-semibold d-flex align-items-center mb-1">
                <EmailOutlined
                  style={{ marginRight: "5px", fontSize: "20px" }}
                />{" "}
                Email
              </label>
              <input
                type="text"
                disabled
                value={obj?.email}
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label className="fw-semibold d-flex align-items-center mb-1">
                <PersonOutlineOutlined
                  style={{ marginRight: "5px", fontSize: "20px" }}
                />{" "}
                Role
              </label>
              <input
                type="text"
                disabled
                value={obj?.role}
                className="form-control"
              />
            </div>
          </Grid>
        </Grid>

        {/* Edit Modal */}
        <BootstrapDialog open={open} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Profile</DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5} className="text-center">
                <img
                  src={image || "/images/blank_pic.png"}
                  alt="preview"
                  className="rounded-circle mb-2"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
                <label htmlFor="uploadImage">
                  <Tooltip title="Click to change image">
                    <AddAPhoto style={{ cursor: "pointer" }} />
                  </Tooltip>
                </label>
                <input
                  id="uploadImage"
                  onChange={imageChange}
                  accept="image/*"
                  type="file"
                  style={{ display: "none" }}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <div className="mb-3">
                  <label className="fw-semibold">Name</label>
                  <input
                    type="text"
                    value={obj?.name}
                    onChange={(e) => setObj({ ...obj, name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="fw-semibold">Email</label>
                  <input
                    type="text"
                    disabled
                    value={obj?.email}
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="fw-semibold">Role</label>
                  <select
                    value={obj?.role}
                    className="form-control"
                    onChange={(e) => setObj({ ...obj, role: e.target.value })}
                  >
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="text-danger small d-flex align-items-center">
                  <Error style={{ fontSize: "16px", marginRight: "5px" }} />
                  All fields are required!
                </div>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <button className="btn btn-secondary" onClick={discardChanges}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setOpen(false)}
              autoFocus
            >
              Save
            </button>
          </DialogActions>
        </BootstrapDialog>
      </div>
    </>
  );
};

export default Profile;
