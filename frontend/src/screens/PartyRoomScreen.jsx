// screens/PartyRoomScreen.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import QRCode from 'qrcode';

import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { sharePartyRecapCard } from '../utils/shareCard';
import './PartyRoomScreen.css';

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 1500;
// TASK-148: consecutive poll failures before showing a connection-lost
// indicator - high enough to not flap on a single dropped request, low
// enough to still surface a real stall quickly (~4.5s at POLL_INTERVAL_MS).
const CONNECTION_LOST_THRESHOLD = 3;

const DIMENSIONS = ['Empathy', 'Integrity', 'Responsibility', 'Justice', 'Altruism', 'Honesty'];

const chosenValuesFor = (dilemma, choice) => {
  const prefix = choice === 'first' ? 'firstAnswer' : 'secondAnswer';
  return Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dilemma[`${prefix}${dimension}`]]));
};

// TASK-123: which moral dimension this dilemma actually pulls apart the
// most, so the reveal can say what was really being tested.
const dominantDimension = (dilemma) => {
  if (!dilemma) return null;
  let best = null;
  let bestDiff = -1;
  for (const dimension of DIMENSIONS) {
    const diff = Math.abs((dilemma[`firstAnswer${dimension}`] ?? 0) - (dilemma[`secondAnswer${dimension}`] ?? 0));
    if (diff > bestDiff) {
      bestDiff = diff;
      best = dimension;
    }
  }
  return best;
};

// TASK-204: same percentage-label technique as EvaluationDilemmasScreen/
// ChallengeLandingScreen's reveal pies - Recharts' default pie label has no
// explicit fill, unreadable against this theme's dark background.
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-highlight)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={14}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// TASK-123: no countdown/suspense (explicitly not wanted) - just a reaction
// to how split the room actually was.
const splitFlavorKey = (firstVotes, secondVotes) => {
  const total = firstVotes + secondVotes;
  if (total === 0) return 'party.splitDivided';
  const ratio = Math.max(firstVotes, secondVotes) / total;
  if (ratio >= 0.9) return 'party.splitUnanimous';
  if (ratio <= 0.6) return 'party.splitDivided';
  return 'party.splitLopsided';
};

const PartyRoomScreen = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [room, setRoom] = useState(null);
  const [fatalError, setFatalError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [revealHistory, setRevealHistory] = useState({});
  const [revealStage, setRevealStage] = useState(0);
  // TASK-209: which way the final recap's last stage change went, purely to
  // pick a slide-in-from-left vs slide-in-from-right transition class.
  const [revealDirection, setRevealDirection] = useState('forward');
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const pollTracked = useRef(false);
  // A 404/410 is terminal (the room is gone and will never come back) - the
  // polling effect below checks this to stop, same as it already does for
  // 'completed'. A ref, not state, because it must be readable synchronously
  // inside the same tick that sets it, before any re-render.
  const fatalRef = useRef(false);

  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/party-rooms/${roomCode}?language=${i18n.language}`,
        { headers: getApiHeaders() },
      );
      if (response.status === 404 || response.status === 410) {
        fatalRef.current = true;
        // TASK-199: a participant deleting their account mid-game replaces
        // the room with a tombstone (backend_fastapi.py get_room_or_404)
        // returning this exact detail string, so other still-open tabs get
        // a clear reason instead of the generic "expired" message. Matching
        // on the string is a small, deliberate coupling to that one backend
        // message - if it ever changes, this falls back to roomExpired.
        let detail = '';
        try {
          detail = (await response.json())?.detail || '';
        } catch {
          // Body may be empty/unparsable; fall through to the generic message.
        }
        setFatalError(
          detail === 'A participant left the platform and this game has ended'
            ? t('party.roomParticipantLeft')
            : response.status === 410 ? t('party.roomExpired') : t('party.roomNotFound')
        );
        return null;
      }
      if (!response.ok) throw new Error(`room fetch failed: ${response.status}`);
      const data = await response.json();
      setPollFailureCount(0);
      setRoom(data);
      return data;
    } catch (fetchError) {
      console.error('Error fetching party room:', fetchError);
      setPollFailureCount((count) => count + 1);
      return null;
    }
  }, [roomCode, i18n.language, t]);

  // Poll the room state. Stops once the room is completed or a fatal
  // 404/410 was hit - nothing further changes after either, so there is no
  // reason to keep hitting the API.
  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const tick = async () => {
      const data = await fetchRoom();
      if (cancelled) return;
      if ((data?.status === 'completed' || fatalRef.current) && intervalId) {
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

  // TASK-123: remember every round's split, purely client-side, so the
  // reveal can say "most divided so far" without the server tracking a
  // per-viewer running history.
  useEffect(() => {
    if (room?.status === 'reveal' && room.roundResult) {
      setRevealHistory((prev) => {
        if (prev[room.currentRoundIndex]) return prev;
        return { ...prev, [room.currentRoundIndex]: room.roundResult };
      });
    }
  }, [room?.status, room?.currentRoundIndex, room?.roundResult]);

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

  // TASK-123: the only thing that ends the reveal phase under normal play -
  // no timer does this any more.
  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const response = await fetch(`${API_URL}/party-rooms/${roomCode}/advance`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      if (response.ok) {
        trackEvent('party_room_advanced_ui', { room_code: roomCode });
        await fetchRoom();
      }
    } finally {
      setAdvancing(false);
    }
  };

  // TASK-123 AC8: quickest path back into a new game is a fresh room, since
  // there is no account system to auto-invite the same people to one.
  const handleRematch = async () => {
    setRematching(true);
    try {
      const response = await fetch(`${API_URL}/party-rooms`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          displayName: room.participants.find((p) => p.isCaller)?.displayName || t('party.yourNamePlaceholder'),
          language: i18n.language,
          dilemmaCount: room.dilemmaCount,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      trackEvent('party_room_rematch_created', { previous_room_code: roomCode, room_code: data.roomCode });
      navigate(`/party/${data.roomCode}`);
    } finally {
      setRematching(false);
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
        {pollFailureCount >= CONNECTION_LOST_THRESHOLD && (
          <p role="status" className="party-connection-banner">{t('party.connectionLost')}</p>
        )}
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
    return (
      <main className="screen-container party-room-screen">
        {pollFailureCount >= CONNECTION_LOST_THRESHOLD && (
          <p role="status" className="party-connection-banner">{t('party.connectionLost')}</p>
        )}
        <p className="screen-subtitle">
          {t('party.roundProgress', { current: room.currentRoundIndex + 1, total: room.dilemmaCount })}
        </p>
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
    const priorRounds = Object.entries(revealHistory).filter(([index]) => Number(index) !== room.currentRoundIndex);
    const currentImbalance = Math.abs(result.firstVotes - result.secondVotes);
    const isMostDividedSoFar = priorRounds.length > 0 && priorRounds.every(
      ([, priorResult]) => Math.abs(priorResult.firstVotes - priorResult.secondVotes) >= currentImbalance,
    );
    const dimension = dominantDimension(room.currentDilemma);
    // TASK-204: the caustic tease tied to the caller's own vote this round,
    // same personalized-punchline pattern as Solo Evaluation's reveal.
    const callerVote = room.roundVotes?.find((vote) => vote.isCaller);
    const callerTease = callerVote && room.currentDilemma
      ? (callerVote.choice === 'first' ? room.currentDilemma.teaseOption1 : room.currentDilemma.teaseOption2)
      : null;
    const pieChartData = [
      {
        name: room.currentDilemma?.firstAnswer || 'Option 1',
        value: result.firstVotes,
        color: 'var(--choice-a)',
      },
      {
        name: room.currentDilemma?.secondAnswer || 'Option 2',
        value: result.secondVotes,
        color: 'var(--choice-b)',
      },
    ];

    return (
      <main className="screen-container party-room-screen">
        {pollFailureCount >= CONNECTION_LOST_THRESHOLD && (
          <p role="status" className="party-connection-banner">{t('party.connectionLost')}</p>
        )}
        <p className="screen-subtitle">
          {t('party.roundProgress', { current: room.currentRoundIndex + 1, total: room.dilemmaCount })}
        </p>
        {room.currentDilemma && <p className="text-box-default party-reveal-dilemma">{room.currentDilemma.dilemma}</p>}

        <h2 className="screen-title">{t(splitFlavorKey(result.firstVotes, result.secondVotes))}</h2>
        {isMostDividedSoFar && <p className="party-reveal-badge">{t('party.mostDividedSoFar')}</p>}
        {dimension && <p className="screen-subtitle">{t('party.dimensionTested', { dimension })}</p>}

        {callerTease && <p className="tease-text party-reveal-tease">{callerTease}</p>}

        <div className="party-reveal-chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={window.innerWidth < 480 ? 55 : 75}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: window.innerWidth < 480 ? '12px' : '14px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p>{t('party.revealSplit', { first: result.firstVotes, second: result.secondVotes })}</p>

        {room.roundVotes && room.roundVotes.length > 0 && (
          <ul className="party-participant-list party-reveal-votes">
            {room.roundVotes.map((vote, index) => (
              <li key={index} className={vote.isCaller ? 'is-caller' : ''}>
                <span>{vote.displayName}</span>
                <span className={`party-reveal-choice ${vote.choice}`}>
                  {vote.choice === 'first' ? room.currentDilemma?.firstAnswer : room.currentDilemma?.secondAnswer}
                </span>
              </li>
            ))}
          </ul>
        )}

        {room.isHost ? (
          <button type="button" className="btn-primary" onClick={handleAdvance} disabled={advancing}>
            {advancing
              ? t('party.advancing')
              : (room.currentRoundIndex + 1 < room.dilemmaCount ? t('party.nextRoundButton') : t('party.seeResultsButton'))}
          </button>
        ) : (
          <p className="party-room-waiting">{t('party.waitingForHostToContinue')}</p>
        )}
      </main>
    );
  }

  if (room.status === 'completed') {
    const awards = room.awards || {};
    const nameOf = (index) => room.participants[index]?.displayName;
    // TASK-211: averages/personalVerdict only ever appear on the caller's
    // own entry (backend-enforced - see _party_room_participant_summary),
    // so this is the one participant object anyone but them can never see.
    const callerSummary = room.participants.find((p) => p.isCaller);

    const awardCards = [];
    if (awards.closestPair) {
      awardCards.push({
        key: 'closestPair',
        text: t('party.awardClosestPair', {
          a: nameOf(awards.closestPair.participantKeys[0]),
          b: nameOf(awards.closestPair.participantKeys[1]),
          pct: awards.closestPair.agreementPct,
        }),
      });
    }
    if (awards.moralMinority) {
      awardCards.push({
        key: 'moralMinority',
        text: t('party.awardMoralMinority', { name: nameOf(awards.moralMinority.participantKey) }),
      });
    }
    if (awards.mostAlignedWithGroup) {
      awardCards.push({
        key: 'mostAlignedWithGroup',
        text: t('party.awardMostAligned', { name: nameOf(awards.mostAlignedWithGroup.participantKey) }),
      });
    }
    if (awards.contrarian) {
      awardCards.push({
        key: 'contrarian',
        text: t('party.awardContrarian', { name: nameOf(awards.contrarian.participantKey) }),
      });
    }
    if (awards.mostControversialDilemma) {
      awardCards.push({
        key: 'mostControversial',
        text: t('party.awardMostDivided', {
          first: awards.mostControversialDilemma.firstVotes,
          second: awards.mostControversialDilemma.secondVotes,
        }),
      });
    }

    // TASK-123 AC5: sequenced instead of dumped on screen at once - archetypes,
    // then the group's own archetype (TASK-210), then the AI verdict, then
    // one award at a time, then the actions.
    const stages = [
      'archetypes',
      ...(callerSummary?.averages ? ['yours'] : []),
      ...(room.groupArchetype ? ['groupArchetype'] : []),
      ...(room.groupVerdict ? ['verdict'] : []),
      ...awardCards.map((card) => card.key),
      'actions',
    ];
    const stage = stages[Math.min(revealStage, stages.length - 1)];

    // TASK-209: cinematic "stories"-style pass on the same stage sequence -
    // full-bleed slide transitions plus a segmented top progress bar,
    // replacing the old static swap + bottom "Continue" button. Explicit
    // constraint inherited from TASK-123 (the user already rejected
    // countdown/suspense there): advancement is never a timer, only an
    // explicit action - originally a tap-zone on the slide, now (per user
    // feedback: the left/right swipe wasn't intuitive) classic back/next
    // buttons at the bottom instead.
    const advanceStage = (delta) => {
      setRevealDirection(delta > 0 ? 'forward' : 'backward');
      setRevealStage((value) => Math.max(0, Math.min(stages.length - 1, value + delta)));
    };

    return (
      <main className="screen-container party-room-screen">
        <h1 className="screen-title-large party-recap-sticky-title">{t('party.completedTitle')}</h1>

        <div
          className="party-stories-progress"
          role="progressbar"
          aria-valuenow={revealStage + 1}
          aria-valuemin={1}
          aria-valuemax={stages.length}
        >
          {stages.map((_, index) => (
            <span key={index} className={`party-stories-segment${index <= revealStage ? ' is-filled' : ''}`} />
          ))}
        </div>

        <div
          key={stage}
          className={`party-stories-slide party-stories-slide-${revealDirection}`}
        >
          {stage === 'archetypes' && (
            <ul className="party-results-list">
              {room.participants.map((participant, index) => (
                <li
                  key={index}
                  className={participant.isCaller ? 'is-caller' : ''}
                  style={{ borderLeftColor: participant.archetype?.visual?.color }}
                >
                  <span className="party-results-emoji">{participant.archetype?.visual?.emoji}</span>
                  <span className="party-results-name">{participant.displayName}</span>
                  <span className="party-results-archetype">{participant.archetype?.name}</span>
                </li>
              ))}
            </ul>
          )}

          {stage === 'yours' && callerSummary?.averages && (
            <div className="party-personal-radar">
              <h2 className="screen-title">{t('party.yoursTitle')}</h2>
              <p className="screen-subtitle">{t('party.yoursIntro')}</p>
              <div className="party-personal-radar-container">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={DIMENSIONS.map((dimension) => ({
                    subject: dimension, value: callerSummary.averages[dimension] ?? 0,
                  }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 9 }} />
                    <Radar
                      name={t('results.moral_profile')}
                      dataKey="value"
                      stroke="var(--horror-crimson)"
                      fill="var(--horror-blood-red)"
                      fillOpacity={0.8}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {callerSummary.personalVerdict && (
                <p className="text-box-default">{callerSummary.personalVerdict}</p>
              )}
            </div>
          )}

          {stage === 'groupArchetype' && room.groupArchetype && (
            <div className="card-default party-group-archetype" style={{ borderColor: room.groupArchetype.visual?.color }}>
              <p className="screen-subtitle">{t('party.groupArchetypeIntro')}</p>
              <p className="party-group-archetype-emoji">{room.groupArchetype.visual?.emoji}</p>
              <h2 className="screen-title">{room.groupArchetype.name}</h2>
              <p className="party-group-archetype-description">{room.groupArchetype.description}</p>
              <p>
                <strong>{t('results.archetype_strength')}:</strong> {room.groupArchetype.strength}
              </p>
              <p>
                <strong>{t('results.archetype_blind_spot')}:</strong> {room.groupArchetype.blindSpot}
              </p>
            </div>
          )}

          {stage === 'verdict' && (
            <p className="text-box-default">{room.groupVerdict}</p>
          )}

          {awardCards.map((card) => stage === card.key && (
            <p key={card.key} className="text-box-default party-award-stage">{card.text}</p>
          ))}

          {stage === 'actions' && (
            <div className="party-final-actions">
              <button type="button" className="btn-primary" onClick={handleRematch} disabled={rematching}>
                {rematching ? t('party.rematching') : t('party.rematchButton')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  const method = await sharePartyRecapCard(
                    awards, room.participants, t('party.recapShareText'), room.groupArchetype,
                  );
                  trackEvent('party_room_recap_shared', { room_code: roomCode, method });
                }}
              >
                {t('party.shareRecapButton')}
              </button>
              <p><a href="/">← {t('common.backToHome')}</a></p>
            </div>
          )}
        </div>

        <div className="button-row party-stories-nav">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => advanceStage(-1)}
            disabled={revealStage === 0}
          >
            {t('party.storiesBackButton')}
          </button>
          {stage !== 'actions' && (
            <button type="button" className="btn-primary" onClick={() => advanceStage(1)}>
              {t('party.storiesNextButton')}
            </button>
          )}
        </div>
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
