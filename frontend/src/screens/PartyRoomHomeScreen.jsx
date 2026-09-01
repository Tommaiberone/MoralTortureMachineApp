// screens/PartyRoomHomeScreen.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getAnonymousUserId, getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { getExperimentVariant } from '../utils/experiments';
import './PartyRoomHomeScreen.css';

const API_URL = import.meta.env.VITE_API_URL;

// TASK-222: only the create-room button label is tested, everything else on
// this screen (title, subtitle, tabs, form) stays the same for both arms.
const PARTY_CREATE_COPY_VARIANTS = ['baseline', 'dramatic'];

const PartyRoomHomeScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState('create');
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const partyCreateCopyVariant = getExperimentVariant('party_create_copy', PARTY_CREATE_COPY_VARIANTS, getAnonymousUserId());
  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent('party_home_viewed', { variant: partyCreateCopyVariant });
  }, [partyCreateCopyVariant]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/party-rooms`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ displayName: displayName.trim(), language: i18n.language }),
      });
      if (!response.ok) throw new Error(`create failed: ${response.status}`);
      const data = await response.json();
      trackEvent('party_room_create_clicked', { variant: partyCreateCopyVariant });
      navigate(`/party/${data.roomCode}`);
    } catch (fetchError) {
      console.error('Error creating party room:', fetchError);
      setError(t('party.createError'));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = (event) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    navigate(`/party/${code}`);
  };

  return (
    <main className="screen-container party-home-screen">
      <h1 className="screen-title-large">{t('party.homeTitle')}</h1>
      <p className="screen-subtitle">{t('party.homeSubtitle')}</p>

      <div className="party-home-tabs">
        <button
          type="button"
          className={`party-home-tab ${mode === 'create' ? 'active' : ''}`}
          onClick={() => setMode('create')}
        >
          {t('party.createTab')}
        </button>
        <button
          type="button"
          className={`party-home-tab ${mode === 'join' ? 'active' : ''}`}
          onClick={() => setMode('join')}
        >
          {t('party.joinTab')}
        </button>
      </div>

      {mode === 'create' ? (
        <form className="party-home-form" onSubmit={handleCreate}>
          <label htmlFor="party-create-name">{t('party.yourNameLabel')}</label>
          <input
            id="party-create-name"
            type="text"
            maxLength={40}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t('party.yourNamePlaceholder')}
            required
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? t('party.creating') : t(`party.createButton_${partyCreateCopyVariant}`)}
          </button>
        </form>
      ) : (
        <form className="party-home-form" onSubmit={handleJoin}>
          <label htmlFor="party-join-name">{t('party.roomCodeLabel')}</label>
          <input
            id="party-join-name"
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder={t('party.roomCodePlaceholder')}
            required
          />
          <button type="submit" className="btn-primary">
            {t('party.joinButton')}
          </button>
        </form>
      )}

      {error && <p role="alert" className="party-home-error">{error}</p>}

      <p><a href="/">← {t('common.backToHome')}</a></p>
    </main>
  );
};

export default PartyRoomHomeScreen;
