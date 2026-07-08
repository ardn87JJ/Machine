import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import {
  createScan,
  getScanAnalysis,
  listScans,
  listScanVideos,
  runScoutWorkerOnce,
  type ScanAnalysis,
  type ScanSummary,
  type ScanVideoSummary,
} from "../features/scans/api";
import { getSystemStatus } from "../features/system/api";
import { ApiError } from "../lib/api";
import "./app.css";

const keywordExpansions = [
  "mini drama ia",
  "ai mini drama shorts",
  "revenge mini drama",
  "millionaire short drama",
  "faceless ai story",
  "ai music channel",
  "short drama francais",
  "tiktok drama story",
  "vertical series ai",
  "viral story shorts",
];

const verifiedSnapshot: ScanVideoSummary[] = [
  {
    rank: 1,
    video_id: "L48-pHflCnk",
    title: "I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!",
    channel_id: "UCq0ZFvhu1GQvL4r8pM3sGPw",
    channel_title: "AI Money Maniac",
    view_count: 19863,
    like_count: 864,
    comment_count: 122,
    published_at: "2025-06-04T13:57:48+00:00",
    thumbnail_url: "https://i.ytimg.com/vi/L48-pHflCnk/maxresdefault.jpg",
  },
  {
    rank: 2,
    video_id: "ZXoLeZqhaWI",
    title: "Contratada para salvar a su hijo, no imaginó que su jefe frío era el hombre de aquella noche.#movie",
    channel_id: "UCl4LrwnA06JppY-QrDdau9Q",
    channel_title: "Mini drama de IA",
    view_count: 67960,
    like_count: 1049,
    comment_count: 45,
    published_at: "2026-07-02T13:00:31+00:00",
    thumbnail_url: "https://i.ytimg.com/vi/ZXoLeZqhaWI/maxresdefault.jpg",
  },
  {
    rank: 3,
    video_id: "EZoU1JYB-n4",
    title: "D’un doigt, elle arrête la voiture d’un PDG et lui sauve la vie… il tombe amoureux aussitôt !",
    channel_id: "UCRqytkr0NuLHICmSYgTdUig",
    channel_title: "L-Mini Drama",
    view_count: 27274,
    like_count: 794,
    comment_count: 35,
    published_at: "2026-06-28T16:00:02+00:00",
    thumbnail_url: "https://i.ytimg.com/vi/EZoU1JYB-n4/maxresdefault.jpg",
  },
  {
    rank: 4,
    video_id: "2_pGuvUbNUc",
    title: "Mon Visage Volé par l'IA : Ma Revanche en Direct | Mini-Drama Chinois#MiniDrama #DramaChinois",
    channel_id: "UCoNPfrVOyc7iGWd59MUH60Q",
    channel_title: "Dramas IA",
    view_count: 6,
    like_count: 0,
    comment_count: 0,
    published_at: "2026-07-07T11:20:00+00:00",
    thumbnail_url: "https://i.ytimg.com/vi/2_pGuvUbNUc/maxresdefault.jpg",
  },
  {
    rank: 5,
    video_id: "QGUS4TPNn3c",
    title: "Bloquée à la banque pendant son retrait,l ne sait pas qu’elle est reine de la mafia,un pied le calme",
    channel_id: "UCxWIptdxU6_T9hV1f15O30g",
    channel_title: "MiniDrama FR",
    view_count: 133347,
    like_count: 1657,
    comment_count: 73,
    published_at: "2026-07-01T18:30:02+00:00",
    thumbnail_url: "https://i.ytimg.com/vi/QGUS4TPNn3c/maxresdefault.jpg",
  },
];

type Opportunity = {
  title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  moneyScore: number;
  attackScore: number;
  speedCashScore: number;
  qualityGapScore: number;
  weakCompetitorScore: number;
  uploadPressureScore: number;
  confidence: number;
  reason: string;
};

type LocalRun = {
  scan: ScanSummary;
  videos: ScanVideoSummary[];
  analysis: ScanAnalysis;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Une erreur inconnue est survenue.";
}

function formatMetric(value: number | null) {
  if (value === null) {
    return "n.c.";
  }

  return new Intl.NumberFormat("fr-FR", {
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildOpportunity(videos: ScanVideoSummary[], focus = "Mini-drama IA vertical court"): Opportunity {
  const totalViews = videos.reduce((total, video) => total + (video.view_count ?? 0), 0);
  const averageViews = videos.length > 0 ? totalViews / videos.length : 0;
  const channelCount = new Set(videos.map((video) => video.channel_id)).size;
  const lowViewVideos = videos.filter((video) => (video.view_count ?? 0) < 30_000).length;
  const highViewVideos = videos.filter((video) => (video.view_count ?? 0) >= 50_000).length;

  const moneyScore = clampScore(48 + Math.log10(Math.max(totalViews, 1)) * 10);
  const attackScore = clampScore(45 + lowViewVideos * 9 + channelCount * 3);
  const speedCashScore = clampScore(42 + highViewVideos * 13 + videos.length * 2);
  const qualityGapScore = clampScore(35 + lowViewVideos * 14);
  const weakCompetitorScore = clampScore(30 + lowViewVideos * 12 + (channelCount >= 4 ? 10 : 0));
  const uploadPressureScore = clampScore(55 + videos.length * 5 - lowViewVideos * 3);
  const confidence = clampScore(35 + videos.length * 8 + channelCount * 4);

  return {
    title: focus,
    verdict: moneyScore >= 70 && attackScore >= 65 ? "GO" : "WATCH",
    moneyScore,
    attackScore,
    speedCashScore,
    qualityGapScore,
    weakCompetitorScore,
    uploadPressureScore,
    confidence,
    reason: `${formatMetric(Math.round(averageViews))} vues moyennes sur ${videos.length} vidéos, ${channelCount} chaînes observées, plusieurs concurrents à faible volume.`,
  };
}

function makeSyntheticVideo(keyword: string, index: number, seed: ScanVideoSummary): ScanVideoSummary {
  return {
    ...seed,
    rank: index + 1,
    video_id: `${seed.video_id}-${keyword}-${index}`,
    title: `${keyword} — variation ${index + 1}`,
    channel_id: `${seed.channel_id}-${index}`,
    channel_title: `${seed.channel_title} ${index + 1}`,
    view_count: Math.max(1_000, Math.round((seed.view_count ?? 25_000) * (1 + index * 0.18))),
    like_count: Math.max(0, Math.round((seed.like_count ?? 300) * (1 + index * 0.12))),
    comment_count: Math.max(0, Math.round((seed.comment_count ?? 20) * (1 + index * 0.1))),
    published_at: seed.published_at,
    thumbnail_url: seed.thumbnail_url,
  };
}

function buildLocalRun(keyword: string, count: number): LocalRun {
  const base = verifiedSnapshot.slice(0, Math.max(3, Math.min(count, verifiedSnapshot.length)));
  const videos = base.map((video, index) => makeSyntheticVideo(keyword, index, video));
  const opportunity = buildOpportunity(videos, `${keyword} · opportunité locale`);
  const analysis: ScanAnalysis = {
    model_version: "frontend-offline-v0",
    opportunity_title: opportunity.title,
    verdict: opportunity.verdict,
    scores: {
      money_score: opportunity.moneyScore,
      attack_score: opportunity.attackScore,
      speed_cash_score: opportunity.speedCashScore,
      quality_gap_score: opportunity.qualityGapScore,
      weak_competitor_score: opportunity.weakCompetitorScore,
      upload_pressure_score: opportunity.uploadPressureScore,
      ecosystem_score: clampScore((opportunity.moneyScore + opportunity.attackScore + opportunity.qualityGapScore) / 3),
      confidence: opportunity.confidence,
    },
    summary: opportunity.reason,
    evidence_video_ids: videos.slice(0, 3).map((video) => video.video_id),
    competitor_channels: Array.from(
      new Set(videos.map((video) => video.channel_title || video.channel_id)),
    ).slice(0, 5),
  };

  const scan: ScanSummary = {
    id:
      globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `local-scan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    platform: "youtube",
    keyword,
    status: "completed",
    error_code: null,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { scan, videos, analysis };
}

function opportunityFromAnalysis(analysis: ScanAnalysis): Opportunity {
  return {
    title: analysis.opportunity_title,
    verdict: analysis.verdict,
    moneyScore: analysis.scores.money_score,
    attackScore: analysis.scores.attack_score,
    speedCashScore: analysis.scores.speed_cash_score,
    qualityGapScore: analysis.scores.quality_gap_score,
    weakCompetitorScore: analysis.scores.weak_competitor_score,
    uploadPressureScore: analysis.scores.upload_pressure_score,
    confidence: analysis.scores.confidence,
    reason: analysis.summary,
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-bar">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <meter max={100} min={0} value={value} />
    </div>
  );
}

function VideoResult({ video }: { video: ScanVideoSummary }) {
  return (
    <a
      className="video-result"
      href={`https://www.youtube.com/watch?v=${video.video_id}`}
      rel="noreferrer"
      target="_blank"
    >
      {video.thumbnail_url ? (
        <img alt="" src={video.thumbnail_url} />
      ) : (
        <span className="video-result__placeholder" />
      )}
      <span className="video-result__body">
        <span className="video-result__rank">#{video.rank}</span>
        <span className="video-result__title">{video.title}</span>
        <span className="video-result__meta">
          {video.channel_title || video.channel_id} · {formatMetric(video.view_count)} vues ·{" "}
          {formatDate(video.published_at)}
        </span>
      </span>
    </a>
  );
}

function ScanStatusBadge({ status }: { status: ScanSummary["status"] }) {
  const labelByStatus: Record<ScanSummary["status"], string> = {
    queued: "QUEUED",
    running: "WORKING...",
    cancel_requested: "STOPPING",
    cancelled: "CANCELLED",
    completed: "COMPLETED",
    failed: "FAILED",
  };

  return <span className={`status status--${status}`}>{labelByStatus[status]}</span>;
}

function ScoutConsole({
  scans,
  videosByScan,
  backendOnline,
  localModeActive,
  onLocalScan,
}: {
  scans: ScanSummary[];
  videosByScan: Map<string, ScanVideoSummary[]>;
  backendOnline: boolean;
  localModeActive: boolean;
  onLocalScan: (payload: { count: number; keyword: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("mini drama ia");

  const scanMutation = useMutation({
    mutationFn: async ({ count, keyword }: { count: number; keyword: string }) => {
      const baseKeyword = keyword.trim().replace(/\s+/g, " ");
      const keywords =
        count === 1
          ? [baseKeyword]
          : keywordExpansions.slice(0, count).map((seed) => `${baseKeyword} ${seed}`);

      const scans = [];

      for (const scanKeyword of keywords) {
        scans.push(await createScan(scanKeyword));
      }

      const workerRuns = [];

      for (let index = 0; index < keywords.length; index += 1) {
        workerRuns.push(await runScoutWorkerOnce());
      }

      return { scans, workerRuns };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scout-scans"] });
      await queryClient.invalidateQueries({ queryKey: ["scan-videos"] });
      await queryClient.invalidateQueries({ queryKey: ["scan-analysis"] });
    },
  });

  function launchScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (keyword.trim().length < 2 || scanMutation.isPending) {
      return;
    }

    if (!backendOnline || localModeActive) {
      onLocalScan({ count: 1, keyword });
      return;
    }

    scanMutation.mutate({ count: 1, keyword });
  }

  function launchBatch(count: number) {
    if (keyword.trim().length < 2 || scanMutation.isPending) {
      return;
    }

    if (!backendOnline || localModeActive) {
      onLocalScan({ count, keyword });
      return;
    }

    scanMutation.mutate({ count, keyword });
  }

  const completedScans = scans.filter((scan) => scan.status === "completed").length;
  const runningScans = scans.filter((scan) => scan.status === "running" || scan.status === "queued").length;
  const failedScans = scans.filter((scan) => scan.status === "failed").length;

  return (
    <section className="cockpit-panel" id="scout">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agent Scout</p>
          <h2>Radar opportunités</h2>
        </div>
        <ScanStatusBadge status={scanMutation.isPending ? "running" : "completed"} />
      </div>

      <div className="control-grid">
        <form className="command-panel" onSubmit={launchScan}>
          <label>
            <span>Niche / mot-clé de départ</span>
            <input
              maxLength={120}
              minLength={2}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="mini drama ia, AI music, shorts business..."
              type="text"
              value={keyword}
            />
          </label>

          <div className="command-actions">
            <button disabled={scanMutation.isPending} type="submit">
              {scanMutation.isPending ? "WORKING..." : "START SCAN"}
            </button>
            <button
              disabled={scanMutation.isPending}
              onClick={() => launchBatch(10)}
              type="button"
            >
              SCAN 10
            </button>
            <button
              disabled={scanMutation.isPending}
              onClick={() => launchBatch(50)}
              type="button"
            >
              SCAN 50
            </button>
            <button disabled type="button">
              STOP
            </button>
          </div>

          {scanMutation.isError ? (
            <p className="panel-error">{getErrorMessage(scanMutation.error)}</p>
          ) : null}
        </form>

        <div className="runtime-card">
          <span>Runs</span>
          <strong>{scans.length}</strong>
          <small>{completedScans} terminés · {runningScans} en file · {failedScans} échecs</small>
        </div>
        <div className="runtime-card">
          <span>Quota estimé</span>
          <strong>{backendOnline ? "100u+" : "0u"}</strong>
          <small>{backendOnline ? "estimation minimale par recherche YouTube" : "mode local sans coût API"}</small>
        </div>
        <div className="runtime-card">
          <span>Source</span>
          <strong>{backendOnline ? "Supabase" : "Local"}</strong>
          <small>pas de `localStorage` métier</small>
        </div>
      </div>

      <div className="scan-board">
        {scans.map((scan) => {
          const videos = videosByScan.get(scan.id) ?? [];

          return (
            <article className="scan-card" key={scan.id}>
              <div className="scan-card__header">
                <div>
                  <p className="eyebrow">YouTube</p>
                  <h3>{scan.keyword}</h3>
                </div>
                <ScanStatusBadge status={scan.status} />
              </div>
              <p className="scan-card__meta">
                {formatDate(scan.created_at)} · {videos.length} vidéos collectées
              </p>
              {scan.error_message ? <p className="scan-card__error">{scan.error_message}</p> : null}
              {videos.length > 0 ? (
                <div className="video-results">
                  {videos.slice(0, 5).map((video) => (
                    <VideoResult key={video.video_id} video={video} />
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AnalystConsole({
  analysis,
  videos,
  backendOnline,
}: {
  analysis: ScanAnalysis | undefined;
  videos: ScanVideoSummary[];
  backendOnline: boolean;
}) {
  const fallbackOpportunity = useMemo(() => buildOpportunity(videos), [videos]);
  const opportunity = analysis ? opportunityFromAnalysis(analysis) : fallbackOpportunity;
  const topChannels = analysis?.competitor_channels.length
    ? analysis.competitor_channels.slice(0, 5)
    : Array.from(new Set(videos.map((video) => video.channel_title || video.channel_id))).slice(0, 5);
  const weakVideos = videos.filter((video) => (video.view_count ?? 0) < 30_000);

  return (
    <section className="cockpit-panel" id="analyst">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agent Analyste</p>
          <h2>Scoring business</h2>
        </div>
        <span className={`verdict verdict--${opportunity.verdict.toLowerCase()}`}>
          {opportunity.verdict}
        </span>
      </div>

      <div className="opportunity-layout">
        <article className="opportunity-card">
          <p className="eyebrow">Opportunité détectée</p>
          <h3>{opportunity.title}</h3>
          <p>{opportunity.reason}</p>
          <small className="model-version">
            {analysis ? analysis.model_version : backendOnline ? "frontend-preview-v0" : "frontend-offline-v0"}
          </small>
          <div className="score-grid">
            <ScoreBar label="money_score" value={opportunity.moneyScore} />
            <ScoreBar label="attack_score" value={opportunity.attackScore} />
            <ScoreBar label="speed_cash_score" value={opportunity.speedCashScore} />
            <ScoreBar label="quality_gap_score" value={opportunity.qualityGapScore} />
            <ScoreBar label="weak_competitor_score" value={opportunity.weakCompetitorScore} />
            <ScoreBar label="upload_pressure_score" value={opportunity.uploadPressureScore} />
          </div>
        </article>

        <aside className="signal-stack">
          <div>
            <span>Confiance</span>
            <strong>{opportunity.confidence}/100</strong>
          </div>
          <div>
            <span>Concurrents observés</span>
            <strong>{topChannels.length}</strong>
            <small>{topChannels.join(" · ") || "aucune chaîne"}</small>
          </div>
          <div>
            <span>Quality gaps</span>
            <strong>{weakVideos.length}</strong>
            <small>vidéos à faible volume ou exécution améliorable</small>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProducerConsole({
  analysis,
  videos,
}: {
  analysis: ScanAnalysis | undefined;
  videos: ScanVideoSummary[];
}) {
  const fallbackOpportunity = useMemo(() => buildOpportunity(videos), [videos]);
  const opportunity = analysis ? opportunityFromAnalysis(analysis) : fallbackOpportunity;

  return (
    <section className="cockpit-panel" id="producer">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agent Producteur</p>
          <h2>Plan d’attaque</h2>
        </div>
        <span className="phase">futur contrôlé</span>
      </div>

      <div className="execution-plan">
        <article>
          <span>Angle</span>
          <strong>Série verticale IA sur tension dramatique courte</strong>
          <p>Reprendre le format mini-drama, mais attaquer par hooks plus nets et rythme plus dense.</p>
        </article>
        <article>
          <span>Premier test</span>
          <strong>5 épisodes courts en 7 jours</strong>
          <p>Tester 3 hooks émotionnels, 2 niches narratives et comparer rétention / commentaires.</p>
        </article>
        <article>
          <span>Critère GO</span>
          <strong>{opportunity.moneyScore >= 70 ? "prioritaire" : "à surveiller"}</strong>
          <p>Passer en production si un épisode dépasse le benchmark de vues initial en 48h.</p>
        </article>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Aperçu vérifié</p>
      <h2>Dernière collecte visible</h2>
      <p>
        Le cockpit affiche la dernière collecte vérifiée pour garder une visualisation concrète
        même quand le backend n’est pas joignable.
      </p>
    </div>
  );
}

export function App() {
  const [localRuns, setLocalRuns] = useState<LocalRun[]>([]);

  const statusQuery = useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    retry: false,
    refetchInterval: 30_000,
  });

  const scansQuery = useQuery({
    queryKey: ["scout-scans"],
    queryFn: listScans,
    retry: false,
    refetchInterval: 30_000,
  });

  const backendOnline = statusQuery.isSuccess;
  const backendStatusLabel = statusQuery.isPending
    ? "API : vérification..."
    : statusQuery.isError
      ? "API indisponible · mode local"
      : `API réelle · ${statusQuery.data.environment}`;
  const backendStatusClass = statusQuery.isPending
    ? "status status--pending"
    : statusQuery.isError
      ? "status status--error"
      : "status status--success";

  const scans = [...localRuns.map((run) => run.scan), ...(scansQuery.data?.scans ?? [])];
  const backendCompletedScans = (scansQuery.data?.scans ?? []).filter((scan) => scan.status === "completed");

  const videoQueries = useQueries({
    queries: backendCompletedScans.map((scan) => ({
      queryKey: ["scan-videos", scan.id],
      queryFn: () => listScanVideos(scan.id),
      retry: false,
    })),
  });

  const videosByScan = new Map<string, ScanVideoSummary[]>();
  backendCompletedScans.forEach((scan, index) => {
    videosByScan.set(scan.id, videoQueries[index]?.data?.videos ?? []);
  });

  localRuns.forEach((run) => {
    videosByScan.set(run.scan.id, run.videos);
  });

  const connectedVideos = Array.from(videosByScan.values()).flat();
  const visibleVideos = connectedVideos.length > 0 ? connectedVideos : verifiedSnapshot;
  const primaryCompletedScan = backendCompletedScans[0] ?? localRuns[0]?.scan;
  const analysisQuery = useQuery({
    queryKey: ["scan-analysis", primaryCompletedScan?.id],
    queryFn: () => getScanAnalysis(primaryCompletedScan?.id ?? ""),
    enabled: Boolean(primaryCompletedScan),
    retry: false,
  });

  const visibleAnalysis = localRuns[0]?.analysis ?? analysisQuery.data;

  function runLocalScan({ count, keyword }: { count: number; keyword: string }) {
    const batchSize = count === 1 ? 5 : Math.max(5, Math.min(count, 12));
    const run = buildLocalRun(keyword.trim().replace(/\s+/g, " "), batchSize);

    setLocalRuns((current) => [run, ...current].slice(0, 8));
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">IA Agent Tool / Agent Scout</p>
          <h1>GO MONEY MODE</h1>
          <p className="subtitle">
            Cockpit interne pour scanner des niches, détecter des concurrents faibles,
            scorer les opportunités et préparer l’exécution.
          </p>
        </div>
        <span className={backendStatusClass}>{backendStatusLabel}</span>
      </header>

      <section className="mission-strip" aria-label="Pipeline cible">
        <span>Scout : radar</span>
        <span>Analyste : scoring</span>
        <span>Producteur : plan d’action</span>
      </section>

      {scansQuery.isError ? (
        <div className="panel-error panel-error--wide">
          {getErrorMessage(scansQuery.error)} Le cockpit garde le mode local et l’aperçu vérifié.
        </div>
      ) : null}

      {visibleVideos === verifiedSnapshot && <EmptyState />}

      <div className="dashboard-summary">
        <article>
          <span>Scans visibles</span>
          <strong>{scans.length}</strong>
          <small>{localRuns.length > 0 ? "dont exécutions locales" : "connecté au backend si disponible"}</small>
        </article>
        <article>
          <span>Vidéo de tête</span>
          <strong>{visibleVideos[0]?.channel_title ?? "aucune donnée"}</strong>
          <small>{visibleVideos[0]?.title ?? "lance un scan pour remplir le cockpit"}</small>
        </article>
        <article>
          <span>Verdict</span>
          <strong>{visibleAnalysis?.verdict ?? "WATCH"}</strong>
          <small>{visibleAnalysis?.summary ?? "analyse locale en attente"}</small>
        </article>
      </div>

      <ScoutConsole
        backendOnline={backendOnline}
        localModeActive={statusQuery.isError}
        onLocalScan={runLocalScan}
        scans={scans}
        videosByScan={videosByScan}
      />
      <AnalystConsole analysis={visibleAnalysis} backendOnline={backendOnline} videos={visibleVideos} />
      <ProducerConsole analysis={visibleAnalysis} videos={visibleVideos} />
    </main>
  );
}
