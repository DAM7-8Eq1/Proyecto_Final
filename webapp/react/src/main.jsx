import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import CustomersPage from './pages/CustomersPage';

ReactDOM.render(
  <Provider store={store}>
    <CustomersPage />
  </Provider>,
  document.getElementById('react-root')
);
