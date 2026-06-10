import { createSlice } from '@reduxjs/toolkit';



export const countSlice = createSlice({
  name: 'count',
  initialState: { counts: {
      usersCount: 0,
      providersCount: 0,
      serviceCount: 0,
      supportCount: 0,
      bookingCount: 0,
      reviewCount: 0
    }},
  reducers: {
    setCount: (state, action) => {
      state.counts = action.payload;
    },
  },
})



export const { setCount } = countSlice.actions

export default countSlice.reducer