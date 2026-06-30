import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'
import { store } from './store';
import { setAuthSession } from './slice/authSlice';
import { AUTH_STORAGE_KEYS, loadStoredAuth, setOnSessionRefreshed } from './ApiFunction';
import AOS from 'aos';

setOnSessionRefreshed((session) => {
  store.dispatch(setAuthSession(session));
});

function hydrateAuthFromStorage() {
  loadStoredAuth();
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.user) || 'null');
    const activeTenant = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.activeTenant) || 'null');
    const memberships = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.memberships) || '[]');
    const permissions = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.permissions) || '[]');
    const authContext = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.authContext) || 'null');
    if (user) {
      store.dispatch(setAuthSession({
        user,
        token: localStorage.getItem(AUTH_STORAGE_KEYS.token),
        refreshToken: localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
        activeTenant,
        memberships,
        permissions,
        authContext,
      }));
    }
  } catch {
    // ignore corrupt storage
  }
}

hydrateAuthFromStorage();




AOS.init();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <Provider store={store}>
      <Router>
         <App />
      </Router>
   </Provider>
);

