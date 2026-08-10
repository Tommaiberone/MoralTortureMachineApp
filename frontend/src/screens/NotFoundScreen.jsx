// screens/NotFoundScreen.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

const NotFoundScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="screen-container">
      <SEO title="Page not found" description={t('notFound.description')} url="/404" noindex />
      <div className="card-large">
        <h1 className="screen-title">{t('notFound.title')}</h1>
        <p>{t('notFound.description')}</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          {t('notFound.homeButton')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundScreen;
