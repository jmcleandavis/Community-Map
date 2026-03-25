import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const LocationIcon = () => (
  <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', mx: 0.5, fontWeight: 700 }}>
    ⊕
  </Box>
);

function Help() {
  const sections = [
    {
      icon: <MapIcon color="primary" />,
      title: 'Map Navigation',
      items: [
        'Pan the map by clicking and dragging',
        'Zoom in/out using the scroll wheel or pinch zoom',
        <>Click the <LocationIcon /> button to center on your current position</>,
        'The blue dot shows your current location',
        'Red dots indicate garage sale locations',
        'Green dots indicate garage sales you have selected (must be logged in)',
      ],
    },
    {
      icon: <StorefrontIcon color="primary" />,
      title: 'Garage Sales',
      items: [
        'Click on any red dot to view garage sale details',
        'The info window shows the address and description',
        'Close the info window by clicking the X or clicking elsewhere on the map',
      ],
    },
    {
      icon: <MenuIcon color="primary" />,
      title: 'Menu Options',
      items: [
        <><strong>Map:</strong> Return to the main map view</>,
        <><strong>Show Selected Sales:</strong> View all garage sales that you have selected on the map</>,
        <><strong>Garage Sales:</strong> View a list of all garage sales</>,
        <><strong>About:</strong> View information about the app and how to create your own community garage sale map</>,
        <><strong>Login/Signup:</strong> Access your account</>,
        <><strong>Help:</strong> View this help guide</>,
      ],
    },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h2" gutterBottom>Help</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to Community Map! This guide will help you navigate and use all the features of our application.
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        {sections.map((section, i) => (
          <Accordion key={i} defaultExpanded={i === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {section.icon}
                <Typography variant="h5">{section.title}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {section.items.map((item, j) => (
                  <Stack key={j} direction="row" spacing={1} alignItems="flex-start">
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>•</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <HelpOutlineIcon color="primary" />
          <Typography variant="h5">Need More Help?</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          If you have any questions or need additional assistance, or have any suggestions, please contact us at{' '}
          <Link href="mailto:asher@ashergreen.ca" underline="hover">asher@ashergreen.ca</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Help;
