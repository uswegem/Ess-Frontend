import React from "react";
import "./toptag.css";
import { useLocation, NavLink as RouterLink } from "react-router-dom";
import { Breadcrumbs, Typography, Link } from "@mui/material";

function toTitleCase(str) {
  return str.replace(/\b\w+/g, function (s) {
    return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
  });
}

export default function Toptag() {
  let location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      <div className="topNavigator">
        <div className="pTag">
          <Breadcrumbs aria-label="Breadcrumb">
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;

              return last ? (
                <Typography
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color:"black",
                    gap: "15px",
                    textDecoration:"none",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  color={value === "home" ? "black" : "#636363"}
                  key={index}
                >
                  
                  {toTitleCase(value)}
                </Typography>
              ) : (
                <Link
                  color="inherit"
                  component={RouterLink}
                  to={to}
                  key={index}
                >
                  <Typography
                    color={value === "home" ? "black" : "#636363"}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color:"black",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      "&.active": {
                        transform: "scale(0.95)",
                      },
                    }}
                  >
                    {toTitleCase(value)}
                  </Typography>
                </Link>
              );
            })}
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
}
