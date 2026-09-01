import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { API_ENDPOINTS, apiFetch } from '../config/api';
import useAuth from '../auth/useAuth';
import { getApiHeaders } from '../utils/session';
import './AnalyticsAdminScreen.css';

const PERIODS = [7, 30, 90];
const PLATFORMS = ['all', 'web', 'android', 'unknown'];
const PLATFORM_COLORS = {
  web: '#1a6fc4',
  android: '#0f7b6c',
  ios: '#6940a5',
  unknown: '#8a8980',
};
const AnalyticsAdminScreen = () => {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const [days, setDays] = useState(30);
  const [platform, setPlatform] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('trends');
  const attemptedToken = useRef('');

  useEffect(() => {
    document.body.classList.add('analytics-page');
    return () => document.body.classList.remove('analytics-page');
  }, []);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language || 'it'),
    [i18n.language],
  );

  const loadOverview = useCallback(async (token, selectedDays, selectedPlatform) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const overview = await apiFetch(
        `${API_ENDPOINTS.analyticsAdminOverview}?days=${selectedDays}&platform=${selectedPlatform}`,
        {
          headers: {
            ...getApiHeaders(),
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setData(overview);
    } catch (requestError) {
      console.error('Analytics dashboard unavailable', requestError);
      setError(String(requestError.message).includes('403')
        ? t('auth.adminPending')
        : t('analyticsAdmin.accessError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const token = auth.session?.idToken;
    if (!auth.isAdmin || !token || attemptedToken.current === token || data) return;
    attemptedToken.current = token;
    void loadOverview(token, days, platform);
  }, [auth.isAdmin, auth.session?.idToken, data, days, loadOverview, platform]);

  const changePeriod = (nextDays) => {
    setDays(nextDays);
    loadOverview(auth.isAdmin ? auth.session?.idToken : '', nextDays, platform);
  };

  const changePlatform = (nextPlatform) => {
    setPlatform(nextPlatform);
    loadOverview(auth.isAdmin ? auth.session?.idToken : '', days, nextPlatform);
  };

  const lockDashboard = () => {
    setData(null);
    setError('');
    if (auth.isAuthenticated) auth.logout();
  };

  const formatNumber = (value) => (value === null || value === undefined
    ? '—'
    : numberFormatter.format(value));
  const formatDateTime = (value) => new Intl.DateTimeFormat(i18n.language || 'it', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

  if (!data) {
    const verifyingAccess = auth.loading || (auth.isAuthenticated && auth.isAdmin && loading);
    return (
      <main className="analytics-admin analytics-admin--access">
        <section className="analytics-access-card">
          <p className="analytics-eyebrow">Private workspace</p>
          <h1>{t('analyticsAdmin.title')}</h1>
          <p>
            {verifyingAccess
              ? t('analyticsAdmin.loading')
              : (auth.isAuthenticated ? t('auth.adminPending') : t('auth.adminLoginRequired'))}
          </p>
          {!verifyingAccess && auth.available && !auth.isAuthenticated && (
            <button type="button" onClick={() => auth.login('/admin/analytics')} disabled={auth.loading}>
              {t('auth.loginForAnalytics')}
            </button>
          )}
          {!verifyingAccess && auth.isAuthenticated && (
            <p className="analytics-security-note">{auth.user?.email}</p>
          )}
          {error && <p className="analytics-error" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  const summaryCards = [
    ['registeredUsers', data.summary.registeredUsers],
    ['activeIdentities', data.summary.activeIdentities],
    ['events', data.summary.totalEvents],
    ['sessions', data.summary.uniqueSessions],
  ];
  const abuse = data.abuseMonitoring || {
    summary: {
      observedIdentities: data.summary.activeIdentities,
      watch: 0,
      suspicious: 0,
      maxPeakEventsPerMinute: 0,
    },
    thresholds: {},
    anomalies: [],
  };
  const abuseCards = [
    ['abuseObserved', abuse.summary.observedIdentities],
    ['abuseWatch', abuse.summary.watch],
    ['abuseSuspicious', abuse.summary.suspicious],
    ['abuseMaxPeak', abuse.summary.maxPeakEventsPerMinute],
  ];
  const timeZoneCounts = data.timeZoneCounts || { unknown: data.summary.totalEvents };
  const dailyData = Array.isArray(data.daily) ? data.daily : [];
  const platformData = Array.isArray(data.platformBreakdown) ? data.platformBreakdown : [];
  const dailyMoralCrime = data.dailyMoralCrime || {};
  const dailyFunnel = Array.isArray(dailyMoralCrime.eventFunnel) ? dailyMoralCrime.eventFunnel : [];
  const dailyAggregate = dailyMoralCrime.currentAggregate || {};
  const dailyFunnelMaximum = Math.max(...dailyFunnel.map((stage) => stage.identities), 1);

  const partyRoom = data.partyRoom || {};
  const partyFunnel = Array.isArray(partyRoom.eventFunnel) ? partyRoom.eventFunnel : [];
  const partyFunnelMaximum = Math.max(...partyFunnel.map((stage) => stage.identities), 1);
  const partyHostActions = Object.entries(partyRoom.hostActions || {});

  const moralDuel = data.moralDuel || {};
  const duelFunnel = Array.isArray(moralDuel.eventFunnel) ? moralDuel.eventFunnel : [];
  const duelFunnelMaximum = Math.max(...duelFunnel.map((stage) => stage.identities), 1);

  const interactionBreakdowns = data.interactionBreakdowns || {};
  const modeSelectedBreakdown = Array.isArray(interactionBreakdowns.modeSelected) ? interactionBreakdowns.modeSelected : [];
  const shareClickedBreakdown = Array.isArray(interactionBreakdowns.shareClicked) ? interactionBreakdowns.shareClicked : [];
  const authPromptCtr = Array.isArray(interactionBreakdowns.authPromptCtr) ? interactionBreakdowns.authPromptCtr : [];

  const retentionCohorts = data.retentionCohorts || {};
  const retentionD1 = retentionCohorts.d1 || {};
  const retentionD7 = retentionCohorts.d7 || {};
  const viralCoefficient = Array.isArray(data.viralCoefficient) ? data.viralCoefficient : [];
  const creativeVariants = Array.isArray(data.creativeVariants) ? data.creativeVariants : [];
  const copyExperiments = data.copyExperiments || {};
  const copyExperimentRows = Object.entries(copyExperiments).flatMap(([experiment, rows]) => (
    Array.isArray(rows) ? rows.map((row) => ({ experiment, ...row })) : []
  ));

  return (
    <main className="analytics-admin">
      <aside className="analytics-sidebar">
        <div className="analytics-sidebar-brand">
          <span className="analytics-workspace-mark" aria-hidden="true">M</span>
          <div>
            <strong>MTM</strong>
            <small>Analytics workspace</small>
          </div>
        </div>
        <nav className="analytics-sidebar-nav" role="tablist" aria-label={t('analyticsAdmin.title')} aria-orientation="vertical">
          {[
            ['abuse', '⌁', t('analyticsAdmin.abuseTitle')],
            ['growth', '↗', t('analyticsAdmin.growthTitle')],
            ['daily', '◉', t('analyticsAdmin.dailyTitle')],
            ['party', '◈', t('analyticsAdmin.partyTitle')],
            ['duel', '⚔', t('analyticsAdmin.duelTitle')],
            ['interactions', '⊙', t('analyticsAdmin.interactionsTitle')],
            ['trends', '↝', t('analyticsAdmin.trend')],
            ['funnel', '↳', t('analyticsAdmin.funnel')],
            ['breakdowns', '▦', t('analyticsAdmin.breakdowns')],
            ['events', '≡', t('analyticsAdmin.recentEvents')],
          ].map(([id, icon, label]) => (
            <button
              type="button"
              key={id}
              id={`tab-${id}`}
              role="tab"
              className={`analytics-nav-item${activeSection === id ? ' is-active' : ''}`}
              aria-selected={activeSection === id}
              aria-controls={`panel-${id}`}
              aria-current={activeSection === id ? 'page' : undefined}
              onClick={() => setActiveSection(id)}
            >
              <span aria-hidden="true">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="analytics-sidebar-account">
          <span className="analytics-account-avatar" aria-hidden="true">
            {(auth.user?.email || 'A').slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{auth.user?.email || t('analyticsAdmin.privateWorkspace')}</strong>
            <small>{t('analyticsAdmin.platforms')}</small>
          </div>
        </div>
      </aside>

      <div className={`analytics-content${loading ? ' analytics-content--loading' : ''}`}>
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">Workspace / Analytics</p>
          <h1>{t('analyticsAdmin.title')}</h1>
          <p>{t('analyticsAdmin.subtitle')}</p>
        </div>
        <div className="analytics-header-actions">
          <button type="button" onClick={() => loadOverview(auth.isAdmin ? auth.session?.idToken : '', days, platform)} disabled={loading}>
            {loading ? t('analyticsAdmin.loading') : t('analyticsAdmin.refresh')}
          </button>
          <button type="button" className="analytics-button--quiet" onClick={lockDashboard}>
            {t('analyticsAdmin.lock')}
          </button>
        </div>
      </header>

      <div className="analytics-filters">
        <nav className="analytics-periods" aria-label={t('analyticsAdmin.period')}>
          {PERIODS.map((period) => (
            <button
              type="button"
              key={period}
              className={period === days ? 'is-active' : ''}
              onClick={() => changePeriod(period)}
              disabled={loading}
              aria-pressed={period === days}
            >
              {period} {t('analyticsAdmin.days')}
            </button>
          ))}
        </nav>
        <nav className="analytics-periods" aria-label={t('analyticsAdmin.platformFilter')}>
          {PLATFORMS.map((platformOption) => (
            <button
              type="button"
              key={platformOption}
              className={platformOption === platform ? 'is-active' : ''}
              onClick={() => changePlatform(platformOption)}
              disabled={loading}
              aria-pressed={platformOption === platform}
            >
              {platformOption === 'all' ? t('analyticsAdmin.allPlatforms') : platformOption}
            </button>
          ))}
        </nav>
      </div>

      {error && <p className="analytics-error" role="alert">{error}</p>}

      {data.dataQuality.historicalPlatformIsEstimated && (
        <aside className="analytics-quality-note">
          <strong>{t('analyticsAdmin.qualityTitle')}</strong>
          <span>{t('analyticsAdmin.qualityDescription')}</span>
        </aside>
      )}

      <section className="analytics-kpis" aria-label={t('analyticsAdmin.summary')}>
        {summaryCards.map(([label, value]) => (
          <article className="analytics-card analytics-kpi" key={label}>
            <span>{t(`analyticsAdmin.${label}`)}</span>
            <strong>{formatNumber(value)}</strong>
          </article>
        ))}
      </section>

      {activeSection === 'abuse' && (
      <section className="analytics-card analytics-abuse" id="panel-abuse" role="tabpanel" aria-labelledby="tab-abuse">
        <div className="analytics-section-heading">
          <div>
            <h2>{t('analyticsAdmin.abuseTitle')}</h2>
            <p>{t('analyticsAdmin.abuseDescription')}</p>
          </div>
          <span className="analytics-badge analytics-badge--review">
            {t('analyticsAdmin.abuseHumanReview')}
          </span>
        </div>
        <div className="analytics-abuse-kpis">
          {abuseCards.map(([label, value]) => (
            <div key={label}>
              <span>{t(`analyticsAdmin.${label}`)}</span>
              <strong>{formatNumber(value)}</strong>
            </div>
          ))}
        </div>
        <aside className="analytics-abuse-note">
          <strong>{t('analyticsAdmin.abuseThresholdsTitle')}</strong>
          <span>{t('analyticsAdmin.abuseThresholds', {
            watchPeak: abuse.thresholds.watchPeakEventsPerMinute ?? 15,
            suspiciousPeak: abuse.thresholds.suspiciousPeakEventsPerMinute ?? 30,
            replay: abuse.thresholds.rapidReplayDilemmas ?? 50,
            minutes: abuse.thresholds.rapidReplayMaxMinutes ?? 30,
          })}</span>
          <small>{t('analyticsAdmin.abuseGuardLimitation')}</small>
        </aside>
        <div className="analytics-table-wrap analytics-table-wrap--stack">
          <table>
            <thead>
              <tr>
                <th>{t('analyticsAdmin.identity')}</th>
                <th>{t('analyticsAdmin.abuseRisk')}</th>
                <th className="analytics-num">{t('analyticsAdmin.events')}</th>
                <th className="analytics-num">{t('analyticsAdmin.abusePeak')}</th>
                <th className="analytics-num">{t('analyticsAdmin.abuseFlow')}</th>
                <th className="analytics-num">{t('analyticsAdmin.sessions')}</th>
                <th>{t('analyticsAdmin.platform')}</th>
                <th>{t('analyticsAdmin.abuseReasons')}</th>
                <th>{t('analyticsAdmin.abuseLastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {abuse.anomalies.length ? abuse.anomalies.map((row) => (
                <tr key={row.identity}>
                  <td data-label={t('analyticsAdmin.identity')}><code>{row.identity}</code><small className="analytics-cell-note">{row.identitySource}</small></td>
                  <td data-label={t('analyticsAdmin.abuseRisk')}><span className={`analytics-badge analytics-badge--${row.risk}`}>{t(`analyticsAdmin.abuseRisk_${row.risk}`)}</span></td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.events')}>{formatNumber(row.events)}</td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.abusePeak')}>{formatNumber(row.peakEventsPerMinute)}/min</td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.abuseFlow')}>{formatNumber(row.dilemmasFetched)} / {formatNumber(row.votesCast)} / {formatNumber(row.resultsAnalyzed)}</td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.sessions')}>{formatNumber(row.sessions)}</td>
                  <td data-label={t('analyticsAdmin.platform')}>{row.platform}</td>
                  <td className="analytics-reasons" data-label={t('analyticsAdmin.abuseReasons')}>
                    {row.reasons.map((reason) => (
                      <span key={reason}>{t(`analyticsAdmin.abuseReason_${reason}`)}</span>
                    ))}
                  </td>
                  <td data-label={t('analyticsAdmin.abuseLastSeen')}>{formatDateTime(row.lastSeen)}</td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="analytics-empty-row">{t('analyticsAdmin.abuseNoAnomalies')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === 'growth' && (
      <section className="analytics-grid analytics-grid--three" id="panel-growth" role="tabpanel" aria-labelledby="tab-growth">
        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.retentionTitle')}</h2>
              <p>{t('analyticsAdmin.retentionDescription')}</p>
            </div>
          </div>
          <p className="analytics-card-copy analytics-daily-scope">{t('analyticsAdmin.retentionScope')}</p>
          <section className="analytics-kpis analytics-retention-kpis" aria-label={t('analyticsAdmin.retentionTitle')}>
            {[['retentionD1', retentionD1], ['retentionD7', retentionD7]].map(([label, stat]) => (
              <article className="analytics-card analytics-kpi" key={label}>
                <span>{t(`analyticsAdmin.${label}`)}</span>
                <strong>
                  {stat.insufficientSample ? t('analyticsAdmin.retentionInsufficientSample') : `${stat.retentionPct}%`}
                </strong>
                <small className="analytics-cell-note">
                  {t('analyticsAdmin.retentionCohortSize', { count: stat.cohortSize || 0 })}
                </small>
              </article>
            ))}
          </section>
        </article>

        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.viralCoefficientTitle')}</h2>
              <p>{t('analyticsAdmin.viralCoefficientDescription')}</p>
            </div>
          </div>
          <div className="analytics-table-wrap analytics-table-wrap--stack">
            <table>
              <thead>
                <tr>
                  <th>{t('analyticsAdmin.viralChannel')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.viralShareAttempts')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.viralCompletedReferrals')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.viralCoefficient')}</th>
                </tr>
              </thead>
              <tbody>
                {viralCoefficient.length ? viralCoefficient.map((row) => (
                  <tr key={row.channel}>
                    <td data-label={t('analyticsAdmin.viralChannel')}><code>{row.channel}</code></td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.viralShareAttempts')}>{formatNumber(row.shareAttempts)}</td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.viralCompletedReferrals')}>{formatNumber(row.completedReferrals)}</td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.viralCoefficient')}>
                      {row.viralCoefficient === null ? '—' : row.viralCoefficient}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="analytics-empty-row">{t('analyticsAdmin.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.creativeVariantsTitle')}</h2>
              <p>{t('analyticsAdmin.creativeVariantsDescription')}</p>
            </div>
          </div>
          <div className="analytics-table-wrap analytics-table-wrap--stack">
            <table>
              <thead>
                <tr>
                  <th>{t('analyticsAdmin.creativeVariant')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.viralShareAttempts')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.viralCompletedReferrals')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.creativeConversionRate')}</th>
                </tr>
              </thead>
              <tbody>
                {creativeVariants.length ? creativeVariants.map((row) => (
                  <tr key={row.variant}>
                    <td data-label={t('analyticsAdmin.creativeVariant')}><code>{row.variant}</code></td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.viralShareAttempts')}>{formatNumber(row.shareAttempts)}</td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.viralCompletedReferrals')}>{formatNumber(row.completedReferrals)}</td>
                    <td className="analytics-num" data-label={t('analyticsAdmin.creativeConversionRate')}>
                      {row.conversionRatePct === null ? '—' : `${row.conversionRatePct}%`}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="analytics-empty-row">{t('analyticsAdmin.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
      )}

      {activeSection === 'growth' && (
      <section className="analytics-card" id="panel-growth-experiments">
        <div className="analytics-section-heading">
          <div>
            <h2>{t('analyticsAdmin.copyExperimentsTitle')}</h2>
            <p>{t('analyticsAdmin.copyExperimentsDescription')}</p>
          </div>
        </div>
        <div className="analytics-table-wrap analytics-table-wrap--stack">
          <table>
            <thead>
              <tr>
                <th>{t('analyticsAdmin.copyExperiment')}</th>
                <th>{t('analyticsAdmin.creativeVariant')}</th>
                <th className="analytics-num">{t('analyticsAdmin.copyExposed')}</th>
                <th className="analytics-num">{t('analyticsAdmin.copyConverted')}</th>
                <th className="analytics-num">{t('analyticsAdmin.creativeConversionRate')}</th>
              </tr>
            </thead>
            <tbody>
              {copyExperimentRows.length ? copyExperimentRows.map((row) => (
                <tr key={`${row.experiment}-${row.variant}`}>
                  <td data-label={t('analyticsAdmin.copyExperiment')}><code>{row.experiment}</code></td>
                  <td data-label={t('analyticsAdmin.creativeVariant')}><code>{row.variant}</code></td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.copyExposed')}>{formatNumber(row.exposed)}</td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.copyConverted')}>{formatNumber(row.converted)}</td>
                  <td className="analytics-num" data-label={t('analyticsAdmin.creativeConversionRate')}>
                    {row.insufficientSample ? t('analyticsAdmin.retentionInsufficientSample') : `${row.conversionRatePct}%`}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="analytics-empty-row">{t('analyticsAdmin.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === 'daily' && (
      <section className="analytics-grid analytics-grid--daily" id="panel-daily" role="tabpanel" aria-labelledby="tab-daily">
        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.dailyTitle')}</h2>
              <p>{t('analyticsAdmin.dailyDescription')}</p>
            </div>
          </div>
          <p className="analytics-card-copy analytics-daily-scope">{t('analyticsAdmin.dailyEventScope')}</p>
          {dailyFunnel.length ? (
            <div className="analytics-daily-funnel">
              {dailyFunnel.map((stage, index) => (
                <div className="analytics-funnel-row" key={stage.stage}>
                  <div>
                    <span>{index + 1}. {t(`analyticsAdmin.dailyStage_${stage.stage}`)}</span>
                    <strong>{formatNumber(stage.identities)}</strong>
                  </div>
                  <div className="analytics-funnel-track">
                    <i style={{ width: `${Math.max((stage.identities / dailyFunnelMaximum) * 100, stage.identities ? 3 : 0)}%` }} />
                  </div>
                  <small>
                    {stage.fromPreviousPct === null
                      ? t('analyticsAdmin.baseline')
                      : `${stage.fromPreviousPct}% ${t('analyticsAdmin.fromPrevious')}`}
                  </small>
                </div>
              ))}
            </div>
          ) : <p className="analytics-chart-empty">{t('analyticsAdmin.noData')}</p>}
        </article>

        <article className="analytics-card analytics-daily-aggregate">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.dailyVoteDistribution')}</h2>
              <p>{t('analyticsAdmin.dailyAggregateScope')}</p>
            </div>
          </div>
          {dailyAggregate.available ? (
            <>
              <div className="analytics-daily-total">
                <span>{t('analyticsAdmin.dailyResponses')}</span>
                <strong>{formatNumber(dailyAggregate.totalVotes || 0)}</strong>
                <small>{dailyAggregate.dayKey}</small>
              </div>
              <div className="analytics-daily-options">
                {[
                  ['first', dailyAggregate.firstVotes, dailyAggregate.firstPct],
                  ['second', dailyAggregate.secondVotes, dailyAggregate.secondPct],
                ].map(([option, votes, percentage]) => (
                  <div className="analytics-daily-option" key={option}>
                    <div>
                      <span>{t(`analyticsAdmin.dailyOption_${option}`)}</span>
                      <strong>{formatNumber(votes || 0)} · {percentage || 0}%</strong>
                    </div>
                    <div className={`analytics-daily-option-bar analytics-daily-option-bar--${option}`} aria-hidden="true">
                      <i style={{ width: `${percentage || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="analytics-chart-empty">{t('analyticsAdmin.dailyAggregateUnavailable')}</p>}
        </article>
      </section>
      )}

      {activeSection === 'party' && (
      <section className="analytics-grid analytics-grid--daily" id="panel-party" role="tabpanel" aria-labelledby="tab-party">
        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.partyTitle')}</h2>
              <p>{t('analyticsAdmin.partyDescription')}</p>
            </div>
          </div>
          <p className="analytics-card-copy analytics-daily-scope">{t('analyticsAdmin.partyEventScope')}</p>
          {partyFunnel.length ? (
            <div className="analytics-daily-funnel">
              {partyFunnel.map((stage, index) => (
                <div className="analytics-funnel-row" key={stage.stage}>
                  <div>
                    <span>{index + 1}. {t(`analyticsAdmin.partyStage_${stage.stage}`)}</span>
                    <strong>{formatNumber(stage.identities)}</strong>
                  </div>
                  <div className="analytics-funnel-track">
                    <i style={{ width: `${Math.max((stage.identities / partyFunnelMaximum) * 100, stage.identities ? 3 : 0)}%` }} />
                  </div>
                  <small>
                    {stage.fromPreviousPct === null
                      ? t('analyticsAdmin.baseline')
                      : `${stage.fromPreviousPct}% ${t('analyticsAdmin.fromPrevious')}`}
                  </small>
                </div>
              ))}
            </div>
          ) : <p className="analytics-chart-empty">{t('analyticsAdmin.noData')}</p>}
        </article>

        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.partyHostActionsTitle')}</h2>
              <p>{t('analyticsAdmin.partyHostActionsDescription')}</p>
            </div>
          </div>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {partyHostActions.map(([key, count]) => (
              <div key={key}>
                <code>{t(`analyticsAdmin.partyHostAction_${key}`)}</code>
                <strong>{formatNumber(count)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
      )}

      {activeSection === 'duel' && (
      <section className="analytics-card" id="panel-duel" role="tabpanel" aria-labelledby="tab-duel">
        <div className="analytics-section-heading">
          <div>
            <h2>{t('analyticsAdmin.duelTitle')}</h2>
            <p>{t('analyticsAdmin.duelDescription')}</p>
          </div>
        </div>
        <p className="analytics-card-copy analytics-daily-scope">{t('analyticsAdmin.duelEventScope')}</p>
        {duelFunnel.length ? (
          <div className="analytics-daily-funnel">
            {duelFunnel.map((stage, index) => (
              <div className="analytics-funnel-row" key={stage.stage}>
                <div>
                  <span>{index + 1}. {t(`analyticsAdmin.duelStage_${stage.stage}`)}</span>
                  <strong>{formatNumber(stage.identities)}</strong>
                </div>
                <div className="analytics-funnel-track">
                  <i style={{ width: `${Math.max((stage.identities / duelFunnelMaximum) * 100, stage.identities ? 3 : 0)}%` }} />
                </div>
                <small>
                  {stage.fromPreviousPct === null
                    ? t('analyticsAdmin.baseline')
                    : `${stage.fromPreviousPct}% ${t('analyticsAdmin.fromPrevious')}`}
                </small>
              </div>
            ))}
          </div>
        ) : <p className="analytics-chart-empty">{t('analyticsAdmin.noData')}</p>}
      </section>
      )}

      {activeSection === 'interactions' && (
      <section className="analytics-grid analytics-grid--daily" id="panel-interactions" role="tabpanel" aria-labelledby="tab-interactions">
        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.interactionsTitle')}</h2>
              <p>{t('analyticsAdmin.interactionsDescription')}</p>
            </div>
          </div>
          <h3>{t('analyticsAdmin.modeSelectedTitle')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {modeSelectedBreakdown.length ? modeSelectedBreakdown.map((row) => (
              <div key={row.mode}><code>{row.mode}</code><strong>{formatNumber(row.count)}</strong></div>
            )) : <p>{t('analyticsAdmin.noData')}</p>}
          </div>
          <h3>{t('analyticsAdmin.shareClickedTitle')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {shareClickedBreakdown.length ? shareClickedBreakdown.map((row) => (
              <div key={`${row.channel}-${row.objectType}`}>
                <code>{row.channel} · {row.objectType}</code>
                <strong>{formatNumber(row.count)}</strong>
              </div>
            )) : <p>{t('analyticsAdmin.noData')}</p>}
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.authPromptCtrTitle')}</h2>
              <p>{t('analyticsAdmin.authPromptCtrDescription')}</p>
            </div>
          </div>
          <div className="analytics-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('analyticsAdmin.ctrSurface')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.ctrShown')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.ctrClicked')}</th>
                  <th className="analytics-num">{t('analyticsAdmin.ctrRate')}</th>
                </tr>
              </thead>
              <tbody>
                {authPromptCtr.length ? authPromptCtr.map((row) => (
                  <tr key={row.surface}>
                    <td><code>{row.surface}</code></td>
                    <td className="analytics-num">{formatNumber(row.shown)}</td>
                    <td className="analytics-num">{formatNumber(row.clicked)}</td>
                    <td className="analytics-num">{row.clickThroughPct === null ? '—' : `${row.clickThroughPct}%`}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="analytics-empty-row">{t('analyticsAdmin.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
      )}

      {activeSection === 'trends' && (
      <section className="analytics-grid analytics-grid--wide" id="panel-trends" role="tabpanel" aria-labelledby="tab-trends">
        <article className="analytics-card analytics-chart-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.trend')}</h2>
              <p>{t('analyticsAdmin.trendDescription')}</p>
            </div>
          </div>
          <div className="analytics-chart">
            {dailyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} minTickGap={28} stroke="#c9c9c5" tick={{ fill: '#5d5c58', fontSize: 12 }} />
                  <YAxis allowDecimals={false} width={42} stroke="#c9c9c5" tick={{ fill: '#5d5c58', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e3e3e0', borderRadius: '6px', color: '#2b2924' }} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
                  <Line type="monotone" dataKey="events" name={t('analyticsAdmin.events')} stroke="#1a6fc4" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="users" name={t('analyticsAdmin.activeIdentities')} stroke="#2b2924" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="analytics-chart-empty">{t('analyticsAdmin.noData')}</p>}
          </div>
        </article>

        <article className="analytics-card analytics-chart-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.platforms')}</h2>
              <p>{t('analyticsAdmin.platformDescription')}</p>
            </div>
          </div>
          <div className="analytics-chart analytics-chart--platform">
            {platformData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e0" vertical={false} />
                  <XAxis dataKey="platform" stroke="#c9c9c5" tick={{ fill: '#5d5c58', fontSize: 12 }} />
                  <YAxis allowDecimals={false} width={42} stroke="#c9c9c5" tick={{ fill: '#5d5c58', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e3e3e0', borderRadius: '6px', color: '#2b2924' }} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
                  <Bar dataKey="exact" name={t('analyticsAdmin.exact')} stackId="quality" fill="#0f7b6c" />
                  <Bar dataKey="inferred" name={t('analyticsAdmin.inferred')} stackId="quality" fill="#d9730d" />
                  <Bar dataKey="unknown" name={t('analyticsAdmin.unknown')} stackId="quality" fill="#8a8980" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="analytics-chart-empty">{t('analyticsAdmin.noData')}</p>}
          </div>
          <div className="analytics-platform-totals">
            {platformData.map((platform) => (
              <div key={platform.platform}>
                <i style={{ backgroundColor: PLATFORM_COLORS[platform.platform] }} />
                <span>{platform.platform}</span>
                <strong>{formatNumber(platform.total)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
      )}

      {activeSection === 'funnel' && (
      <section className="analytics-grid analytics-grid--two" id="panel-funnel" role="tabpanel" aria-labelledby="tab-funnel">
        <article className="analytics-card">
          <h2>{t('analyticsAdmin.funnel')}</h2>
          <p className="analytics-card-copy">{t('analyticsAdmin.funnelDescription')}</p>
          <div className="analytics-funnel">
            {data.funnel.map((stage, index) => {
              const maximum = Math.max(data.funnel[0]?.users || 1, stage.users);
              return (
                <div className="analytics-funnel-row" key={stage.stage}>
                  <div>
                    <span>{index + 1}. {t(`analyticsAdmin.stage_${stage.stage}`)}</span>
                    <strong>{formatNumber(stage.users)}</strong>
                  </div>
                  <div className="analytics-funnel-track">
                    <i style={{ width: `${Math.max((stage.users / maximum) * 100, stage.users ? 3 : 0)}%` }} />
                  </div>
                  <small>
                    {stage.fromPreviousPct === null
                      ? t('analyticsAdmin.baseline')
                      : `${stage.fromPreviousPct}% ${t('analyticsAdmin.fromPrevious')}`}
                  </small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="analytics-card">
          <h2>{t('analyticsAdmin.eventsByType')}</h2>
          <div className="analytics-ranked-list">
            {data.eventCounts.map((event) => (
              <div key={event.eventName}>
                <code>{event.eventName}</code>
                <strong>{formatNumber(event.count)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
      )}

      {activeSection === 'breakdowns' && (
        <section className="analytics-card analytics-breakdowns" id="panel-breakdowns" role="tabpanel" aria-labelledby="tab-breakdowns">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.breakdowns')}</h2>
              <p>{t('analyticsAdmin.exactPlatform')}: {formatNumber(data.dataQuality.exactPlatformCoveragePct)}%</p>
            </div>
          </div>
          <h3>{t('analyticsAdmin.dataSources')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {Object.entries(data.sourceCounts).map(([source, count]) => (
              <div key={source}><code>{source}</code><strong>{formatNumber(count)}</strong></div>
            ))}
          </div>
          <h3>{t('analyticsAdmin.languages')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {Object.entries(data.languageCounts).map(([language, count]) => (
              <div key={language}><code>{language}</code><strong>{formatNumber(count)}</strong></div>
            ))}
          </div>
          <h3>{t('analyticsAdmin.timeZones')}</h3>
          <p className="analytics-card-copy">
            {t('analyticsAdmin.timeZoneDescription', {
              coverage: data.dataQuality.timeZoneCoveragePct || 0,
            })}
          </p>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {Object.entries(timeZoneCounts).map(([timeZone, count]) => (
              <div key={timeZone}><code>{timeZone}</code><strong>{formatNumber(count)}</strong></div>
            ))}
          </div>
          <h3>{t('analyticsAdmin.appVersions')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {Object.entries(data.appVersionCounts).map(([version, count]) => (
              <div key={version}><code>{version}</code><strong>{formatNumber(count)}</strong></div>
            ))}
          </div>
          <h3>{t('analyticsAdmin.topDilemmas')}</h3>
          <div className="analytics-ranked-list analytics-ranked-list--compact">
            {data.topDilemmas.length ? data.topDilemmas.map((dilemma) => (
              <div key={dilemma.dilemmaId}>
                <code title={dilemma.dilemmaId}>{dilemma.dilemmaId}</code>
                <strong>{formatNumber(dilemma.events)}</strong>
              </div>
            )) : <p>{t('analyticsAdmin.noData')}</p>}
          </div>
        </section>
      )}

      {activeSection === 'events' && (
      <section className="analytics-card analytics-recent" id="panel-events" role="tabpanel" aria-labelledby="tab-events">
        <div className="analytics-section-heading">
          <div>
            <h2>{t('analyticsAdmin.recentEvents')}</h2>
            <p>{t('analyticsAdmin.recentDescription')}</p>
          </div>
          <span>{t('analyticsAdmin.generatedAt')} {formatDateTime(data.generatedAt)}</span>
        </div>
        <div className="analytics-table-wrap analytics-table-wrap--stack">
          <table>
            <thead>
              <tr>
                <th>{t('analyticsAdmin.time')}</th>
                <th>{t('analyticsAdmin.event')}</th>
                <th>{t('analyticsAdmin.platform')}</th>
                <th>{t('analyticsAdmin.version')}</th>
                <th>{t('analyticsAdmin.quality')}</th>
                <th>{t('analyticsAdmin.source')}</th>
                <th>{t('analyticsAdmin.identity')}</th>
                <th>{t('analyticsAdmin.details')}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((event, index) => (
                <tr key={`${event.occurredAt}-${event.eventName}-${index}`}>
                  <td data-label={t('analyticsAdmin.time')}>{formatDateTime(event.occurredAt)}</td>
                  <td data-label={t('analyticsAdmin.event')}><code>{event.eventName}</code></td>
                  <td data-label={t('analyticsAdmin.platform')}>{event.platform}</td>
                  <td data-label={t('analyticsAdmin.version')}>{event.appVersion}</td>
                  <td data-label={t('analyticsAdmin.quality')}><span className={`analytics-badge analytics-badge--${event.platformResolution}`}>{event.platformResolution}</span></td>
                  <td data-label={t('analyticsAdmin.source')}>{event.source}</td>
                  <td data-label={t('analyticsAdmin.identity')}><code>{event.identity}</code></td>
                  <td className="analytics-details-cell" data-label={t('analyticsAdmin.details')}>
                    {Object.keys(event.properties).length ? (
                      <details>
                        <summary>
                          {t('analyticsAdmin.propertiesCount', { count: Object.keys(event.properties).length })}
                        </summary>
                        <dl>
                          {Object.entries(event.properties).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    ) : <span className="analytics-cell-empty">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
      </div>
    </main>
  );
};

export default AnalyticsAdminScreen;
