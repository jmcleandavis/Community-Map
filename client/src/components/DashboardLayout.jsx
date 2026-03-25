import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EventIcon from '@mui/icons-material/Event';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import { logger } from '../utils/logger';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 64;

const navItems = [
  { label: 'About', path: '/about', icon: <InfoOutlinedIcon /> },
  { label: 'Community Sales Events', path: '/list-active-community-sales-events', icon: <EventIcon /> },
  { label: 'Garage Sales', path: '/single-garage-sales', icon: <StorefrontIcon />, prefetch: true },
  { label: 'Register a Garage Sale', path: '/register-garage-sale', icon: <AddBusinessIcon />, authRequired: true },
];

const adminItems = [
  { label: 'Manage Community Sales', path: '/admin/community-sales', icon: <SettingsIcon /> },
];

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { setFromLanding } = useNavigation();
  const { currentCommunityId } = useCommunitySales();

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const handleNavigation = async (item) => {
    setFromLanding(true);

    if (item.prefetch) {
      try {
        const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/getAddressByCommunity/GENPUB`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'app-name': 'web-service',
            'app-key': import.meta.env.VITE_APP_SESSION_KEY,
          },
        });
        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('garageSalesData', JSON.stringify(data));
        }
      } catch (error) {
        logger.error('[DashboardLayout] Error prefetching garage sales:', error);
      }
    }

    if (item.authRequired && !isAuthenticated) {
      navigate(`/login?returnTo=${item.path}`);
    } else {
      navigate(item.path);
    }

    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setFromLanding(true);
    setTimeout(() => {
      window.location.href = '/about';
    }, 100);
  };

  const handleReturnToMap = () => {
    navigate(`/?communityId=${currentCommunityId || ''}`);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open || isMobile ? 'space-between' : 'center',
          px: 1,
          minHeight: '64px !important',
        }}
      >
        {(open || isMobile) && (
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4285f4, #34a853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem',
              pl: 1,
            }}
          >
            Community Map
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon
              sx={{
                transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (item.authRequired && !isAuthenticated) return null;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item)}
                selected={isActive}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: open || isMobile ? 'initial' : 'center',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open || isMobile ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(open || isMobile) && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} />}
              </ListItemButton>
            </ListItem>
          );
        })}

        {isAuthenticated && (
          <>
            <Divider sx={{ my: 1, mx: 2 }} />
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item)}
                    selected={isActive}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      minHeight: 44,
                      justifyContent: open || isMobile ? 'initial' : 'center',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open || isMobile ? 2 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? 'inherit' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {(open || isMobile) && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
      </List>

      <Divider />

      <List sx={{ pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleReturnToMap}
            sx={{
              mx: 1,
              borderRadius: 2,
              minHeight: 44,
              justifyContent: open || isMobile ? 'initial' : 'center',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open || isMobile ? 2 : 'auto',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <MapIcon />
            </ListItemIcon>
            {(open || isMobile) && <ListItemText primary="View Map" primaryTypographyProps={{ fontSize: '0.9rem' }} />}
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={isAuthenticated ? handleLogout : () => navigate('/login?from=landing')}
            sx={{
              mx: 1,
              borderRadius: 2,
              minHeight: 44,
              justifyContent: open || isMobile ? 'initial' : 'center',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open || isMobile ? 2 : 'auto',
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              {isAuthenticated ? <LogoutIcon /> : <LoginIcon />}
            </ListItemIcon>
            {(open || isMobile) && (
              <ListItemText
                primary={isAuthenticated ? 'Logout' : 'Login'}
                primaryTypographyProps={{ fontSize: '0.9rem' }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const currentDrawerWidth = open ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentDrawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {getPageTitle(location.pathname)}
            </Typography>
            {isAuthenticated ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login?from=landing')}
                sx={{ textTransform: 'none' }}
              >
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

function getPageTitle(pathname) {
  const titles = {
    '/about': 'About',
    '/landing': 'About',
    '/info': 'Information',
    '/help': 'Help',
    '/list-active-community-sales-events': 'Community Sales Events',
    '/login': 'Login',
    '/reset-password': 'Reset Password',
    '/sales': 'Community Garage Sales',
    '/single-garage-sales': 'Garage Sales',
    '/register-garage-sale': 'Register a Garage Sale',
    '/admin/community-sales': 'Manage Community Sales',
    '/admin/sales': 'Manage Garage Sales',
    '/admin/bulk-upload': 'Bulk Upload',
  };
  return titles[pathname] || '';
}

export default DashboardLayout;
