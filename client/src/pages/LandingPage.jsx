import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  Divider,
  Avatar,
  Link,
  Grid,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import GroupsIcon from '@mui/icons-material/Groups';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import ShareIcon from '@mui/icons-material/Share';
import BoltIcon from '@mui/icons-material/Bolt';
import ExploreIcon from '@mui/icons-material/Explore';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { logger } from '../utils/logger';
import communityMapImage from '../assets/community-map-example.jpg';
import { useNavigation } from '../context/NavigationContext';
import { useCommunitySales } from '../context/CommunitySalesContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setFromLanding, fromMap } = useNavigation();
  const { currentCommunityId } = useCommunitySales();

  useEffect(() => {
    sessionStorage.setItem('initialPage', '/landing');
    logger.log('[LandingPage] Recorded initial page as "/landing" in sessionStorage');
  }, []);

  const handleNavigation = (path) => {
    setFromLanding(true);
    navigate(path);
  };

  const communitySteps = [
    { icon: <GroupsIcon />, title: 'Create an Account', desc: "Sign up for a free account to get started. It only takes a minute and you'll be ready to create your first community sale event." },
    { icon: <AddLocationAltIcon />, title: 'Set Up Your Community Sale', desc: 'Create a new community sale event with details like name, date, and location. This will be the main hub for all the individual garage sales.' },
    { icon: <MapIcon />, title: 'Add Garage Sales', desc: 'Add individual garage sales to your community event by entering addresses and descriptions. Our system automatically places them on the map.' },
    { icon: <ShareIcon />, title: 'Share With Your Community', desc: 'Your garage sale will be added to our public listing where visitors can browse all active sales. Shoppers can select multiple sales they want to visit and view them on an interactive map.' },
  ];

  const individualSteps = [
    { num: 1, title: 'Create an Account', desc: "Sign up for a free account to get started. It only takes a minute." },
    { num: 2, title: 'Click Register a Garage Sale', desc: 'Use the sidebar navigation to register your garage sale and add it to our public listing.' },
    { num: 3, title: 'Enter Your Garage Sale Details', desc: 'Enter your garage sale details such as the name, date, and location. Our system will automatically place it on the map.' },
    { num: 4, title: 'Get Listed With All Other Garage Sales', desc: 'Your garage sale will be added to our public listing where visitors can browse all active sales and plan their route.' },
  ];

  const features = [
    { icon: <MapIcon color="primary" />, title: 'Interactive Maps', desc: 'Fully interactive Google Maps integration that makes it easy for visitors to explore and find sales.' },
    { icon: <EditIcon color="primary" />, title: 'Sale Management', desc: 'Easy-to-use tools for adding, editing, and removing garage sales from your community event.' },
    { icon: <SearchIcon color="primary" />, title: 'Search Functionality', desc: 'Visitors can search for specific items or categories to find exactly what they\'re looking for.' },
    { icon: <PhoneIphoneIcon color="primary" />, title: 'Mobile Friendly', desc: 'Responsive design works great on smartphones and tablets, perfect for visitors on the go.' },
  ];

  const individualFeatures = [
    { icon: <BoltIcon />, title: 'Quick Listing', desc: 'Create a listing in minutes with just a few details about your sale.' },
    { icon: <ExploreIcon />, title: 'Easy Discovery', desc: 'Get your sale noticed by local shoppers searching for garage sales in your area.' },
    { icon: <PhoneIphoneIcon />, title: 'Mobile-Friendly', desc: 'Manage your listing and respond to inquiries right from your phone.' },
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
          borderRadius: 3,
          p: { xs: 4, md: 6 },
          mb: 4,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
          Community Sale Events and Garage Sales
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 700, mx: 'auto', mb: 3 }}>
          Create interactive maps for your neighborhood's community sales, making it easy for visitors to find what they're looking for.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
          <Button variant="contained" size="large" onClick={() => handleNavigation('/login')}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}>
            Get Started Today
          </Button>
          {fromMap && (
            <Button variant="outlined" size="large" startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/?communityId=${currentCommunityId || ''}`)}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Return to Map
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Intro section with image */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            component="img"
            src={communityMapImage}
            alt="Example of a community sale map"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/1200x600?text=Community+Sale+Map+Example'; }}
            sx={{ width: '100%', borderRadius: 3, boxShadow: 3 }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h2" gutterBottom>Simplify Your Event</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Are you organizing a community sale event for your neighbourhood and would like to map out
            all the community sales on Google Maps? This makes it easy for visitors to find the sales
            they want to go to, or even just to see where the sales are in relation to them without the
            need for those old fashioned maps.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We have created a simple way to do it right. All you have to do is login to your account,
            create the garage sale event, enter in the addresses and the descriptions. It's really easy.
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 5 }} />

      {/* How Community Sales Work */}
      <Typography variant="h2" textAlign="center" sx={{ mb: 4 }}>How Community Sales Work</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {communitySteps.map((step, i) => (
          <Grid size={{ xs: 12, sm: 6 }} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, flexShrink: 0, fontSize: '1rem', fontWeight: 700 }}>
                  {i + 1}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Individual Garage Sales */}
      <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: { xs: 3, md: 4 }, borderRadius: 3, mb: 5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h2" textAlign="center" sx={{ mb: 1 }}>Individual Garage Sales Made Easy</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 1, maxWidth: 700, mx: 'auto' }}>
          Not part of a community event? No problem! Our platform also supports individual garage sales.
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
          Whether you're decluttering your home, moving, or just having a seasonal sale, our tools help you reach more potential buyers.
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {individualFeatures.map((feat, i) => (
            <Grid size={{ xs: 12, sm: 4 }} key={i}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mx: 'auto', mb: 2 }}>{feat.icon}</Avatar>
                  <Typography variant="h5" gutterBottom>{feat.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{feat.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box textAlign="center">
          <Button variant="contained" color="secondary" onClick={() => handleNavigation('/single-garage-sales')}>
            Browse Garage Sales
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ mb: 5 }} />

      {/* How It Works - Individual */}
      <Typography variant="h2" textAlign="center" sx={{ mb: 4 }}>How It Works</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {individualSteps.map((step) => (
          <Grid size={{ xs: 12, sm: 6 }} key={step.num}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, flexShrink: 0, fontWeight: 700 }}>{step.num}</Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 5 }} />

      {/* Features */}
      <Typography variant="h2" textAlign="center" sx={{ mb: 4 }}>Features</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {features.map((feat, i) => (
          <Grid size={{ xs: 12, sm: 6 }} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Avatar variant="rounded" sx={{ bgcolor: 'info.light', width: 44, height: 44, flexShrink: 0 }}>
                  {feat.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>{feat.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{feat.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 5 }} />

      {/* CTA */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 3,
          p: { xs: 4, md: 5 },
          mb: 5,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>Ready to Get Started?</Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 600, mx: 'auto' }}>
          Create your first community garage sale map today and make it easier for everyone to find what they're looking for.
        </Typography>
        <Button variant="contained" size="large" onClick={() => handleNavigation('/login')}
          sx={{ bgcolor: 'white', color: '#1e293b', '&:hover': { bgcolor: 'grey.200' } }}>
          Sign Up Now
        </Button>
      </Paper>

      {/* Footer credits */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom>Developed By</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Asher Green</strong><br />
              <Link href="mailto:asher@ashergreen.ca" underline="hover">asher@ashergreen.ca</Link><br />
              <Link href="http://www.ashergreen.ca" target="_blank" rel="noopener noreferrer" underline="hover">www.ashergreen.ca</Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Jamie-Lee Mclean-Davis</strong><br />
              <Link href="mailto:jmclean.davis@gmail.com" underline="hover">jmclean.davis@gmail.com</Link>
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom>Thanks for Using Our App!</Typography>
            <Typography variant="h4" gutterBottom>Feedback & Support</Typography>
            <Typography variant="body2" color="text.secondary">
              We hope our app made your garage sale adventures more fun and efficient! We're always looking to improve, so feel free to drop us a line with ideas, suggestions, or just to say hi.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LandingPage;
