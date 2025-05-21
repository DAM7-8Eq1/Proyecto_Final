import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCustomers, addCustomer, editCustomer, removeCustomer } from './customersSlice';

export function CustomersTable() {
  const dispatch = useDispatch();
  const customers = useSelector(state => state.customers.list);

  useEffect(() => {
    dispatch(getCustomers());
  }, [dispatch]);

  return (
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Acciones</th></tr></thead>
      <tbody>
        {customers.map(c =>
          <tr key={c.ID}>
            <td>{c.name}</td>
            <td>{c.email}</td>
            <td>{c.status}</td>
            <td>
              <button onClick={()=>dispatch(editCustomer({id:c.ID,data:{status:'VIP'}}))}>VIP</button>
              <button onClick={()=>dispatch(removeCustomer(c.ID))}>Eliminar</button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
