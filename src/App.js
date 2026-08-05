import * as React from 'react';
import './app.css';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Routing from './Routing.js';
import Sidebar from './components/sidebar/Sidebar';
import Topbar from './components/topbar/Topbar';
import Login from './pages/login/Login.jsx';
import { Navigate, useLocation } from 'react-router-dom';
import { MenuOpen } from '@mui/icons-material';
import { Toaster } from 'react-hot-toast';
import { useIdleLogout } from './hooks/useIdleLogout';
import IdleLogoutWarning from './components/security/IdleLogoutWarning';
import { logout } from './services/authService';

// 15 min idle timeout, 1 min warning countdown before forced logout - app-wide, not
// specific to one feature (this app can trigger irreversible actions like loan liquidation).
const IDLE_LOGOUT_TIMEOUT_MS = 15 * 60 * 1000;
const IDLE_LOGOUT_WARNING_MS = 60 * 1000;

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);


const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  background: theme.palette.primary.dark,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));





export default function App() {
  const router = useLocation();
  const [open, setOpen] = React.useState(true);
  const auth = localStorage.getItem("adminToken")
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleResize = () => {
    if (window.innerWidth < 1020) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }
  React.useEffect(() => {
    window.addEventListener("resize", handleResize)
  })

  const idleLogoutEnabled = Boolean(auth) && router.pathname !== "/";
  const { showWarning, countdown, stayLoggedIn, logoutNow } = useIdleLogout({
    enabled: idleLogoutEnabled,
    timeout: IDLE_LOGOUT_TIMEOUT_MS,
    warningTime: IDLE_LOGOUT_WARNING_MS,
    onLogout: () => {
      logout().finally(() => {
        window.location.replace('/');
      });
    },
  });

  return (
    <>
      <IdleLogoutWarning
        open={idleLogoutEnabled && showWarning}
        countdown={countdown}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={logoutNow}
      />
      <Toaster
        toastOptions={{
          className: '',
          style: {
            padding: '16px',
            color: '#713200',
            width:"100%",
            fontFamily:"system-ui",
            fontSize:"14px",
            fontWeight:"500"
          },
        }}
      />
      {router.pathname !== "/"
        ?
        <Box sx={{
          display: 'flex',
          height: '100%'
        }}>
          <CssBaseline />
          <AppBar className="PanelTopBar" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              {open === false
                ?
                <IconButton
                  aria-label="open drawer"
                  onClick={handleDrawerOpen}
                  edge="start"
                  sx={{ mr: 2, color: "primary.contrastText", ...(open && { display: 'none' }) }}
                >
                  <MenuIcon className='topBarIcon' />
                </IconButton>
                :
                <IconButton
                  onClick={handleDrawerClose}
                  edge="start"
                  sx={{ mr: 2, color: "primary.contrastText" }}
                >
                  <MenuOpen className='topBarIcon' />
                </IconButton>
              }
              <Topbar />
            </Toolbar>
          </AppBar>

          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },

            }}
            variant="persistent"
            anchor="left"
            open={open}
          >
            <Divider />
            <IconButton onClick={handleDrawerClose}>
              <MenuOpen sx={{ position: 'left' }} />
            </IconButton>
            <Sidebar />
          </Drawer>

          <Main open={open}>
            <Toolbar/>
            <Routing />
          </Main>
        </Box>
        : router.pathname === "/" && auth
          ?
          <Navigate to="/dashboard"></Navigate>
          :
          <Login />
      }
    </>
  )
}

