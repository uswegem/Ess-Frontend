import React, { useEffect, useState, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { toast } from 'react-toastify';
import {
  QUEUE_STATUS,
  RESPONSE_TYPES,
  fetchPendingResponses,
  fetchRequestDetails,
  sendManualResponse
} from '../../services/responseHandler';

const PendingResponsesManager = () => {
  const [pendingResponses, setPendingResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responseData, setResponseData] = useState('');
  const [originalRequest, setOriginalRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch pending responses
  const loadPendingResponses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPendingResponses();
      setPendingResponses(data);
    } catch (error) {
      toast.error('Failed to load pending responses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingResponses();
  }, [loadPendingResponses]);

  // Load original request details when selecting a response
  const handleResponseSelect = async (response) => {
    try {
      setSelectedResponse(response);
      const requestDetails = await fetchRequestDetails(response.requestId);
      setOriginalRequest(requestDetails);
      
      // Pre-populate response data based on request
      const prePopulatedResponse = generateResponseTemplate(
        response.responseType,
        requestDetails
      );
      setResponseData(JSON.stringify(prePopulatedResponse, null, 2));
      setDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load request details');
    }
  };

  // Generate response template based on request data
  const generateResponseTemplate = (responseType, requestData) => {
    const typeConfig = RESPONSE_TYPES[responseType];
    if (!typeConfig) return {};

    const template = {};
    typeConfig.fields.forEach(field => {
      template[field] = requestData[field] || '';
    });
    
    return template;
  };

  // Handle manual response submission
  const handleSubmitResponse = async () => {
    if (!selectedResponse || !responseData) {
      toast.error('Please fill in response data');
      return;
    }

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch (e) {
        toast.error('Invalid JSON format');
        return;
      }

      await sendManualResponse(
        selectedResponse.responseType,
        selectedResponse.requestId,
        parsedData
      );

      toast.success('Response sent successfully');
      setDialogOpen(false);
      loadPendingResponses(); // Refresh the list
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const columns = [
    { field: 'requestId', headerName: 'Request ID', width: 180 },
    { field: 'responseType', headerName: 'Response Type', width: 200 },
    { 
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <span className={`status-${params.value.toLowerCase()}`}>
          {params.value}
        </span>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Request Date',
      width: 180,
      valueGetter: (params) => new Date(params.value).toLocaleString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleResponseSelect(params.row)}
        >
          Respond
        </Button>
      )
    }
  ];

  return (
    <div className="container">
      <Paper className="p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Pending Responses Manager</h5>
          <Button
            variant="outlined"
            onClick={loadPendingResponses}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <DataGrid
          rows={pendingResponses}
          columns={columns}
          pageSize={10}
          loading={loading}
          getRowId={(row) => row.requestId}
          autoHeight
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manual Response - {selectedResponse?.responseType}
        </DialogTitle>
        <DialogContent>
          {originalRequest && (
            <div className="mb-3">
              <h6 className="mb-2">Original Request Data:</h6>
              <pre className="bg-light p-2 rounded">
                {JSON.stringify(originalRequest, null, 2)}
              </pre>
            </div>
          )}
          <TextField
            label="Response Data (JSON)"
            multiline
            rows={8}
            fullWidth
            variant="outlined"
            value={responseData}
            onChange={(e) => setResponseData(e.target.value)}
            className="mt-3"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitResponse}
            variant="contained" 
            color="primary"
          >
            Send Response
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PendingResponsesManager;