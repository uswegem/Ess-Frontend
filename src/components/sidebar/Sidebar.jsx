import "./sidebar.css";

import { NavLink } from "react-router-dom";

import {
  EqualizerOutlined,
  PeopleOutline,
  RoomService,
  MessageOutlined,
} from "@mui/icons-material";
import { HandCoins, ShoppingCart } from "lucide-react";

export default function Sidebar() {

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        <div className="sidebarMenu">
          <NavLink to="/dashboard">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <EqualizerOutlined className="icon" />
                <span>Dashboard</span>
              </div>
            </div>
          </NavLink>
        </div>
        <div className="sidebarMenu">
          <NavLink to="/users">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <PeopleOutline className="icon" />
                <span>Users</span>
              </div>
            </div>
          </NavLink>
        </div>
        <div className="sidebarMenu">
          <NavLink to="/products">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <ShoppingCart className="icon" />
                <span>Products</span>
              </div>
            </div>
          </NavLink>
        </div>
        <div className="sidebarMenu">
          <NavLink to="/loan">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <HandCoins className="icon" />
                <span>Loans</span>
              </div>
            </div>
          </NavLink>
        </div>
        <div className="sidebarMenu">
          <NavLink to="/notifications">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <RoomService className="icon" />
                <span>Notifications</span>
              </div>
            </div>
          </NavLink>
        </div>
        <div className="sidebarMenu">
          <NavLink to="/messages/pending">
            <div className="sidebarSelect">
              <div className="sidebarSelectHead">
                <MessageOutlined className="icon" />
                <span>Messages</span>
              </div>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
