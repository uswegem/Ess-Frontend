import React, { useEffect } from "react";
import "./topbar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { Button, Menu, MenuItem } from "@mui/material";
import { Person, Key, Logout } from "@mui/icons-material";
import { setCount } from "../../slice/count";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../slice/userInfo";

export default function Topbar() {
  const user = useSelector((state) => state.userinfo.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const logoutClick = async (e) => {
    try {
      localStorage.removeItem("adminToken");
      localStorage.clear();
      navigate("/");
      return
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    dispatch(setCount(JSON.parse(localStorage.getItem("count"))));
    dispatch(setUser(JSON.parse(localStorage.getItem("user"))));
  }, [dispatch]);

  return (
    <div className="topbarWrapper">
      <div className="logoContainer">
        <span className="spanName">
          MiraCore
        </span>
      </div>
      <div className="topRight">
        <Button
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          sx={{ shadow: "none" }}
        >
          {user?.name || 'Admin'}
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <NavLink to="/my-profile" className="link">
            <div>
              <MenuItem onClick={handleClose}>
                <Person className="menuIcons" />
                Profile
              </MenuItem>
            </div>
          </NavLink>
          <NavLink to="/change-password" className="link">
            <div>
              <MenuItem onClick={handleClose}>
                <Key className="menuIcons" />
                Change Password
              </MenuItem>
            </div>
          </NavLink>
          <MenuItem onClick={logoutClick}>
            <Logout className="menuIcons" />
            Logout
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
