import { useTranslation } from 'react-i18next';

import useAuth from '../auth/useAuth';
import './AuthButton.css';

const AuthButton = () => {
  const { t } = useTranslation();
  const { available, error, isAuthenticated, loading, login, logout, user } = useAuth();

  if (!available) return null;

  if (isAuthenticated) {
    return (
      <div className="auth-account">
        <span title={user.email || user.name}>{user.name || user.email || t('auth.account')}</span>
        <button type="button" onClick={logout}>{t('auth.logout')}</button>
      </div>
    );
  }

  return (
    <div className="auth-login">
      <button
        type="button"
        className="auth-login-button"
        onClick={() => login(window.location.pathname)}
        disabled={loading}
      >
        {t('auth.login')}
      </button>
      {error && <small className="auth-error" role="alert">{t('auth.startError')}</small>}
    </div>
  );
};

export default AuthButton;
