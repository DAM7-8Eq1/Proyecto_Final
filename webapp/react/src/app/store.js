import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../features/customers/customersSlice';

export const store = configureStore({
  reducer: { customers: customersReducer }
});
