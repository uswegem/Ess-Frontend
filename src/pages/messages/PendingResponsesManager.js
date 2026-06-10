import React, { useCallback, useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { getRequest, postRequest } from '../../ApiFunction';
import API, { BASE_URL } from '../../Api';
import { toast } from 'react-toastify';

const PendingResponsesManager = () => {
  const [pendingResponses, setPendingResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseData, setResponseData] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPendingResponses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRequest(`${BASE_URL}${API.PENDING_RESPONSES}`);
      const { status, data, message } = result.data;

      if (!status) {
        toast.error(message || "Failed to fetch pending responses");
        return;
      }

      setPendingResponses(data);
    } catch (err) {
      toast.error("Error fetching responses: " + err.message);
      console.error("Error fetching responses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingResponses();
  }, [fetchPendingResponses]);

  const handleRequestSelect = async (request) => {
    try {
      const result = await getRequest(`${BASE_URL}${API.MESSAGE_REQUEST}/${request.requestId}`);
      const { status, data, message } = result.data;

      if (!status) {
        toast.error(message || "Failed to fetch request details");
        return;
      }

      setSelectedRequest(data);
      setResponseData(JSON.stringify(data, null, 2));
      setDialogOpen(true);
    } catch (err) {
      toast.error("Error fetching request details: " + err.message);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest || !responseData) {
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

      const result = await postRequest(
        `${BASE_URL}${API.MANUAL_RESPONSE}/${selectedRequest.responseType}`,
        {
          requestId: selectedRequest.requestId,
          responseData: parsedData
        }
      );

      if (result.data.status) {
        toast.success('Response sent successfully');
        setDialogOpen(false);
        fetchPendingResponses();
      } else {
        toast.error(result.data.message || 'Failed to send response');
      }
    } catch (err) {
      toast.error("Error sending response: " + err.message);
    }
  };

  const columns = [
    { field: "requestId", headerName: "Request ID", width: 180 },
    { field: "responseType", headerName: "Type", width: 200 },
    { field: "status", headerName: "Status", width: 130 },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      valueGetter: (params) =>
        new Date(params.row.createdAt).toLocaleString(),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleRequestSelect(params.row)}
        >
          Respond
        </Button>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <h5 className="mb-1">Pending Responses</h5>
          <p className="text-muted mb-4">
            Manage and respond to pending message requests
          </p>
          <Paper className="custom-paper">
            <DataGrid
              rows={pendingResponses}
              columns={columns}
              loading={loading}
              pageSize={5}
              pageSizeOptions={[5, 10]}
              getRowId={(row) => row.requestId}
              sx={{ border: 0 }}
            />
          </Paper>
        </div>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manual Response - {selectedRequest?.responseType}
        </DialogTitle>
        <DialogContent>
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