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
  web: '#2383e2',
  android: '#0f7b6c',
  ios: '#6940a5',
  unknown: '#9b9a97',
};

const AnalyticsAdminScreen = () => {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const [days, setDays] = useState(30);
  const [platform, setPlatform] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const formatNumber = (value) => numberFormatter.format(value || 0);
  const formatDateTime = (value) => new Intl.DateTimeFormat(i18n.language || 'it', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

  if (!data) {
    return (
      <main className="analytics-admin analytics-admin--access">
        <section className="analytics-access-card">
          <p className="analytics-eyebrow">Private workspace</p>
          <h1>{t('analyticsAdmin.title')}</h1>
          <p>{auth.isAuthenticated ? t('auth.adminPending') : t('auth.adminLoginRequired')}</p>
          {auth.available && !auth.isAuthenticated && (
            <button type="button" onClick={() => auth.login('/admin/analytics')} disabled={auth.loading}>
              {t('auth.loginForAnalytics')}
            </button>
          )}
          {auth.isAuthenticated && (
            <p className="analytics-security-note">{auth.user?.email}</p>
          )}
          {error && <p className="analytics-error" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  const summaryCards = [
    ['events', data.summary.totalEvents],
    ['activeIdentities', data.summary.activeIdentities],
    ['sessions', data.summary.uniqueSessions],
    ['exactPlatform', `${data.dataQuality.exactPlatformCoveragePct}%`],
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
        <nav className="analytics-sidebar-nav" aria-label={t('analyticsAdmin.title')}>
          <a href="#overview"><span aria-hidden="true">◫</span>{t('analyticsAdmin.summary')}</a>
          <a href="#abuse"><span aria-hidden="true">⌁</span>{t('analyticsAdmin.abuseTitle')}</a>
          <a href="#trends"><span aria-hidden="true">⌁</span>{t('analyticsAdmin.trend')}</a>
          <a href="#funnel"><span aria-hidden="true">↳</span>{t('analyticsAdmin.funnel')}</a>
          <a href="#events"><span aria-hidden="true">≡</span>{t('analyticsAdmin.recentEvents')}</a>
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

      <div className="analytics-content">
      <header className="analytics-header" id="overview">
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
            <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
          </article>
        ))}
      </section>

      <section className="analytics-card analytics-abuse" id="abuse">
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
        <div className="analytics-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('analyticsAdmin.identity')}</th>
                <th>{t('analyticsAdmin.abuseRisk')}</th>
                <th>{t('analyticsAdmin.events')}</th>
                <th>{t('analyticsAdmin.abusePeak')}</th>
                <th>{t('analyticsAdmin.abuseFlow')}</th>
                <th>{t('analyticsAdmin.sessions')}</th>
                <th>{t('analyticsAdmin.platform')}</th>
                <th>{t('analyticsAdmin.abuseReasons')}</th>
                <th>{t('analyticsAdmin.abuseLastSeen')}</th>
              </tr>
            </thead>
            <tbody>
              {abuse.anomalies.length ? abuse.anomalies.map((row) => (
                <tr key={row.identity}>
                  <td><code>{row.identity}</code><small className="analytics-cell-note">{row.identitySource}</small></td>
                  <td><span className={`analytics-badge analytics-badge--${row.risk}`}>{t(`analyticsAdmin.abuseRisk_${row.risk}`)}</span></td>
                  <td>{formatNumber(row.events)}</td>
                  <td>{formatNumber(row.peakEventsPerMinute)}/min</td>
                  <td>{formatNumber(row.dilemmasFetched)} / {formatNumber(row.votesCast)} / {formatNumber(row.resultsAnalyzed)}</td>
                  <td>{formatNumber(row.sessions)}</td>
                  <td>{row.platform}</td>
                  <td className="analytics-reasons">
                    {row.reasons.map((reason) => (
                      <span key={reason}>{t(`analyticsAdmin.abuseReason_${reason}`)}</span>
                    ))}
                  </td>
                  <td>{formatDateTime(row.lastSeen)}</td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="analytics-empty-row">{t('analyticsAdmin.abuseNoAnomalies')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-grid analytics-grid--wide" id="trends">
        <article className="analytics-card analytics-chart-card">
          <div className="analytics-section-heading">
            <div>
              <h2>{t('analyticsAdmin.trend')}</h2>
              <p>{t('analyticsAdmin.trendDescription')}</p>
            </div>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececea" />
                <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} stroke="#9b9a97" />
                <YAxis allowDecimals={false} stroke="#9b9a97" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e7e7e5', borderRadius: '6px', color: '#37352f' }} />
                <Legend />
                <Line type="monotone" dataKey="events" name={t('analyticsAdmin.events')} stroke="#2383e2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="users" name={t('analyticsAdmin.activeIdentities')} stroke="#37352f" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.platformBreakdown} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ececea" />
                <XAxis dataKey="platform" stroke="#9b9a97" />
                <YAxis allowDecimals={false} stroke="#9b9a97" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e7e7e5', borderRadius: '6px', color: '#37352f' }} />
                <Legend />
                <Bar dataKey="exact" name={t('analyticsAdmin.exact')} stackId="quality" fill="#0f7b6c" />
                <Bar dataKey="inferred" name={t('analyticsAdmin.inferred')} stackId="quality" fill="#d9730d" />
                <Bar dataKey="unknown" name={t('analyticsAdmin.unknown')} stackId="quality" fill="#9b9a97" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-platform-totals">
            {data.platformBreakdown.map((platform) => (
              <div key={platform.platform}>
                <i style={{ backgroundColor: PLATFORM_COLORS[platform.platform] }} />
                <span>{platform.platform}</span>
                <strong>{formatNumber(platform.total)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-grid--three" id="funnel">
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

        <article className="analytics-card">
          <h2>{t('analyticsAdmin.breakdowns')}</h2>
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
        </article>
      </section>

      <section className="analytics-card analytics-recent" id="events">
        <div className="analytics-section-heading">
          <div>
            <h2>{t('analyticsAdmin.recentEvents')}</h2>
            <p>{t('analyticsAdmin.recentDescription')}</p>
          </div>
          <span>{t('analyticsAdmin.generatedAt')} {formatDateTime(data.generatedAt)}</span>
        </div>
        <div className="analytics-table-wrap">
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
                  <td>{formatDateTime(event.occurredAt)}</td>
                  <td><code>{event.eventName}</code></td>
                  <td>{event.platform}</td>
                  <td>{event.appVersion}</td>
                  <td><span className={`analytics-badge analytics-badge--${event.platformResolution}`}>{event.platformResolution}</span></td>
                  <td>{event.source}</td>
                  <td><code>{event.identity}</code></td>
                  <td><code>{Object.keys(event.properties).length ? JSON.stringify(event.properties) : '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </main>
  );
};

export default AnalyticsAdminScreen;
