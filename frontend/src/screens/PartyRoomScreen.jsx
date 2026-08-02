// screens/PartyRoomScreen.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';

import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { sharePartyRecapCard } from '../utils/shareCard';
import './PartyRoomScreen.css';

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 1500;

const DIMENSIONS = ['Empathy', 'Integrity', 'Responsibility', 'Justice', 'Altruism', 'Honesty'];

const chosenValuesFor = (dilemma, choice) => {
  const prefix = choice === 'first' ? 'firstAnswer' : 'secondAnswer';
  return Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dilemma[`${prefix}${dimension}`]]));
};

const PartyRoomScreen = () => {
  const { roomCode } = useParams();
  const { t, i18n } = useTranslation();

  const [room, setRoom] = useState(null);
  const [fatalError, setFatalError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const pollTracked = useRef(false);

  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/party-rooms/${roomCode}?language=${i18n.language}`,
        { headers: getApiHeaders() },
      );
      if (response.status === 404 || response.status === 410) {
        setFatalError(response.status === 410 ? t('party.roomExpired') : t('party.roomNotFound'));
        return null;
      }
      if (!response.ok) throw new Error(`room fetch failed: ${response.status}`);
      const data = await response.json();
      setRoom(data);
      return data;
    } catch (fetchError) {
      console.error('Error fetching party room:', fetchError);
      return null;
    }
  }, [roomCode, i18n.language, t]);

  // Poll the room state. Stops once the room is completed - nothing further
  // changes after that, so there is no reason to keep hitting the API.
  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const tick = async () => {
      const data = await fetchRoom();
      if (cancelled) return;
      if (data?.status === 'completed' && intervalId) {
        clearInterval(intervalId);
      }
    };

    tick();
    intervalId = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [fetchRoom]);

  // Cosmetic 1s countdown ticker; the server (not this timer) is what
  // actually decides when a phase ends (ADR-050).
  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (room?.hasJoined && !pollTracked.current) {
      pollTracked.current = true;
      trackEvent('party_room_entered', { room_code: roomCode });
    }
  }, [room?.hasJoined, roomCode]);

  useEffect(() => {
    if (room?.status === 'lobby') {
      QRCode.toDataURL(`${window.location.origin}/party/${roomCode}`, { margin: 1, width: 220 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }
  }, [room?.status, roomCode]);

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const response = await fetch(`${API_URL}/party-rooms/${roomCode}/join`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!response.ok) {
        setJoinError(response.status === 409 ? t('party.roomUnavailable') : t('party.joinError'));
        return;
      }
      trackEvent('party_room_joined_ui', { room_code: roomCode });
      await fetchRoom();
    } catch (fetchError) {
      console.error('Error joining party room:', fetchError);
      setJoinError(t('party.joinError'));
    } finally {
      setJoining(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const response = await fetch(`${API_URL}/party-rooms/${roomCode}/start`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      if (response.ok) {
        trackEvent('party_room_started_ui', { room_code: roomCode });
        await fetchRoom();
      }
    } finally {
      setStarting(false);
    }
  };

  const handleVote = async (choice) => {
    if (!room?.currentDilemma || voting) return;
    setVoting(true);
    setVoteError('');
    try {
      const chosenValues = chosenValuesFor(room.currentDilemma, choice);
      const response = await fetch(`${API_URL}/party-rooms/${roomCode}/vote`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ choice, chosenValues }),
      });
      if (!response.ok) {
        setVoteError(t('party.voteError'));
        return;
      }
      trackEvent('party_room_vote_submitted', { room_code: roomCode, round: room.currentRoundIndex });
      await fetchRoom();
    } catch (fetchError) {
      console.error('Error voting in party room:', fetchError);
      setVoteError(t('party.voteError'));
    } finally {
      setVoting(false);
    }
  };

  if (fatalError) {
    return (
      <main className="screen-container party-room-screen">
        <p className="text-box-default">{fatalError}</p>
        <p><a href="/party">← {t('party.backToPartyHome')}</a></p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="screen-container party-room-screen">
        <p>{t('party.loading')}</p>
      </main>
    );
  }

  if (!room.hasJoined) {
    return (
      <main className="screen-container party-room-screen">
        <h1 className="screen-title-large">{t('party.roomTitle', { code: roomCode })}</h1>
        <p className="screen-subtitle">{t('party.participantCount', { count: room.participantCount })}</p>
        <form className="party-home-form" onSubmit={handleJoin}>
          <label htmlFor="party-join-display-name">{t('party.yourNameLabel')}</label>
          <input
            id="party-join-display-name"
            type="text"
            maxLength={40}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t('party.yourNamePlaceholder')}
            required
          />
          <button type="submit" className="btn-primary" disabled={joining}>
            {joining ? t('party.joining') : t('party.joinButton')}
          </button>
        </form>
        {joinError && <p role="alert" className="party-home-error">{joinError}</p>}
      </main>
    );
  }

  if (room.status === 'lobby') {
    return (
      <main className="screen-container party-room-screen">
        <h1 className="screen-title-large">{t('party.lobbyTitle')}</h1>
        <p className="party-room-code">{roomCode}</p>
        {qrDataUrl && <img className="party-room-qr" src={qrDataUrl} alt={t('party.qrAlt')} />}
        <p className="screen-subtitle">{t('party.shareHint')}</p>

        <ul className="party-participant-list">
          {room.participants.map((participant, index) => (
            <li key={index} className={participant.isCaller ? 'is-caller' : ''}>
              {participant.displayName}
              {participant.isHost ? ` (${t('party.hostBadge')})` : ''}
            </li>
          ))}
        </ul>

        {room.isHost ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleStart}
            disabled={starting || room.participantCount < 2}
          >
            {starting ? t('party.starting') : t('party.startButton')}
          </button>
        ) : (
          <p className="party-room-waiting">{t('party.waitingForHost')}</p>
        )}
        {room.participantCount < 2 && (
          <p className="screen-subtitle">{t('party.needMoreParticipants')}</p>
        )}
      </main>
    );
  }

  if (room.status === 'question' && room.currentDilemma) {
    const secondsLeft = Math.max(0, Math.ceil((room.phaseEndsAt - nowMs) / 1000));
    return (
      <main className="screen-container party-room-screen">
        <p className="screen-subtitle">
          {t('party.roundProgress', { current: room.currentRoundIndex + 1, total: room.dilemmaCount })}
        </p>
        <p className="party-room-timer">{secondsLeft}s</p>
        <p className="text-box-default">{room.currentDilemma.dilemma}</p>

        {room.hasVotedThisRound ? (
          <div className="party-room-waiting">
            <div className="spinner"></div>
            <p>{t('party.waitingForOthers')}</p>
          </div>
        ) : (
          <div className="button-row">
            <button className="btn-yes" onClick={() => handleVote('first')} disabled={voting}>
              {room.currentDilemma.firstAnswer}
            </button>
            <button className="btn-no" onClick={() => handleVote('second')} disabled={voting}>
              {room.currentDilemma.secondAnswer}
            </button>
          </div>
        )}
        {voteError && <p role="alert" className="party-home-error">{voteError}</p>}
      </main>
    );
  }

  if (room.status === 'reveal') {
    const result = room.roundResult || { firstVotes: 0, secondVotes: 0 };
    const total = result.firstVotes + result.secondVotes || 1;
    return (
      <main className="screen-container party-room-screen">
        <p className="screen-subtitle">
          {t('party.roundProgress', { current: room.currentRoundIndex + 1, total: room.dilemmaCount })}
        </p>
        <h2 className="screen-title">{t('party.revealTitle')}</h2>
        <div className="party-reveal-bar">
          <div
            className="party-reveal-first"
            style={{ width: `${(result.firstVotes / total) * 100}%` }}
          />
        </div>
        <p>
          {t('party.revealSplit', {
            first: result.firstVotes,
            second: result.secondVotes,
          })}
        </p>
      </main>
    );
  }

  if (room.status === 'completed') {
    const awards = room.awards || {};
    const nameOf = (index) => room.participants[index]?.displayName;
    return (
      <main className="screen-container party-room-screen">
        <h1 className="screen-title-large">{t('party.completedTitle')}</h1>
        <ul className="party-results-list">
          {room.participants.map((participant, index) => (
            <li key={index} className={participant.isCaller ? 'is-caller' : ''}>
              <span className="party-results-emoji">{participant.archetype?.visual?.emoji}</span>
              <span className="party-results-name">{participant.displayName}</span>
              <span className="party-results-archetype">{participant.archetype?.name}</span>
            </li>
          ))}
        </ul>

        {(awards.closestPair || awards.moralMinority || awards.mostControversialDilemma) && (
          <ul className="party-awards-list">
            {awards.closestPair && (
              <li>
                {t('party.awardClosestPair', {
                  a: nameOf(awards.closestPair.participantKeys[0]),
                  b: nameOf(awards.closestPair.participantKeys[1]),
                  pct: awards.closestPair.agreementPct,
                })}
              </li>
            )}
            {awards.moralMinority && (
              <li>{t('party.awardMoralMinority', { name: nameOf(awards.moralMinority.participantKey) })}</li>
            )}
            {awards.mostControversialDilemma && (
              <li>
                {t('party.awardMostDivided', {
                  first: awards.mostControversialDilemma.firstVotes,
                  second: awards.mostControversialDilemma.secondVotes,
                })}
              </li>
            )}
          </ul>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            const method = await sharePartyRecapCard(awards, room.participants, t('party.recapShareText'));
            trackEvent('party_room_recap_shared', { room_code: roomCode, method });
          }}
        >
          {t('party.shareRecapButton')}
        </button>

        <p><a href="/">← {t('common.backToHome')}</a></p>
      </main>
    );
  }

  return (
    <main className="screen-container party-room-screen">
      <p>{t('party.loading')}</p>
    </main>
  );
};

export default PartyRoomScreen;
