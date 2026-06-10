import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  currentMessage: null
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find(m => m.messageId === messageId);
      if (message) {
        message.status = status;
      }
    },
    setCurrentMessage: (state, action) => {
      state.currentMessage = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentMessage = null;
      state.error = null;
    }
  }
});

export const {
  setLoading,
  setError,
  addMessage,
  updateMessageStatus,
  setCurrentMessage,
  clearMessages
} = messageSlice.actions;

export default messageSlice.reducer;