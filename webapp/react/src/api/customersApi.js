import axios from 'axios';

const API = axios.create({ baseURL: "http://localhost:4004/catalog" });

export const fetchCustomers = () => API.get('/Customers');
export const createCustomer = data => API.post('/Customers', data);
export const updateCustomer = (id, data) => API.put(`/Customers(${id})`, data);
export const deleteCustomer = id => API.delete(`/Customers(${id})`);
