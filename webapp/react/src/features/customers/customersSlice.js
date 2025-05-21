import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/customersApi';

export const getCustomers = createAsyncThunk('customers/getAll', async () => {
  const response = await api.fetchCustomers();
  return response.data.value;   // OData en `.value`
});
export const addCustomer = createAsyncThunk('customers/add', async (customer) => {
  await api.createCustomer(customer);
  return customer;
});
export const editCustomer = createAsyncThunk('customers/edit', async ({ id, data }) => {
  await api.updateCustomer(id, data);
  return { id, data };
});
export const removeCustomer = createAsyncThunk('customers/remove', async (id) => {
  await api.deleteCustomer(id);
  return id;
});

const customersSlice = createSlice({
  name: 'customers',
  initialState: { list: [], status: 'idle' },
  extraReducers: builder => {
    builder
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(editCustomer.fulfilled, (state, action) => {
        const idx = state.list.findIndex(c => c.ID === action.payload.id);
        state.list[idx] = { ...state.list[idx], ...action.payload.data };
      })
      .addCase(removeCustomer.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.ID !== action.payload);
      });
  }
});

export default customersSlice.reducer;
