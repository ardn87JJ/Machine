import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import {
  createScan,
  createEdgeExperiment,
  listEdgeExperiments,
  getScanAnalysis,
  listEdgeScoutLedger,
  listScans,
  listOpportunities,
  listScanVideos,
  runEdgeScout,
  runScoutWorkerOnce,
  type ExecutionPlan,
  type ExecutionExperimentSummary,
  type OpportunitySummary,
  type RunEdgeScoutResponse,
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
  "ai horror stories",
  "reddit story shorts",
  "sleep stories ai",
  "animated bible stories",
  "kids bedtime stories ai",
  "ai motivation shorts",
  "stoic wisdom shorts",
  "faceless finance shorts",
  "side hustle shorts",
  "luxury lifestyle shorts",
  "ai history documentary",
  "true crime ai narration",
  "celebrity news shorts",
  "football edits shorts",
  "nba story shorts",
  "fitness transformation shorts",
  "weight loss faceless",
  "healthy recipes shorts",
  "keto meal prep shorts",
  "ai cooking channel",
  "pet facts shorts",
  "space facts shorts",
  "psychology facts shorts",
  "relationship advice shorts",
  "language learning shorts",
  "english vocabulary shorts",
  "ai travel guide",
  "city walking shorts",
  "satisfying ai animation",
  "asmr generated videos",
  "lofi ai music",
  "meditation music ai",
  "kids songs ai",
  "country ai music",
  "latin ai music",
  "afrobeats ai music",
  "ai product reviews",
  "amazon finds shorts",
  "tech tips shorts",
  "notion productivity shorts",
  "excel tutorial shorts",
  "chatgpt automation shorts",
  "ai tools news",
  "cybersecurity shorts",
  "real estate investing shorts",
  "crypto explainers shorts",
  "stock market shorts",
  "car facts shorts",
  "movie recap shorts",
  "anime recap shorts",
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
  executionPlan?: ExecutionPlan;
  source: "local" | "edge";
};

type OpportunityRecord = Opportunity & {
  scanId: string;
  keyword: string;
  modelVersion: string;
  source: "backend" | "local";
  videos: ScanVideoSummary[];
  executionPlan: ExecutionPlan;
  priorityScore: number;
  decisionLabel: "ATTAQUER" | "TESTER" | "VEILLE";
  priorityReasons: string[];
};

type DecisionLabel = OpportunityRecord["decisionLabel"];
type DecisionFilter = DecisionLabel | "ALL";

type CompetitorRow = {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  averageViews: number;
  totalViews: number;
  weakSignals: number;
  bestVideo: ScanVideoSummary;
  attackTag: "CIBLE FAIBLE" | "BENCHMARK" | "À OBSERVER";
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

function buildScoutKeywords(keyword: string, count: number) {
  const baseKeyword = keyword.trim().replace(/\s+/g, " ");

  if (count === 1) {
    return [baseKeyword];
  }

  const seen = new Set<string>();

  return [baseKeyword, ...keywordExpansions]
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => {
      const key = item.toLowerCase();

      if (item.length < 2 || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, count);
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

function buildPriority(opportunity: Opportunity) {
  const priorityScore = clampScore(
    opportunity.moneyScore * 0.28 +
      opportunity.attackScore * 0.22 +
      opportunity.speedCashScore * 0.16 +
      opportunity.qualityGapScore * 0.14 +
      opportunity.weakCompetitorScore * 0.1 +
      opportunity.confidence * 0.1,
  );
  const priorityReasons = [
    opportunity.moneyScore >= 80 ? "money fort" : null,
    opportunity.attackScore >= 75 ? "attaque facile" : null,
    opportunity.speedCashScore >= 70 ? "cash rapide" : null,
    opportunity.qualityGapScore >= 70 ? "gap qualité" : null,
    opportunity.weakCompetitorScore >= 70 ? "concurrents faibles" : null,
    opportunity.confidence >= 80 ? "signal fiable" : null,
  ].filter((reason): reason is string => Boolean(reason));
  const decisionLabel: DecisionLabel =
    opportunity.verdict === "GO" && priorityScore >= 78
      ? "ATTAQUER"
      : opportunity.verdict !== "SKIP" && priorityScore >= 62
        ? "TESTER"
        : "VEILLE";

  return {
    priorityScore,
    decisionLabel,
    priorityReasons:
      priorityReasons.length > 0 ? priorityReasons : ["signaux encore insuffisants"],
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
  const analysis = buildAnalysisFromVideos(videos, `${keyword} · opportunité locale`, "frontend-offline-v0");

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

  return { scan, videos, analysis, source: "local" };
}

function buildEdgeRun(result: RunEdgeScoutResponse): LocalRun {
  return {
    scan: result.scan,
    videos: result.videos,
    analysis: result.analysis,
    executionPlan: result.opportunity.execution_plan,
    source: "edge",
  };
}

function buildVerifiedFallbackRun(): LocalRun {
  const scan: ScanSummary = {
    id: "ebc42fb3-318c-435e-865e-42d5bc4062a7",
    platform: "youtube",
    keyword: "mini drama ia",
    status: "completed",
    error_code: null,
    error_message: null,
    created_at: "2026-07-08T13:07:05.148635+00:00",
    updated_at: "2026-07-08T13:07:06.597509+00:00",
  };

  return {
    scan,
    videos: verifiedSnapshot,
    analysis: buildAnalysisFromVideos(
      verifiedSnapshot,
      "Mini-drama IA vertical court",
      "real-scout-snapshot-2026-07-08",
    ),
    source: "edge",
  };
}

function buildAnalysisFromVideos(
  videos: ScanVideoSummary[],
  opportunityTitle = "Mini-drama IA vertical court",
  modelVersion = "frontend-preview-v0",
): ScanAnalysis {
  const opportunity = buildOpportunity(videos, opportunityTitle);

  return {
    model_version: modelVersion,
    opportunity_title: opportunity.title,
    verdict: opportunity.verdict,
    scores: {
      money_score: opportunity.moneyScore,
      attack_score: opportunity.attackScore,
      speed_cash_score: opportunity.speedCashScore,
      quality_gap_score: opportunity.qualityGapScore,
      weak_competitor_score: opportunity.weakCompetitorScore,
      upload_pressure_score: opportunity.uploadPressureScore,
      ecosystem_score: clampScore(
        (opportunity.moneyScore + opportunity.attackScore + opportunity.qualityGapScore) / 3,
      ),
      confidence: opportunity.confidence,
    },
    summary: opportunity.reason,
    evidence_video_ids: videos.slice(0, 3).map((video) => video.video_id),
    competitor_channels: Array.from(
      new Set(videos.map((video) => video.channel_title || video.channel_id)),
    ).slice(0, 5),
  };
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

function buildOpportunityRecord({
  scan,
  videos,
  analysis,
  executionPlan,
  source,
}: {
  scan: ScanSummary;
  videos: ScanVideoSummary[];
  analysis: ScanAnalysis;
  executionPlan?: ExecutionPlan;
  source: "backend" | "local";
}): OpportunityRecord {
  const opportunity = opportunityFromAnalysis(analysis);
  const priority = buildPriority(opportunity);

  return {
    ...opportunity,
    ...priority,
    scanId: scan.id,
    keyword: scan.keyword,
    modelVersion: analysis.model_version,
    source,
    videos,
    executionPlan:
      executionPlan ?? {
        angle: "Série verticale IA sur tension dramatique courte",
        first_test: `Lancer 5 épisodes courts autour de ${scan.keyword} sur 7 jours`,
        criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
        notes: analysis.summary,
      },
  };
}

function buildOpportunityRecordFromSaved(
  opportunity: OpportunitySummary,
  videos: ScanVideoSummary[],
): OpportunityRecord {
  const source: OpportunityRecord["source"] = opportunity.source === "local" ? "local" : "backend";
  const record = {
    title: opportunity.title,
    verdict: opportunity.verdict,
    moneyScore: opportunity.scores.money_score,
    attackScore: opportunity.scores.attack_score,
    speedCashScore: opportunity.scores.speed_cash_score,
    qualityGapScore: opportunity.scores.quality_gap_score,
    weakCompetitorScore: opportunity.scores.weak_competitor_score,
    uploadPressureScore: opportunity.scores.upload_pressure_score,
    confidence: opportunity.scores.confidence,
    reason: opportunity.summary,
    scanId: opportunity.scan_id,
    keyword: opportunity.keyword,
    modelVersion: opportunity.model_version,
    source,
    videos,
    executionPlan: opportunity.execution_plan,
  };

  return {
    ...record,
    ...buildPriority(record),
  };
}

function rankOpportunities(opportunities: OpportunityRecord[]) {
  const byScanId = new Map<string, OpportunityRecord>();

  opportunities.forEach((opportunity) => {
    const existing = byScanId.get(opportunity.scanId);

    if (!existing || opportunity.videos.length >= existing.videos.length) {
      byScanId.set(opportunity.scanId, opportunity);
    }
  });

  return Array.from(byScanId.values()).sort((left, right) => {
    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }

    if (right.moneyScore !== left.moneyScore) {
      return right.moneyScore - left.moneyScore;
    }

    return right.confidence - left.confidence;
  });
}

function buildCompetitorRows(videos: ScanVideoSummary[]): CompetitorRow[] {
  const byChannel = new Map<string, ScanVideoSummary[]>();

  videos.forEach((video) => {
    const key = video.channel_id || video.channel_title || "unknown-channel";
    const current = byChannel.get(key) ?? [];

    current.push(video);
    byChannel.set(key, current);
  });

  return Array.from(byChannel.entries())
    .map(([channelId, channelVideos]) => {
      const totalViews = channelVideos.reduce((total, video) => total + (video.view_count ?? 0), 0);
      const averageViews = channelVideos.length > 0 ? totalViews / channelVideos.length : 0;
      const bestVideo = [...channelVideos].sort((left, right) => (right.view_count ?? 0) - (left.view_count ?? 0))[0];
      const weakSignals = channelVideos.filter((video) => (video.view_count ?? 0) < 30_000).length;
      const attackTag: CompetitorRow["attackTag"] =
        averageViews < 30_000 || weakSignals >= 2
          ? "CIBLE FAIBLE"
          : (bestVideo.view_count ?? 0) >= 100_000
            ? "BENCHMARK"
            : "À OBSERVER";

      return {
        channelId,
        channelTitle: bestVideo.channel_title || channelId,
        videoCount: channelVideos.length,
        averageViews,
        totalViews,
        weakSignals,
        bestVideo,
        attackTag,
      };
    })
    .sort((left, right) => {
      if (left.attackTag !== right.attackTag) {
        const order: Record<CompetitorRow["attackTag"], number> = {
          "CIBLE FAIBLE": 0,
          BENCHMARK: 1,
          "À OBSERVER": 2,
        };

        return order[left.attackTag] - order[right.attackTag];
      }

      return right.averageViews - left.averageViews;
    })
    .slice(0, 5);
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

function EvidenceVideo({ video }: { video: ScanVideoSummary }) {
  return (
    <a
      className="evidence-video"
      href={`https://www.youtube.com/watch?v=${video.video_id}`}
      rel="noreferrer"
      target="_blank"
    >
      <span>#{video.rank}</span>
      <strong>{video.title}</strong>
      <small>
        {video.channel_title || video.channel_id} · {formatMetric(video.view_count)} vues
      </small>
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

function OpportunityBadge({ verdict }: { verdict: Opportunity["verdict"] }) {
  return <span className={`verdict verdict--${verdict.toLowerCase()}`}>{verdict}</span>;
}

function OpportunityLedger({
  opportunities,
  allOpportunities,
  decisionFilter,
  selectedOpportunityId,
  onDecisionFilterChange,
  onSelectOpportunity,
}: {
  opportunities: OpportunityRecord[];
  allOpportunities: OpportunityRecord[];
  decisionFilter: DecisionFilter;
  selectedOpportunityId: string | null;
  onDecisionFilterChange: (filter: DecisionFilter) => void;
  onSelectOpportunity: (id: string) => void;
}) {
  const filterOptions: Array<{ label: string; value: DecisionFilter }> = [
    { label: "Tous", value: "ALL" },
    { label: "ATTAQUER", value: "ATTAQUER" },
    { label: "TESTER", value: "TESTER" },
    { label: "VEILLE", value: "VEILLE" },
  ];
  const countByFilter = {
    ALL: allOpportunities.length,
    ATTAQUER: allOpportunities.filter((opportunity) => opportunity.decisionLabel === "ATTAQUER").length,
    TESTER: allOpportunities.filter((opportunity) => opportunity.decisionLabel === "TESTER").length,
    VEILLE: allOpportunities.filter((opportunity) => opportunity.decisionLabel === "VEILLE").length,
  };

  return (
    <section className="cockpit-panel" aria-labelledby="ledger-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Ledger opportunités</p>
          <h2 id="ledger-title">Classement exploitable</h2>
        </div>
        <span className="phase">{opportunities.length} affichées</span>
      </div>

      <div className="ledger-filters" aria-label="Filtrer les opportunités">
        {filterOptions.map((option) => (
          <button
            className={decisionFilter === option.value ? "is-active" : ""}
            key={option.value}
            onClick={() => onDecisionFilterChange(option.value)}
            type="button"
          >
            {option.label} <span>{countByFilter[option.value]}</span>
          </button>
        ))}
      </div>

      <div className="ledger-grid">
        <div className="ledger-list">
          {opportunities.length === 0 ? (
            <p className="panel-empty">Aucune opportunité dans ce filtre.</p>
          ) : null}
          {opportunities.map((opportunity) => {
            const isSelected = selectedOpportunityId === opportunity.scanId;

            return (
              <button
                className={isSelected ? "ledger-item is-selected" : "ledger-item"}
                key={opportunity.scanId}
                onClick={() => onSelectOpportunity(opportunity.scanId)}
                type="button"
              >
                <div className="ledger-item__header">
                  <strong>{opportunity.keyword}</strong>
                  <span className="priority-badge">{opportunity.decisionLabel} · {opportunity.priorityScore}</span>
                  <OpportunityBadge verdict={opportunity.verdict} />
                </div>
                <p>{opportunity.reason}</p>
                <div className="ledger-item__meta">
                  <span>{opportunity.modelVersion}</span>
                  <span>{opportunity.videos.length} vidéos</span>
                  <span>confiance {opportunity.confidence}/100</span>
                </div>
                <div className="ledger-item__scores">
                  <span>money {opportunity.moneyScore}</span>
                  <span>attack {opportunity.attackScore}</span>
                  <span>gap {opportunity.qualityGapScore}</span>
                  <span>{opportunity.priorityReasons.slice(0, 3).join(" · ")}</span>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="execution-card">
          <p className="eyebrow">File d’exécution</p>
          <h3>{opportunities[0]?.title ?? "Aucune opportunité"}</h3>
          <p>{opportunities[0]?.reason ?? "Lance un scan pour alimenter la file."}</p>
          <div className="execution-card__rows">
            <div>
              <span>Priorité</span>
              <strong>{opportunities[0]?.decisionLabel ?? "TESTER"}</strong>
            </div>
            <div>
              <span>Score business</span>
              <strong>{opportunities[0]?.priorityScore ?? 0}/100</strong>
            </div>
            <div>
              <span>Raison</span>
              <strong>{opportunities[0]?.priorityReasons[0] ?? "signal à qualifier"}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ScoutConsole({
  scans,
  videosByScan,
  backendOnline,
  localModeActive,
  onLocalScan,
  onEdgeScan,
}: {
  scans: ScanSummary[];
  videosByScan: Map<string, ScanVideoSummary[]>;
  backendOnline: boolean;
  localModeActive: boolean;
  onLocalScan: (payload: { count: number; keyword: string }) => void;
  onEdgeScan: (run: LocalRun) => void;
}) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("mini drama ia");
  const [lastBatchSummary, setLastBatchSummary] = useState<string | null>(null);
  const realScanEnabled = backendOnline && !localModeActive;
  const edgeScanEnabled = !realScanEnabled;

  const scanMutation = useMutation({
    mutationFn: async ({
      count,
      keyword,
      mode,
    }: {
      count: number;
      keyword: string;
      mode: "backend" | "edge";
    }) => {
      const keywords = buildScoutKeywords(keyword, count);

      if (mode === "edge") {
        const runs = [];

        for (const scanKeyword of keywords) {
          runs.push(buildEdgeRun(await runEdgeScout(scanKeyword)));
        }

        return { mode, runs, keywords };
      }

      const scans = [];

      for (const scanKeyword of keywords) {
        scans.push(await createScan(scanKeyword));
      }

      const workerRuns = [];

      for (let index = 0; index < keywords.length; index += 1) {
        workerRuns.push(await runScoutWorkerOnce());
      }

      return { mode, scans, workerRuns, runs: [], keywords };
    },
    onSuccess: async (result) => {
      if (result.mode === "edge") {
        result.runs.forEach(onEdgeScan);
      }

      setLastBatchSummary(
        result.keywords.length > 1
          ? `Dernier lot: ${result.keywords.length} niches scannées · ${result.keywords.slice(0, 4).join(" · ")}`
          : `Dernier scan: ${result.keywords[0]}`,
      );

      await queryClient.invalidateQueries({ queryKey: ["scout-scans"] });
      await queryClient.invalidateQueries({ queryKey: ["scan-videos"] });
      await queryClient.invalidateQueries({ queryKey: ["scan-analysis"] });
      await queryClient.invalidateQueries({ queryKey: ["scout-opportunities"] });
      await queryClient.invalidateQueries({ queryKey: ["edge-scout-ledger"] });
    },
  });

  function launchScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (keyword.trim().length < 2 || scanMutation.isPending) {
      return;
    }

    if (!realScanEnabled && !edgeScanEnabled) {
      onLocalScan({ count: 1, keyword });
      return;
    }

    scanMutation.mutate({ count: 1, keyword, mode: realScanEnabled ? "backend" : "edge" });
  }

  function launchBatch(count: number) {
    if (keyword.trim().length < 2 || scanMutation.isPending) {
      return;
    }

    if (!realScanEnabled && !edgeScanEnabled) {
      onLocalScan({ count, keyword });
      return;
    }

    scanMutation.mutate({ count, keyword, mode: realScanEnabled ? "backend" : "edge" });
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
          <p className="panel-substatus">
            {realScanEnabled
              ? "Mode réel: création du scan, worker YouTube, stockage Supabase, analyse."
              : "Mode Edge Supabase: scan YouTube réel depuis une fonction serverless."}
          </p>
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
              {scanMutation.isPending ? "WORKING..." : realScanEnabled ? "START REAL SCAN" : "RUN EDGE SCOUT"}
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
          {lastBatchSummary ? <p className="panel-substatus">{lastBatchSummary}</p> : null}
        </form>

        <div className="runtime-card">
          <span>Runs</span>
          <strong>{scans.length}</strong>
          <small>{completedScans} terminés · {runningScans} en file · {failedScans} échecs</small>
        </div>
        <div className="runtime-card">
          <span>Quota estimé</span>
          <strong>{realScanEnabled || edgeScanEnabled ? "102u/scan" : "0u"}</strong>
          <small>{realScanEnabled || edgeScanEnabled ? "search + videos + channels YouTube" : "mode local sans coût API"}</small>
        </div>
        <div className="runtime-card">
          <span>Source</span>
          <strong>{realScanEnabled ? "FastAPI" : edgeScanEnabled ? "Supabase Edge" : "Local"}</strong>
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
  opportunity,
  backendOnline,
}: {
  opportunity: OpportunityRecord | undefined;
  backendOnline: boolean;
}) {
  const competitorRows = buildCompetitorRows(opportunity?.videos ?? []);
  const topChannels = Array.from(
    new Set(opportunity?.videos.map((video) => video.channel_title || video.channel_id) ?? []),
  ).slice(0, 5);
  const weakVideos = opportunity?.videos.filter((video) => (video.view_count ?? 0) < 30_000) ?? [];

  return (
    <section className="cockpit-panel" id="analyst">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agent Analyste</p>
          <h2>Scoring business</h2>
        </div>
        <OpportunityBadge verdict={opportunity?.verdict ?? "WATCH"} />
      </div>

      <div className="opportunity-layout">
        <article className="opportunity-card">
          <p className="eyebrow">Opportunité détectée</p>
          <h3>{opportunity?.title ?? "Mini-drama IA vertical court"}</h3>
          <p>{opportunity?.reason ?? "Lance un scan pour faire émerger une opportunité exploitable."}</p>
          <small className="model-version">
            {opportunity?.modelVersion ?? (backendOnline ? "frontend-preview-v0" : "frontend-offline-v0")}
          </small>
          <div className="score-grid">
            <ScoreBar label="money_score" value={opportunity?.moneyScore ?? 0} />
            <ScoreBar label="attack_score" value={opportunity?.attackScore ?? 0} />
            <ScoreBar label="speed_cash_score" value={opportunity?.speedCashScore ?? 0} />
            <ScoreBar label="quality_gap_score" value={opportunity?.qualityGapScore ?? 0} />
            <ScoreBar label="weak_competitor_score" value={opportunity?.weakCompetitorScore ?? 0} />
            <ScoreBar label="upload_pressure_score" value={opportunity?.uploadPressureScore ?? 0} />
          </div>
        </article>

        <aside className="signal-stack">
          <div>
            <span>Confiance</span>
            <strong>{opportunity?.confidence ?? 0}/100</strong>
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

      <div className="competitor-intel" aria-label="Intel concurrents">
        <div className="intel-heading">
          <div>
            <p className="eyebrow">Intel concurrents</p>
            <h3>Qui attaquer / copier</h3>
          </div>
          <span>{competitorRows.length} chaînes</span>
        </div>

        {competitorRows.length === 0 ? (
          <p className="panel-empty">Aucune chaîne concurrente disponible.</p>
        ) : (
          <div className="competitor-list">
            {competitorRows.map((competitor) => (
              <article className="competitor-row" key={competitor.channelId}>
                <div>
                  <span className={`competitor-tag competitor-tag--${competitor.attackTag.toLowerCase().replace(/\s+/g, "-")}`}>
                    {competitor.attackTag}
                  </span>
                  <strong>{competitor.channelTitle}</strong>
                  <small>{competitor.bestVideo.title}</small>
                </div>
                <dl>
                  <div>
                    <dt>Vues moy.</dt>
                    <dd>{formatMetric(Math.round(competitor.averageViews))}</dd>
                  </div>
                  <div>
                    <dt>Vidéos</dt>
                    <dd>{competitor.videoCount}</dd>
                  </div>
                  <div>
                    <dt>Faiblesses</dt>
                    <dd>{competitor.weakSignals}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProducerConsole({
  opportunity,
}: {
  opportunity: OpportunityRecord | undefined;
}) {
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
          <strong>{opportunity?.executionPlan.angle ?? "Série verticale IA sur tension dramatique courte"}</strong>
          <p>{opportunity?.executionPlan.notes ?? "Reprendre le format mini-drama, mais attaquer par hooks plus nets et rythme plus dense."}</p>
        </article>
        <article>
          <span>Premier test</span>
          <strong>{opportunity?.executionPlan.first_test ?? "5 épisodes courts en 7 jours"}</strong>
          <p>Tester 3 hooks émotionnels, 2 niches narratives et comparer rétention / commentaires.</p>
        </article>
        <article>
          <span>Critère GO</span>
          <strong>{(opportunity?.moneyScore ?? 0) >= 70 ? "prioritaire" : "à surveiller"}</strong>
          <p>{opportunity?.executionPlan.criteria_go ?? "Passer en production si un épisode dépasse le benchmark de vues initial en 48h."}</p>
        </article>
      </div>
    </section>
  );
}

function ExecutionBrief({
  opportunity,
  activeExperiment,
  isCreatingExperiment,
  onCreateExperiment,
}: {
  opportunity: OpportunityRecord | undefined;
  activeExperiment: ExecutionExperimentSummary | undefined;
  isCreatingExperiment: boolean;
  onCreateExperiment: (opportunity: OpportunityRecord) => void;
}) {
  const evidenceVideos = opportunity?.videos.slice(0, 3) ?? [];
  const decisionText = opportunity
    ? `Décision ${opportunity.decisionLabel} · score ${opportunity.priorityScore}/100`
    : "Décision en attente · lance un scan";
  const canCreateExperiment = Boolean(opportunity) && !activeExperiment && !isCreatingExperiment;

  return (
    <section className="cockpit-panel action-brief" aria-labelledby="action-brief-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Fiche action</p>
          <h2 id="action-brief-title">{opportunity?.keyword ?? "Aucune niche sélectionnée"}</h2>
          <p className="panel-substatus">{opportunity?.title ?? "Sélectionne une opportunité dans le ledger."}</p>
        </div>
        <span className="priority-badge">{decisionText}</span>
      </div>

      <div className="brief-command">
        <span>Prochaine action</span>
        <strong>{opportunity?.executionPlan.first_test ?? "Lancer un scan Scout puis choisir une opportunité."}</strong>
        <div className="brief-actions">
          <button
            disabled={!canCreateExperiment}
            onClick={() => {
              if (opportunity) {
                onCreateExperiment(opportunity);
              }
            }}
            type="button"
          >
            {activeExperiment ? "Test créé" : isCreatingExperiment ? "CREATION..." : "Créer test"}
          </button>
          {activeExperiment ? <small>Statut {activeExperiment.status} dans la file d’exécution.</small> : null}
        </div>
      </div>

      <div className="brief-grid">
        <div>
          <span>Pourquoi</span>
          <strong>{opportunity?.priorityReasons.slice(0, 3).join(" · ") ?? "signal à qualifier"}</strong>
          <small>{opportunity?.reason ?? "Les raisons seront générées après collecte YouTube."}</small>
        </div>
        <div>
          <span>Critère de validation</span>
          <strong>{opportunity?.executionPlan.criteria_go ?? "Attendre un benchmark exploitable."}</strong>
          <small>Si le critère est atteint, passer en production courte.</small>
        </div>
      </div>

      <div className="brief-scores" aria-label="Scores décisionnels">
        <span>money {opportunity?.moneyScore ?? 0}</span>
        <span>attack {opportunity?.attackScore ?? 0}</span>
        <span>speed {opportunity?.speedCashScore ?? 0}</span>
        <span>gap {opportunity?.qualityGapScore ?? 0}</span>
      </div>

      <div className="brief-evidence">
        <span>Preuves vidéo</span>
        {evidenceVideos.length > 0 ? (
          evidenceVideos.map((video) => <EvidenceVideo key={video.video_id} video={video} />)
        ) : (
          <p className="panel-empty">Aucune vidéo preuve disponible.</p>
        )}
      </div>
    </section>
  );
}

function ExperimentQueue({
  experiments,
  isLoading,
  error,
}: {
  experiments: ExecutionExperimentSummary[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <section className="cockpit-panel experiment-queue" aria-labelledby="experiment-queue-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Décision humaine</p>
          <h2 id="experiment-queue-title">File de tests</h2>
          <p className="panel-substatus">Opportunités transformées en expériences à exécuter.</p>
        </div>
        <span className="phase">{experiments.length} tests</span>
      </div>

      {error ? <p className="panel-error">{getErrorMessage(error)}</p> : null}
      {isLoading ? <p className="panel-substatus">Chargement des tests...</p> : null}

      <div className="experiment-list">
        {experiments.length === 0 && !isLoading ? (
          <p className="panel-empty">Aucun test créé. Sélectionne une opportunité puis clique sur Créer test.</p>
        ) : null}
        {experiments.slice(0, 5).map((experiment) => (
          <article className="experiment-card" key={experiment.id}>
            <div>
              <span className="experiment-status">{experiment.status}</span>
              <strong>{experiment.keyword}</strong>
              <small>{experiment.title}</small>
            </div>
            <p>{experiment.next_action}</p>
            <div className="experiment-meta">
              <span>{experiment.decision_label}</span>
              <span>score {experiment.priority_score}</span>
              <span>{formatDate(experiment.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Scan réel vérifié</p>
      <h2>Dernière collecte YouTube</h2>
      <p>
        L’API YouTube est configurée et un scan réel a été exécuté. Si le backend n’est pas
        joignable depuis cette page, le cockpit affiche ce snapshot vérifié.
      </p>
    </div>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const [localRuns, setLocalRuns] = useState<LocalRun[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("ALL");
  const verifiedFallbackRun = buildVerifiedFallbackRun();

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

  const opportunitiesQuery = useQuery({
    queryKey: ["scout-opportunities"],
    queryFn: listOpportunities,
    retry: false,
    refetchInterval: 30_000,
  });

  const edgeLedgerQuery = useQuery({
    queryKey: ["edge-scout-ledger"],
    queryFn: listEdgeScoutLedger,
    enabled: statusQuery.isError,
    retry: false,
    refetchInterval: 30_000,
  });

  const edgeExperimentsQuery = useQuery({
    queryKey: ["edge-experiments"],
    queryFn: listEdgeExperiments,
    enabled: statusQuery.isError,
    retry: false,
    refetchInterval: 30_000,
  });

  const createExperimentMutation = useMutation({
    mutationFn: (opportunity: OpportunityRecord) =>
      createEdgeExperiment({
        scan_id: opportunity.scanId,
        decision_label: opportunity.decisionLabel,
        priority_score: opportunity.priorityScore,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["edge-experiments"] });
    },
  });

  const backendOnline = statusQuery.isSuccess;
  const backendStatusLabel = statusQuery.isPending
    ? "API : vérification..."
    : statusQuery.isError
      ? "Edge Supabase · scan public"
      : `API réelle · ${statusQuery.data.environment}`;
  const backendStatusClass = statusQuery.isPending
    ? "status status--pending"
    : statusQuery.isError
      ? "status status--success"
      : "status status--success";

  const edgeScans = edgeLedgerQuery.data?.scans ?? [];
  const showVerifiedFallback =
    localRuns.length === 0 &&
    edgeScans.length === 0 &&
    (statusQuery.isError || scansQuery.isError || scansQuery.data?.scans.length === 0);
  const fallbackScans = showVerifiedFallback ? [verifiedFallbackRun.scan] : [];
  const scans = [
    ...localRuns.map((run) => run.scan),
    ...edgeScans,
    ...fallbackScans,
    ...(scansQuery.data?.scans ?? []),
  ];
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

  Object.entries(edgeLedgerQuery.data?.videos_by_scan ?? {}).forEach(([scanId, videos]) => {
    videosByScan.set(scanId, videos);
  });

  if (showVerifiedFallback) {
    videosByScan.set(verifiedFallbackRun.scan.id, verifiedFallbackRun.videos);
  }

  const connectedVideos = Array.from(videosByScan.values()).flat();
  const visibleVideos = connectedVideos.length > 0 ? connectedVideos : verifiedSnapshot;
  const primaryCompletedScan =
    backendCompletedScans[0] ?? localRuns[0]?.scan ?? (showVerifiedFallback ? verifiedFallbackRun.scan : undefined);
  const analysisQuery = useQuery({
    queryKey: ["scan-analysis", primaryCompletedScan?.id],
    queryFn: () => getScanAnalysis(primaryCompletedScan?.id ?? ""),
    enabled: Boolean(primaryCompletedScan),
    retry: false,
  });

  const visibleAnalysis =
    localRuns[0]?.analysis ?? analysisQuery.data ?? (showVerifiedFallback ? verifiedFallbackRun.analysis : undefined);
  const storedOpportunityRecords = (opportunitiesQuery.data?.opportunities ?? []).map(
    (opportunity) =>
      buildOpportunityRecordFromSaved(
        opportunity,
        videosByScan.get(opportunity.scan_id) ?? [],
      ),
  );
  const edgeOpportunityRecords = (edgeLedgerQuery.data?.opportunities ?? []).map(
    (opportunity) =>
      buildOpportunityRecordFromSaved(
        opportunity,
        videosByScan.get(opportunity.scan_id) ?? [],
      ),
  );

  const opportunityRecordsRaw = [
    ...localRuns.map((run) =>
      buildOpportunityRecord({
        scan: run.scan,
        videos: run.videos,
        analysis: run.analysis,
        executionPlan: run.executionPlan,
        source: run.source === "edge" ? "backend" : "local",
      }),
    ),
    ...edgeOpportunityRecords,
    ...storedOpportunityRecords,
  ];

  if (opportunityRecordsRaw.length === 0 && primaryCompletedScan) {
    opportunityRecordsRaw.push(
      buildOpportunityRecord({
        scan: primaryCompletedScan,
        videos: visibleVideos,
        analysis:
          visibleAnalysis ??
          buildAnalysisFromVideos(
            visibleVideos,
            `${primaryCompletedScan.keyword} · opportunité backend`,
            "frontend-preview-v0",
          ),
        source: "backend",
      }),
    );
  }

  const opportunityRecords = rankOpportunities(opportunityRecordsRaw);
  const filteredOpportunityRecords =
    decisionFilter === "ALL"
      ? opportunityRecords
      : opportunityRecords.filter((opportunity) => opportunity.decisionLabel === decisionFilter);

  const selectedOpportunity =
    filteredOpportunityRecords.find((record) => record.scanId === selectedOpportunityId) ??
    filteredOpportunityRecords[0] ??
    opportunityRecords[0] ??
    undefined;
  const attackCount = opportunityRecords.filter((opportunity) => opportunity.decisionLabel === "ATTAQUER").length;
  const edgeExperiments = edgeExperimentsQuery.data?.experiments ?? [];
  const activeExperiment = edgeExperiments.find(
    (experiment) => experiment.opportunity_scan_id === selectedOpportunity?.scanId,
  );

  function runLocalScan({ count, keyword }: { count: number; keyword: string }) {
    const batchSize = count === 1 ? 5 : Math.max(5, Math.min(count, 12));
    const run = buildLocalRun(keyword.trim().replace(/\s+/g, " "), batchSize);

    setLocalRuns((current) => [run, ...current].slice(0, 8));
    setSelectedOpportunityId(run.scan.id);
  }

  function addEdgeRun(run: LocalRun) {
    setLocalRuns((current) => [run, ...current].slice(0, 8));
    setSelectedOpportunityId(run.scan.id);
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">IA Agent Tool / Agent Scout</p>
          <h1>Centre de commande</h1>
          <p className="subtitle">
            Scout, score et plan d’action dans une seule vue opérateur.
          </p>
        </div>
        <span className={backendStatusClass}>{backendStatusLabel}</span>
      </header>

      {scansQuery.isError ? (
        <div className="panel-error panel-error--wide">
          {getErrorMessage(scansQuery.error)} Le cockpit utilise l’Edge Function Supabase pour les nouveaux scans.
        </div>
      ) : null}

      {showVerifiedFallback && <EmptyState />}

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
          <span>À attaquer</span>
          <strong>{attackCount}</strong>
          <small>{selectedOpportunity ? `${selectedOpportunity.keyword} · score ${selectedOpportunity.priorityScore}` : "aucune priorité active"}</small>
        </article>
      </div>

      <section className="workspace-grid" aria-label="Cockpit agents">
        <div className="workspace-column workspace-column--scout">
          <ScoutConsole
            backendOnline={backendOnline}
            localModeActive={statusQuery.isError}
            onEdgeScan={addEdgeRun}
            onLocalScan={runLocalScan}
            scans={scans}
            videosByScan={videosByScan}
          />
        </div>

        <div className="workspace-column workspace-column--ledger">
          <OpportunityLedger
            allOpportunities={opportunityRecords}
            decisionFilter={decisionFilter}
            onDecisionFilterChange={setDecisionFilter}
            onSelectOpportunity={setSelectedOpportunityId}
            opportunities={filteredOpportunityRecords}
            selectedOpportunityId={selectedOpportunity?.scanId ?? null}
          />
        </div>

        <aside className="workspace-column workspace-column--decision">
          <ExecutionBrief
            activeExperiment={activeExperiment}
            isCreatingExperiment={createExperimentMutation.isPending}
            onCreateExperiment={(opportunity) => createExperimentMutation.mutate(opportunity)}
            opportunity={selectedOpportunity}
          />
          <ExperimentQueue
            error={edgeExperimentsQuery.error}
            experiments={edgeExperiments}
            isLoading={edgeExperimentsQuery.isLoading}
          />
          <AnalystConsole backendOnline={backendOnline} opportunity={selectedOpportunity} />
          <ProducerConsole opportunity={selectedOpportunity} />
        </aside>
      </section>
    </main>
  );
}
