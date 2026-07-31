import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import SEO from '../components/SEO';
import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import './PublicProfileScreen.css';

const PublicProfileScreen = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const viewTracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/profiles/${publicId}?language=${i18n.language}`, {
          headers: getApiHeaders(),
        });
        if (!response.ok) throw new Error(`profile fetch failed: ${response.status}`);
        const data = await response.json();
        if (!cancelled) setProfile(data);
      } catch (fetchError) {
        console.error('Error fetching public profile:', fetchError);
        if (!cancelled) setError(t('profile.not_found'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchProfile();
    return () => { cancelled = true; };
    // Deep link and refresh must both resolve the same publicId (TASK-29 AC1).
  }, [publicId, i18n.language, t]);

  useEffect(() => {
    if (!profile || viewTracked.current) return;
    viewTracked.current = true;
    trackEvent('profile_viewed', { public_id: publicId });
  }, [profile, publicId]);

  const handleTakeTheTest = () => {
    // Attribution (TASK-29 AC3): the referring profile travels with the
    // visitor into their own test, without ever exposing the owner's identity.
    trackEvent('profile_cta_clicked', { public_id: publicId, destination: 'evaluation' });
    navigate('/tutorial', { state: { mode: 'evaluation', referrerProfileId: publicId } });
  };

  if (loading) {
    return (
      <main className="profile-screen">
        <p>{t('profile.loading')}</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="profile-screen">
        <h1>{t('profile.not_found_title')}</h1>
        <p>{error || t('profile.not_found')}</p>
        <a href="/">← {t('common.backToHome')}</a>
      </main>
    );
  }

  return (
    <main className="profile-screen">
      <SEO
        title={`${profile.name} - Moral Torture Machine`}
        description={profile.sharePhrase}
        url={`/p/${publicId}`}
        noindex
      />
      <div className="profile-card" style={{ borderColor: profile.visual?.color }}>
        <p className="profile-emoji">{profile.visual?.emoji}</p>
        <h1 className="profile-name">{profile.name}</h1>
        <p className="profile-description">{profile.description}</p>
        <p className="profile-share-phrase">&ldquo;{profile.sharePhrase}&rdquo;</p>
      </div>
      <button type="button" className="btn-primary profile-cta" onClick={handleTakeTheTest}>
        {t('profile.take_the_test')}
      </button>
      <a className="profile-home-link" href="/">← {t('common.backToHome')}</a>
    </main>
  );
};

export default PublicProfileScreen;
