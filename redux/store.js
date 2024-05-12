import { configureStore } from '@reduxjs/toolkit';
import Info from './features/key-slice';

export const store = configureStore({
  reducer: {
    Info,
  },
});
