import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { MESSAGE_TYPES } from '../../../services/messages/messageTypes';

const STATUS_ICON = {
  sent: <CheckCircleIcon color="success" fontSize="small" />,
  resent: <CheckCircleIcon color="success" fontSize="small" />,
  failed: <ErrorIcon color="error" fontSize="small" />,
  pending: <HourglassEmptyIcon color="warning" fontSize="small" />,
};

function displayName(messageType) {
  return MESSAGE_TYPES[messageType]?.displayName || messageType;
}

function formatTimestamp(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

const MessageHistoryCard = ({ rows, loading, hasLoan }) => (
  <Paper className="p-3">
    <div className="d-flex align-items-center gap-2 mb-2">
      <AccessTimeIcon fontSize="small" />
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        History
      </Typography>
    </div>

    {loading && (
      <div className="d-flex justify-content-center p-3">
        <CircularProgress size={22} />
      </div>
    )}

    {!loading && !hasLoan && (
      <Typography variant="body2" color="text.secondary">
        Select a loan to see history
      </Typography>
    )}

    {!loading && hasLoan && rows.length === 0 && (
      <Typography variant="body2" color="text.secondary">
        No messages triggered yet for this loan
      </Typography>
    )}

    {!loading && rows.length > 0 && (
      <List dense sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {rows.map((row) => (
          <ListItem key={row._id} divider disableGutters>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {STATUS_ICON[row.status] || <HourglassEmptyIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={displayName(row.messageType)}
              secondary={formatTimestamp(row.createdAt)}
            />
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);

export default MessageHistoryCard;
