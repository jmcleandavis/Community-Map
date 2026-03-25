import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Link,
  Stack,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigation } from '../context/NavigationContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import { logger } from '../utils/logger';

const InfoPage = () => {
  const navigate = useNavigate();
  const { fromMap } = useNavigation();
  const { currentCommunityId } = useCommunitySales();

  useEffect(() => {
    sessionStorage.setItem('initialPage', '/about');
    logger.log('[Info] Recorded initial page as "/about" in sessionStorage');
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h2" gutterBottom>Information</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom>About Community Map</Typography>
            <Typography variant="body2" color="text.secondary">
              An app that maps out garage sales, both individual listings and community-wide events,
              making it easy to find and plan your garage sale adventures.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom>Developed By</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Asher Green</Typography>
                <Link href="mailto:asher@ashergreen.ca" variant="body2" underline="hover">asher@ashergreen.ca</Link>
                <br />
                <Link href="https://www.ashergreen.ca" target="_blank" rel="noopener noreferrer" variant="body2" underline="hover">
                  www.ashergreen.ca
                </Link>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>Jamie-Lee Mclean-Davis</Typography>
                <Link href="mailto:jmclean.davis@gmail.com" variant="body2" underline="hover">jmclean.davis@gmail.com</Link>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Thanks for checking out the very first version of our app! We hope it made your garage sale
          adventures just a little more fun and a lot more efficient. We're always looking to make things
          better, so if you have ideas, suggestions, or just want to say hi, drop us a line. We'd love
          to hear from you!
        </Typography>
      </Paper>

      {fromMap && (
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/?communityId=${currentCommunityId || ''}`)}
          >
            Return to Map
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default InfoPage;
