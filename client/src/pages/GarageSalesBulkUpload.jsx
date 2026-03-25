import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useCommunityName } from '../hooks/useCommunityName';
import api from '../utils/api';
import { logger } from '../utils/logger';

const GarageSalesBulkUpload = () => {
  const [communityId, setCommunityId] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0, total: 0 });
  const [errors, setErrors] = useState([]);
  const [communityName, setCommunityName] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useCommunityName(communityId, communityName, setCommunityName, {
    componentName: 'GarageSalesBulkUpload',
    skipIfExists: false,
  });

  const handleCommunityIdChange = (e) => {
    setCommunityId(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!communityId || !file) {
      alert('Please enter a Community ID and select a JSON file');
      return;
    }

    setIsUploading(true);
    setResults({ success: 0, failed: 0, total: 0 });
    setErrors([]);

    try {
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);

          if (!Array.isArray(jsonData)) {
            throw new Error('Invalid JSON format. Expected an array of garage sales.');
          }

          setResults(prev => ({ ...prev, total: jsonData.length }));

          const successfulUploads = [];
          const failedUploads = [];

          for (const sale of jsonData) {
            try {
              if (!sale.street || !sale.address) {
                throw new Error(`Missing required fields: ${JSON.stringify(sale)}`);
              }

              const addressData = {
                street: sale.street,
                streetNumber: sale.address,
                city: sale.city || '',
                state: sale.state || '',
                postalCode: sale.postalCode || '',
                unit: sale.unit || '',
              };

              await api.createGarageSale(
                addressData,
                sale.description || 'Garage Sale',
                sale.name || 'Garage Sale',
                sale.highlightedItems || [],
                communityId
              );

              successfulUploads.push(sale);
            } catch (error) {
              failedUploads.push({ sale, error: error.message });
            }
          }

          setResults({
            success: successfulUploads.length,
            failed: failedUploads.length,
            total: jsonData.length,
          });

          setErrors(failedUploads.map(item => ({
            address: `${item.sale.address} ${item.sale.street}`,
            error: item.error,
          })));
        } catch (error) {
          logger.error('[GarageSalesBulkUpload] Error processing JSON:', error);
          setErrors([{ address: 'N/A', error: `Error processing JSON file: ${error.message}` }]);
        } finally {
          setIsUploading(false);
        }
      };

      fileReader.onerror = () => {
        setErrors([{ address: 'N/A', error: 'Error reading file' }]);
        setIsUploading(false);
      };

      fileReader.readAsText(file);
    } catch (error) {
      logger.error('[GarageSalesBulkUpload] Error during upload:', error);
      setErrors([{ address: 'N/A', error: `Error during upload: ${error.message}` }]);
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setCommunityId('');
    setFile(null);
    setResults({ success: 0, failed: 0, total: 0 });
    setErrors([]);
    setCommunityName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGoToAdmin = () => {
    navigate(`/admin/sales?communityId=${communityId}`);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h2" gutterBottom>Bulk Upload Garage Sales</Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Community ID</Typography>
              <input
                type="text"
                id="communityId"
                value={communityId}
                onChange={handleCommunityIdChange}
                placeholder="Enter community ID"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
              {communityName && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Community: <strong>{communityName}</strong>
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>JSON File</Typography>
              <input
                type="file"
                id="jsonFile"
                accept=".json"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
              />

              <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Expected JSON Format:</Typography>
                <Box component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto', m: 0, color: 'text.secondary' }}>
{`[
  {
    "street": "STREET NAME",
    "address": "STREET NUMBER",
    "description": "DESCRIPTION",
    "city": "CITY",
    "state": "STATE",
    "postalCode": "POSTAL CODE",
    "unit": "UNIT"
  }
]`}
                </Box>
              </Paper>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={isUploading || !communityId || !file}
                startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
              >
                {isUploading ? 'Uploading...' : 'Upload Garage Sales'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={isUploading}
                startIcon={<RestartAltIcon />}
              >
                Reset
              </Button>
              {results.success > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleGoToAdmin}
                  startIcon={<AdminPanelSettingsIcon />}
                >
                  Go to Admin
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Paper>

      {(results.success > 0 || results.failed > 0) && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Upload Results</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip label={`Total: ${results.total}`} />
            <Chip label={`Success: ${results.success}`} color="success" />
            {results.failed > 0 && <Chip label={`Failed: ${results.failed}`} color="error" />}
          </Stack>

          {errors.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Failed Uploads:</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Address</strong></TableCell>
                      <TableCell><strong>Error</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.address}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">{error.error}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default GarageSalesBulkUpload;
