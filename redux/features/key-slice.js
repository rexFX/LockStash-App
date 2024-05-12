import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  decrypted_key: "",
  SERVER: ""
};

export const Info = createSlice({
  name: 'Info',
  initialState,
  reducers: {
    clear: (state) => {
      state = initialState;
    },
    add: (state, action) => {
      state.decrypted_key = action.payload;
    },
    initialize: (state, action) => {
      state.decrypted_key = action.payload;
      console.log(state.decrypted_key);
    },
    set_SERVER: (state, action) => {
      state.SERVER = action.payload;
    }
  },
});

export const { clear, add, initialize, set_SERVER} = Info.actions;
export default Info.reducer;
