import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function completeLogin() {
      const error = searchParams.get('error');
      const token = searchParams.get('token');

      if (error) {
        navigate('/login', { replace: true });
        return;
      }

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        localStorage.setItem('token', token);
        localStorage.setItem('atelier_token', token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        navigate('/', { replace: true });
      } catch (err) {
        console.error(err);
        navigate('/login', { replace: true });
      }
    }

    completeLogin();
  }, [navigate, searchParams]);

  return (
    <div>Signing you in...</div>
  );
}
