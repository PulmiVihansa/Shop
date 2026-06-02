import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticateWithToken } = useAuth();

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
        await authenticateWithToken(token);
        navigate('/', { replace: true });
      } catch (err) {
        console.error(err);
        navigate('/login', { replace: true });
      }
    }

    completeLogin();
  }, [authenticateWithToken, navigate, searchParams]);

  return (
    <div>Signing you in...</div>
  );
}
