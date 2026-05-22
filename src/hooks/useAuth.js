import { useCallback } from 'react';
import { useAppState } from './useAppState.jsx';
import { loginUser } from '../services/db.js';

export function useAuth() {
  const { state, dispatch, getAppState } = useAppState();

  const login = useCallback(async (username, password) => {
    try {
      const response = await loginUser({ username, password }, getAppState);

      if (response && response.user && response.token) {
        dispatch({
          type: 'SET_AUTH',
          payload: { user: response.user, token: response.token }
        });
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response?.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [dispatch, getAppState]);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  const isAdmin = state.auth?.user?.role === 'admin';
  const isAuthenticated = !!state.auth?.user && !!state.auth?.token;

  return {
    user: state.auth?.user,
    token: state.auth?.token,
    isAuthenticated,
    isAdmin,
    login,
    logout
  };
}
