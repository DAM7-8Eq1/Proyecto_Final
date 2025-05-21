import React from 'react';
import { CustomersTable } from '../features/customers/CustomersTable';

export default function CustomersPage() {
  return (
    <div>
      <h1>Gestión de Customers</h1>
      {/* Aquí podrías usar un componente de Tabs; por simplicidad: */}
      <CustomersTable />
    </div>
  );
}
