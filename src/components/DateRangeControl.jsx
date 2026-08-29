import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem, TextField, Typography } from '@mui/material';
import { PRESETS, computeRange, loadStoredRangeSelection, storeRangeSelection } from '../utils/dashboardDateRange';

// Shared date-range control for the Dashboard (MiraCore Summary + ESS Summary sections use
// one range, not independent per-section controls - see Dashboard.js). "Custom" only reveals
// the native <input type="date"> pair when selected, not a full calendar UI by default.
export default function DateRangeControl({ onChange }) {
  const stored = loadStoredRangeSelection();
  const [preset, setPreset] = useState(stored.preset);
  const [customFrom, setCustomFrom] = useState(stored.custom?.from || '');
  const [customTo, setCustomTo] = useState(stored.custom?.to || '');

  const emit = (nextPreset, nextCustom) => {
    const range = computeRange(nextPreset, nextCustom);
    storeRangeSelection(nextPreset, nextCustom);
    onChange(range, nextPreset);
  };

  const handlePresetChange = (e) => {
    const next = e.target.value;
    setPreset(next);
    if (next !== 'Custom') {
      emit(next, null);
    } else if (customFrom && customTo) {
      emit(next, { from: customFrom, to: customTo });
    }
    // else: Custom just selected with no dates yet - wait for both date inputs before emitting
  };

  const handleCustomChange = (field, value) => {
    const next = { from: field === 'from' ? value : customFrom, to: field === 'to' ? value : customTo };
    if (field === 'from') setCustomFrom(value); else setCustomTo(value);
    if (next.from && next.to) emit('Custom', next);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Typography variant="body2" color="text.secondary">Date range:</Typography>
      <FormControl size="small">
        <Select value={preset} onChange={handlePresetChange} sx={{ minWidth: 140 }}>
          {PRESETS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </Select>
      </FormControl>
      {preset === 'Custom' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            type="date"
            size="small"
            label="From"
            value={customFrom}
            onChange={(e) => handleCustomChange('from', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={customTo}
            onChange={(e) => handleCustomChange('to', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}
    </Box>
  );
}
