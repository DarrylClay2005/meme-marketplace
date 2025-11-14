import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export const AuthCallbackPage: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove '#'
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      setToken(accessToken);
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, setToken]);

  return <p>Completing login...</p>;
};
