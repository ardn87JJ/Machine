import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import {
  createScan,
  createEdgeExperiment,
  createEdgeProductionDraft,
  getScanAnalysis,
  listEdgeExperiments,
  listEdgeProductionDrafts,
  listEdgeScoutLedger,
  listScans,
  listOpportunities,
  listScanVideos,
  runEdgeScout,
  runScoutWorkerOnce,
  updateEdgeExperiment,
  updateEdgeProductionDraft,
  updateEdgeProductionDraftStatus,
  type ExecutionPlan,
  type ExecutionExperimentSummary,
  type OpportunitySummary,
  type ProductionAsset,
  type ProductionDraftSummary,
  type ProductionPackContent,
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
type WorkspaceView = "scout" | "decision" | "factory" | "optimizer";

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

function buildProductionPack(
  opportunity: OpportunityRecord | undefined,
  activeExperiment: ExecutionExperimentSummary | undefined,
): ProductionPackContent {
  const keyword = opportunity?.keyword ?? "niche à valider";
  const title = opportunity?.title ?? "Format court automatisable";
  const haystack = `${keyword} ${title}`.toLowerCase();
  const isMusic = haystack.includes("music") || haystack.includes("musicale") || haystack.includes("song");
  const isStory = haystack.includes("story") || haystack.includes("stories") || haystack.includes("faceless");
  const isDrama = haystack.includes("drama") || haystack.includes("série") || haystack.includes("romance");
  const status =
    activeExperiment?.outcome === "PASSED"
      ? "draft prioritaire"
      : activeExperiment
        ? "draft test"
        : "draft préparatoire";

  if (isMusic) {
    return {
      status,
      concept: `Chaîne musicale IA faceless autour de ${keyword}, avec identité visuelle stable et boucle Shorts.`,
      hooks: [
        "Ce son IA paraît sorti d’un film, mais personne ne connaît l’artiste.",
        "J’ai demandé à l’IA de composer le morceau parfait pour cette émotion.",
        "Si cette boucle reste dans ta tête, l’IA a gagné.",
      ],
      title: `J’ai créé une musique IA addictive sur ${keyword}`,
      script: [
        "0-3s: lancer le refrain ou la boucle la plus forte immédiatement.",
        "3-12s: afficher le visuel principal et nommer l’émotion ciblée.",
        "12-28s: faire évoluer le son avec 2 variations visuelles rapides.",
        "28-40s: revenir au hook sonore et pousser le replay.",
      ],
      visualPrompt: `Vertical 9:16, music visualizer, ${keyword}, cinematic neon lighting, coherent faceless AI music brand, clean readable title space.`,
      description: `Musique IA test sur ${keyword}. Si le hook tient, décliner en série de 7 morceaux courts.`,
      cta: "Sauvegarde si tu veux la version longue.",
    };
  }

  if (isStory) {
    return {
      status,
      concept: `Short faceless narratif sur ${keyword}, construit pour tension immédiate et payoff rapide.`,
      hooks: [
        "Il pensait que personne ne verrait ce détail, mais l’IA l’a repéré.",
        "Tout commence par une phrase banale, puis la situation dérape.",
        "Elle n’avait que 10 secondes pour comprendre qui mentait.",
      ],
      title: `${keyword}: l’histoire courte qui bascule en 30 secondes`,
      script: [
        "0-3s: poser le conflit avec une phrase choc.",
        "3-12s: révéler le personnage et l’enjeu.",
        "12-28s: ajouter un retournement simple et visuel.",
        "28-45s: conclure avec payoff + question commentaire.",
      ],
      visualPrompt: `Vertical 9:16, faceless story scene, ${keyword}, expressive cinematic stills, strong contrast, readable captions, suspense mood.`,
      description: `Test faceless stories sur ${keyword}. Objectif: valider hook, tension et commentaires.`,
      cta: "Commente la suite que tu veux voir.",
    };
  }

  if (isDrama) {
    return {
      status,
      concept: `Mini-drama IA vertical sur ${keyword}, avec conflit social fort et cliffhanger rapide.`,
      hooks: [
        "Elle découvre la vérité au pire moment possible.",
        "Il la rejette sans savoir qui elle est vraiment.",
        "Le contrat semblait simple, jusqu’à cette phrase.",
      ],
      title: `${keyword}: mini-drama IA épisode 1`,
      script: [
        "0-3s: ouvrir sur humiliation ou révélation.",
        "3-15s: présenter le rapport de force.",
        "15-32s: basculer avec un indice de revanche.",
        "32-45s: finir sur cliffhanger et promesse épisode 2.",
      ],
      visualPrompt: `Vertical 9:16, AI mini drama, ${keyword}, luxury office or dramatic street scene, emotional close-up, cinematic lighting, subtitle-safe composition.`,
      description: `Épisode test mini-drama IA sur ${keyword}. Mesurer rétention, replay et demandes d’épisode 2.`,
      cta: "Épisode 2 si tu veux la revanche.",
    };
  }

  return {
    status,
    concept: `Format court automatisable sur ${keyword}, optimisé pour apprendre vite avec un test à faible coût.`,
    hooks: [
      `Personne ne regarde ${keyword} de cette manière.`,
      `Voici le signal caché derrière ${keyword}.`,
      `J’ai testé ${keyword} pour voir si la niche mérite d’être attaquée.`,
    ],
    title: `${keyword}: test de niche en format court`,
    script: [
      "0-3s: poser la promesse ou le contraste.",
      "3-12s: montrer la preuve ou le signal marché.",
      "12-30s: dérouler 2 points utiles.",
      "30-45s: conclure avec test suivant et CTA.",
    ],
    visualPrompt: `Vertical 9:16, ${keyword}, clean faceless content, high contrast, readable captions, modern social video style.`,
    description: `Test rapide sur ${keyword}. Objectif: valider intérêt, commentaires et potentiel de déclinaison.`,
    cta: "Dis si je dois tester une variante.",
  };
}

function ProducerConsole({
  opportunity,
  activeExperiment,
  activeDraft,
  isSavingDraft,
  onSaveDraft,
}: {
  opportunity: OpportunityRecord | undefined;
  activeExperiment: ExecutionExperimentSummary | undefined;
  activeDraft: ProductionDraftSummary | undefined;
  isSavingDraft: boolean;
  onSaveDraft: (pack: ProductionPackContent) => void;
}) {
  const pack = buildProductionPack(opportunity, activeExperiment);
  const canSaveDraft = Boolean(opportunity) && !activeDraft && !isSavingDraft;

  return (
    <section className="cockpit-panel" id="producer">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agent Producteur</p>
          <h2>Pack production</h2>
          <p className="panel-substatus">Draft court prêt à tester à partir de l’opportunité sélectionnée.</p>
        </div>
        <span className="phase">{pack.status}</span>
      </div>

      <div className="producer-actions">
        <button
          disabled={!canSaveDraft}
          onClick={() => onSaveDraft(pack)}
          type="button"
        >
          {activeDraft ? "Draft sauvegardé" : isSavingDraft ? "SAUVEGARDE..." : "Sauvegarder draft"}
        </button>
        {activeDraft ? <small>Statut {activeDraft.status} · sauvegardé le {formatDate(activeDraft.created_at)}</small> : null}
      </div>

      <div className="production-pack">
        <article className="production-concept">
          <span>Concept</span>
          <strong>{pack.concept}</strong>
          <p>{opportunity?.executionPlan.notes ?? "Draft préparatoire, à valider par un test court avant production en série."}</p>
        </article>

        <article className="production-hooks">
          <span>3 hooks</span>
          <ol>
            {pack.hooks.map((hook) => (
              <li key={hook}>{hook}</li>
            ))}
          </ol>
        </article>

        <article className="production-script">
          <span>Script 30-45s</span>
          <strong>{pack.title}</strong>
          <ol>
            {pack.script.map((beat) => (
              <li key={beat}>{beat}</li>
            ))}
          </ol>
        </article>

        <article className="production-assets">
          <div>
            <span>Prompt visuel</span>
            <p>{pack.visualPrompt}</p>
          </div>
          <div>
            <span>Description</span>
            <p>{pack.description}</p>
          </div>
          <div>
            <span>CTA</span>
            <strong>{pack.cta}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}

function buildDetailedScript(draft: ProductionDraftSummary) {
  const hook = draft.content.hooks[0] ?? "Ouvrir avec une promesse claire.";
  const proof = draft.content.script[1] ?? "Montrer le signal principal.";
  const development = draft.content.script[2] ?? "Developper deux preuves visuelles rapides.";
  const close = draft.content.script[3] ?? "Fermer avec un appel a l'action.";

  return [
    {
      label: "0-3s - Hook",
      text: `${hook} Afficher le titre en grand, couper toute intro, entrer directement dans le conflit ou la promesse.`,
    },
    {
      label: "3-12s - Preuve",
      text: `${proof} Montrer une capture, un exemple de format ou une preuve chiffrable liee a ${draft.keyword}.`,
    },
    {
      label: "12-30s - Deroule",
      text: `${development} Alterner phrase courte, preuve visuelle et sous-titre lisible toutes les 3 a 5 secondes.`,
    },
    {
      label: "30-45s - Cloture",
      text: `${close} Terminer par ${draft.content.cta}`,
    },
  ];
}

function formatDraftForExport(draft: ProductionDraftSummary) {
  const detailedScript = buildDetailedScript(draft);

  return [
    `TITRE: ${draft.title}`,
    `STATUT: ${draft.status}`,
    `NICHE: ${draft.keyword}`,
    "",
    "CONCEPT",
    draft.content.concept,
    "",
    "HOOKS",
    ...draft.content.hooks.map((hook, index) => `${index + 1}. ${hook}`),
    "",
    "SCRIPT DETAILLE",
    ...detailedScript.map((step) => `${step.label}: ${step.text}`),
    "",
    "PROMPT VISUEL",
    draft.content.visualPrompt,
    "",
    "DESCRIPTION",
    draft.content.description,
    "",
    "CTA",
    draft.content.cta,
  ].join("\n");
}

function buildFactoryVariants(draft: ProductionDraftSummary) {
  const keyword = draft.keyword;
  const baseTitle = draft.title;
  const firstHook = draft.content.hooks[0] ?? `J'ai teste ${keyword} pour voir si la niche tient.`;

  return {
    titles: Array.from(new Set([
      baseTitle,
      `${keyword}: le test qui decide si on attaque`,
      `J'ai analyse ${keyword}: opportunite ou piege ?`,
      `${keyword}: 45 secondes pour valider la niche`,
    ])),
    hooks: Array.from(new Set([
      firstHook,
      `La plupart des createurs ratent ${keyword} pour une raison simple.`,
      `Si ce signal tient, ${keyword} devient une niche a tester maintenant.`,
      `J'ai trouve le point faible des contenus ${keyword}.`,
    ])),
    checklist: [
      "Choisir 1 hook principal et 1 hook de secours.",
      "Monter en vertical 9:16 avec sous-titres lisibles.",
      "Afficher une preuve marche avant 12 secondes.",
      "Publier un premier test court, puis noter vues, commentaires et retention.",
      "Marquer le draft USED seulement apres publication ou test reel.",
    ],
  };
}

function buildMontagePlan(draft: ProductionDraftSummary, selectedTitle: string, selectedHook: string) {
  return [
    `Scene 1: texte plein ecran "${selectedHook}" avec cut rapide et sous-titre lisible.`,
    `Scene 2: preuve marche sur ${draft.keyword}, montrer le signal avant 12 secondes.`,
    `Scene 3: derouler ${selectedTitle} en 2 points, rythme 3 a 5 secondes par plan.`,
    `Scene 4: finir sur ${draft.content.cta} avec ecran simple et promesse de suite.`,
  ];
}

function buildVoicePrompt(draft: ProductionDraftSummary, selectedHook: string) {
  return [
    `Voix off verticale 30-45 secondes sur ${draft.keyword}.`,
    `Ton: direct, curieux, oriente opportunite business.`,
    `Ouverture exacte: ${selectedHook}`,
    "Rythme rapide, phrases courtes, aucune introduction generique.",
    `Conclusion: ${draft.content.cta}`,
  ].join(" ");
}

function buildAssetQueue(
  draft: ProductionDraftSummary,
  selectedTitle: string,
  selectedHook: string,
  assetStatuses: Partial<Record<string, ProductionAsset["status"]>> = {},
) {
  const montagePlan = buildMontagePlan(draft, selectedTitle, selectedHook);
  const voicePrompt = buildVoicePrompt(draft, selectedHook);
  const screenTexts = [
    selectedHook,
    `Preuve marche: ${draft.keyword}`,
    selectedTitle,
    draft.content.cta,
  ];

  return montagePlan.map((step, index) => {
    const scene = `Scene ${index + 1}`;
    const previousStatus = draft.content.factory?.assets.find((asset) => asset.scene === scene)?.status;

    return {
      scene,
      storyboard: step,
      visualPrompt: `${draft.content.visualPrompt} Scene ${index + 1}, composition claire, texte ecran lisible, pas de surcharge.`,
      voicePrompt: `${voicePrompt} Segment ${index + 1}: ${step}`,
      screenText: screenTexts[index] ?? draft.content.cta,
      status: assetStatuses[scene] ?? previousStatus ?? "TODO",
    };
  });
}

function buildFactoryContent(
  draft: ProductionDraftSummary,
  selectedTitle: string,
  selectedHook: string,
  doneChecklistItems: string[],
  assetStatuses: Partial<Record<string, ProductionAsset["status"]>> = {},
) {
  const variants = buildFactoryVariants(draft);

  return {
    ...draft.content,
    title: selectedTitle,
    hooks: [selectedHook, ...draft.content.hooks.filter((hook) => hook !== selectedHook)],
    factory: {
      selectedTitle,
      selectedHook,
      checklist: variants.checklist.map((label) => ({
        label,
        done: doneChecklistItems.includes(label),
      })),
      montagePlan: buildMontagePlan(draft, selectedTitle, selectedHook),
      voicePrompt: buildVoicePrompt(draft, selectedHook),
      assets: buildAssetQueue(draft, selectedTitle, selectedHook, assetStatuses),
      updatedAt: new Date().toISOString(),
    },
  };
}

function formatAssetMarkdown(draft: ProductionDraftSummary, asset: ProductionAsset) {
  return [
    `# ${draft.keyword} - ${asset.scene}`,
    "",
    `Draft: ${draft.title}`,
    `Statut asset: ${asset.status}`,
    "",
    "## Storyboard",
    asset.storyboard,
    "",
    "## Texte ecran",
    asset.screenText,
    "",
    "## Prompt visuel",
    asset.visualPrompt,
    "",
    "## Prompt voix",
    asset.voicePrompt,
  ].join("\n");
}

function formatFactoryMarkdown(draft: ProductionDraftSummary, content: ProductionPackContent) {
  const factory = content.factory;
  const assets = factory?.assets ?? buildAssetQueue(
    draft,
    factory?.selectedTitle ?? content.title,
    factory?.selectedHook ?? content.hooks[0] ?? draft.keyword,
  );

  return [
    `# ${content.title}`,
    "",
    `Niche: ${draft.keyword}`,
    `Statut draft: ${draft.status}`,
    "",
    "## Concept",
    content.concept,
    "",
    "## Hook choisi",
    factory?.selectedHook ?? content.hooks[0] ?? "",
    "",
    "## Description",
    content.description,
    "",
    "## CTA",
    content.cta,
    "",
    "## Checklist",
    ...(factory?.checklist ?? []).map((item) => `- [${item.done ? "x" : " "}] ${item.label}`),
    "",
    "## Plan de montage",
    ...(factory?.montagePlan ?? []).map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Prompt voix",
    factory?.voicePrompt ?? "",
    "",
    "## Assets a produire",
    ...assets.flatMap((asset) => [
      "",
      `### ${asset.scene} - ${asset.status}`,
      `Storyboard: ${asset.storyboard}`,
      `Texte ecran: ${asset.screenText}`,
      `Prompt visuel: ${asset.visualPrompt}`,
      `Prompt voix: ${asset.voicePrompt}`,
    ]),
  ].join("\n");
}

function findDraftExperiment(
  draft: ProductionDraftSummary,
  experiments: ExecutionExperimentSummary[],
) {
  return experiments.find((experiment) => experiment.id === draft.experiment_id) ??
    experiments.find((experiment) => experiment.opportunity_scan_id === draft.opportunity_scan_id);
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function exportDraftAsText(draft: ProductionDraftSummary) {
  const blob = new Blob([formatDraftForExport(draft)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${draft.keyword.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-production-draft.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAssetAsMarkdown(draft: ProductionDraftSummary, asset: ProductionAsset) {
  const blob = new Blob([formatAssetMarkdown(draft, asset)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = `${draft.keyword}-${asset.scene}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  link.href = url;
  link.download = `${slug}-asset.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function ProductionDraftsPanel({
  drafts,
  isLoading,
  error,
  isUpdatingDraft,
  selectedDraftId,
  experiments,
  onSelectDraft,
  onUpdateDraftStatus,
}: {
  drafts: ProductionDraftSummary[];
  isLoading: boolean;
  error: unknown;
  isUpdatingDraft: boolean;
  selectedDraftId: string | null;
  experiments: ExecutionExperimentSummary[];
  onSelectDraft: (draftId: string) => void;
  onUpdateDraftStatus: (draft: ProductionDraftSummary, status: ProductionDraftSummary["status"]) => void;
}) {
  return (
    <section className="cockpit-panel production-drafts" aria-labelledby="production-drafts-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Content Factory</p>
          <h2 id="production-drafts-title">Drafts production</h2>
          <p className="panel-substatus">Packs sauvegardés, prêts à transformer en assets ou scripts détaillés.</p>
        </div>
        <span className="phase">{drafts.length} drafts</span>
      </div>

      {error ? <p className="panel-error">{getErrorMessage(error)}</p> : null}
      {isLoading ? <p className="panel-substatus">Chargement des drafts...</p> : null}

      <div className="draft-list">
        {drafts.length === 0 && !isLoading ? (
          <p className="panel-empty">Aucun draft sauvegardé. Génère un pack puis sauvegarde-le.</p>
        ) : null}
        {drafts.slice(0, 5).map((draft) => (
          <article className={`draft-card draft-card--${draft.status.toLowerCase()}`} key={draft.id}>
            {(() => {
              const experiment = findDraftExperiment(draft, experiments);
              const isSelected = selectedDraftId === draft.id;

              return (
                <>
            <div>
              <span>{draft.status}</span>
              <strong>{draft.title}</strong>
              <small>{draft.keyword} · {formatDate(draft.created_at)}</small>
            </div>
            <p>{draft.content.concept}</p>
            {experiment ? (
              <p className="draft-learning">
                Test {experiment.status} · {experiment.outcome} · {experiment.result_note || experiment.success_criteria}
              </p>
            ) : null}
            <div className="draft-actions">
              <button
                disabled={isSelected}
                onClick={() => onSelectDraft(draft.id)}
                type="button"
              >
                {isSelected ? "Draft actif" : "Activer"}
              </button>
              <button
                disabled={isUpdatingDraft || draft.status === "READY"}
                onClick={() => onUpdateDraftStatus(draft, "READY")}
                type="button"
              >
                Marquer READY
              </button>
              <button
                disabled={isUpdatingDraft || draft.status === "USED"}
                onClick={() => onUpdateDraftStatus(draft, "USED")}
                type="button"
              >
                Marquer USED
              </button>
              <button onClick={() => copyTextToClipboard(formatDraftForExport(draft))} type="button">
                Copier
              </button>
              <button onClick={() => exportDraftAsText(draft)} type="button">
                Exporter TXT
              </button>
            </div>
            <details className="draft-script">
              <summary>Script détaillé</summary>
              <ol>
                {buildDetailedScript(draft).map((step) => (
                  <li key={step.label}>
                    <strong>{step.label}</strong>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </details>
            <ul>
              {draft.content.hooks.slice(0, 2).map((hook) => (
                <li key={hook}>{hook}</li>
              ))}
            </ul>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentFactoryWorkbench({
  draft,
  experiment,
  isSavingFactory,
  onSaveFactory,
}: {
  draft: ProductionDraftSummary | undefined;
  experiment: ExecutionExperimentSummary | undefined;
  isSavingFactory: boolean;
  onSaveFactory: (
    draft: ProductionDraftSummary,
    content: ProductionPackContent,
    title: string,
  ) => void;
}) {
  const variants = draft ? buildFactoryVariants(draft) : { titles: [], hooks: [], checklist: [] };
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedHook, setSelectedHook] = useState("");
  const [doneChecklistItems, setDoneChecklistItems] = useState<string[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<Partial<Record<string, ProductionAsset["status"]>>>({});

  useEffect(() => {
    if (!draft) {
      setSelectedTitle("");
      setSelectedHook("");
      setDoneChecklistItems([]);
      setAssetStatuses({});
      return;
    }

    const nextVariants = buildFactoryVariants(draft);
    setSelectedTitle(draft.content.factory?.selectedTitle ?? draft.content.title ?? nextVariants.titles[0] ?? "");
    setSelectedHook(draft.content.factory?.selectedHook ?? draft.content.hooks[0] ?? nextVariants.hooks[0] ?? "");
    setDoneChecklistItems(
      draft.content.factory?.checklist
        .filter((item) => item.done)
        .map((item) => item.label) ?? [],
    );
    setAssetStatuses(Object.fromEntries(
      (draft.content.factory?.assets ?? []).map((asset) => [asset.scene, asset.status]),
    ));
  }, [draft?.id, draft?.updated_at, draft]);

  if (!draft) {
    return (
      <section className="cockpit-panel content-factory" aria-labelledby="content-factory-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Content Factory</p>
            <h2 id="content-factory-title">Atelier draft</h2>
            <p className="panel-substatus">Sauvegarde ou active un draft pour préparer les variantes.</p>
          </div>
          <span className="phase">EN ATTENTE</span>
        </div>
        <p className="panel-empty">Aucun draft actif. Le prochain pack sauvegardé pourra être préparé ici.</p>
      </section>
    );
  }

  const detailedScript = buildDetailedScript(draft);
  const factoryContent = buildFactoryContent(draft, selectedTitle, selectedHook, doneChecklistItems, assetStatuses);
  const montagePlan = factoryContent.factory?.montagePlan ?? [];
  const voicePrompt = factoryContent.factory?.voicePrompt ?? "";
  const assets = factoryContent.factory?.assets ?? [];
  const markdownExport = formatFactoryMarkdown(draft, factoryContent);
  const completedCount = doneChecklistItems.length;
  const completedAssetCount = assets.filter((asset) => asset.status === "DONE").length;

  return (
    <section className="cockpit-panel content-factory" aria-labelledby="content-factory-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Content Factory</p>
          <h2 id="content-factory-title">Atelier draft</h2>
          <p className="panel-substatus">{draft.keyword} · {draft.status}</p>
        </div>
        <span className="phase">{completedCount}/{variants.checklist.length} PRET</span>
      </div>

      <div className="factory-grid">
        <article>
          <span>Variantes titres</span>
          <ol>
            {variants.titles.map((title) => (
              <li key={title}>
                <label>
                  <input
                    checked={selectedTitle === title}
                    name="factory-title"
                    onChange={() => setSelectedTitle(title)}
                    type="radio"
                  />
                  {title}
                </label>
              </li>
            ))}
          </ol>
        </article>
        <article>
          <span>Variantes hooks</span>
          <ol>
            {variants.hooks.map((hook) => (
              <li key={hook}>
                <label>
                  <input
                    checked={selectedHook === hook}
                    name="factory-hook"
                    onChange={() => setSelectedHook(hook)}
                    type="radio"
                  />
                  {hook}
                </label>
              </li>
            ))}
          </ol>
        </article>
      </div>

      <div className="factory-checklist">
        <span>Checklist production courte</span>
        {variants.checklist.map((item) => (
          <label key={item}>
            <input
              checked={doneChecklistItems.includes(item)}
              onChange={(event) =>
                setDoneChecklistItems((current) =>
                  event.target.checked
                    ? [...current, item]
                    : current.filter((currentItem) => currentItem !== item),
                )
              }
              type="checkbox"
            />
            {item}
          </label>
        ))}
      </div>

      <div className="factory-actions">
        <button
          disabled={isSavingFactory || !selectedTitle || !selectedHook}
          onClick={() => onSaveFactory(draft, factoryContent, selectedTitle)}
          type="button"
        >
          {isSavingFactory ? "SAUVEGARDE..." : "Sauvegarder factory"}
        </button>
        <button onClick={() => copyTextToClipboard(markdownExport)} type="button">
          Copier Markdown
        </button>
        <button
          onClick={() => {
            const blob = new Blob([markdownExport], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${draft.keyword.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-content-factory.md`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          type="button"
        >
          Export Markdown
        </button>
        {draft.content.factory ? <small>Dernière sauvegarde {formatDate(draft.content.factory.updatedAt)}</small> : null}
      </div>

      <div className="factory-script">
        <span>Plan montage</span>
        <ol>
          {montagePlan.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="factory-learning">
        <span>Prompt voix</span>
        <p>{voicePrompt}</p>
      </div>

      <div className="factory-assets">
        <div className="asset-section-heading">
          <span>Assets à produire</span>
          <small>{completedAssetCount}/{assets.length} DONE</small>
        </div>
        <div className="asset-list">
          {assets.map((asset) => (
            <article className={`asset-card asset-card--${asset.status.toLowerCase()}`} key={asset.scene}>
              <div>
                <strong>{asset.scene}</strong>
                <label>
                  Statut
                  <select
                    aria-label={`Statut ${asset.scene}`}
                    onChange={(event) =>
                      setAssetStatuses((current) => ({
                        ...current,
                        [asset.scene]: event.target.value as ProductionAsset["status"],
                      }))
                    }
                    value={asset.status}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </label>
              </div>
              <p>{asset.storyboard}</p>
              <dl>
                <div>
                  <dt>Texte écran</dt>
                  <dd>{asset.screenText}</dd>
                </div>
                <div>
                  <dt>Visuel</dt>
                  <dd>{asset.visualPrompt}</dd>
                </div>
                <div>
                  <dt>Voix</dt>
                  <dd>{asset.voicePrompt}</dd>
                </div>
              </dl>
              <div className="asset-actions">
                <button onClick={() => copyTextToClipboard(formatAssetMarkdown(draft, asset))} type="button">
                  Copier asset
                </button>
                <button onClick={() => exportAssetAsMarkdown(draft, asset)} type="button">
                  Export asset
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="factory-script">
        <span>Script prêt à tourner</span>
        <ol>
          {detailedScript.map((step) => (
            <li key={step.label}>
              <strong>{step.label}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {experiment ? (
        <div className="factory-learning">
          <span>Liaison test</span>
          <strong>{experiment.status} · {experiment.outcome}</strong>
          <p>{experiment.result_note || experiment.success_criteria}</p>
        </div>
      ) : null}
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
  isUpdatingExperiment,
  onUpdateExperiment,
}: {
  experiments: ExecutionExperimentSummary[];
  isLoading: boolean;
  error: unknown;
  isUpdatingExperiment: boolean;
  onUpdateExperiment: (
    experiment: ExecutionExperimentSummary,
    patch: Pick<ExecutionExperimentSummary, "status" | "outcome" | "result_note">,
  ) => void;
}) {
  const [notesByExperiment, setNotesByExperiment] = useState<Record<string, string>>({});

  function noteFor(experiment: ExecutionExperimentSummary) {
    return notesByExperiment[experiment.id] ?? experiment.result_note ?? "";
  }

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
              <span className={`experiment-status experiment-status--${experiment.status.toLowerCase()}`}>
                {experiment.status}
              </span>
              <strong>{experiment.keyword}</strong>
              <small>{experiment.title}</small>
            </div>
            <p>{experiment.next_action}</p>
            <label className="experiment-note">
              <span>Note résultat</span>
              <textarea
                maxLength={1000}
                onChange={(event) =>
                  setNotesByExperiment((current) => ({
                    ...current,
                    [experiment.id]: event.target.value,
                  }))
                }
                placeholder="Ex: hook trop lent, CTR faible, bon signal commentaires..."
                rows={3}
                value={noteFor(experiment)}
              />
            </label>
            <div className="experiment-actions">
              <button
                disabled={isUpdatingExperiment || experiment.status === "RUNNING"}
                onClick={() =>
                  onUpdateExperiment(experiment, {
                    status: "RUNNING",
                    outcome: "UNKNOWN",
                    result_note: noteFor(experiment),
                  })
                }
                type="button"
              >
                Démarrer
              </button>
              <button
                disabled={isUpdatingExperiment || experiment.status === "PAUSED"}
                onClick={() =>
                  onUpdateExperiment(experiment, {
                    status: "PAUSED",
                    outcome: "UNKNOWN",
                    result_note: noteFor(experiment),
                  })
                }
                type="button"
              >
                Pause
              </button>
              <button
                disabled={isUpdatingExperiment}
                onClick={() =>
                  onUpdateExperiment(experiment, {
                    status: "DONE",
                    outcome: "PASSED",
                    result_note: noteFor(experiment),
                  })
                }
                type="button"
              >
                Réussi
              </button>
              <button
                disabled={isUpdatingExperiment}
                onClick={() =>
                  onUpdateExperiment(experiment, {
                    status: "DONE",
                    outcome: "FAILED",
                    result_note: noteFor(experiment),
                  })
                }
                type="button"
              >
                Échec
              </button>
            </div>
            <div className="experiment-meta">
              <span>{experiment.decision_label}</span>
              <span>score {experiment.priority_score}</span>
              <span>{experiment.outcome}</span>
              <span>{formatDate(experiment.created_at)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildOptimizerRecommendation(
  experiments: ExecutionExperimentSummary[],
  drafts: ProductionDraftSummary[],
) {
  const doneExperiments = experiments.filter((experiment) => experiment.status === "DONE");
  const passedExperiments = doneExperiments.filter((experiment) => experiment.outcome === "PASSED");
  const failedExperiments = doneExperiments.filter((experiment) => experiment.outcome === "FAILED");
  const runningExperiments = experiments.filter((experiment) => experiment.status === "RUNNING");
  const readyExperiments = experiments.filter((experiment) => experiment.status === "READY");
  const readyDrafts = drafts.filter((draft) => draft.status === "READY");
  const usedDrafts = drafts.filter((draft) => draft.status === "USED");
  const successRate =
    doneExperiments.length > 0 ? Math.round((passedExperiments.length / doneExperiments.length) * 100) : 0;
  const latestNote = doneExperiments.find((experiment) => experiment.result_note.trim().length > 0)?.result_note ?? "";
  const latestUsedDraft = usedDrafts[0];

  if (passedExperiments.length > failedExperiments.length && passedExperiments[0]) {
    return {
      status: "ACCELERER",
      action: `Doubler le test sur ${passedExperiments[0].keyword}`,
      reason: "Les tests terminés donnent plus de réussites que d’échecs. Priorité au volume contrôlé.",
      successRate,
      latestNote,
      doneCount: doneExperiments.length,
      runningCount: runningExperiments.length,
      readyCount: readyExperiments.length,
      passedCount: passedExperiments.length,
      failedCount: failedExperiments.length,
      readyDraftCount: readyDrafts.length,
      usedDraftCount: usedDrafts.length,
      latestUsedDraft,
    };
  }

  if (failedExperiments.length > 0 && failedExperiments.length >= passedExperiments.length) {
    return {
      status: "AJUSTER",
      action: `Changer hook ou angle sur ${failedExperiments[0].keyword}`,
      reason: "Les derniers tests ne valident pas encore le signal. Réduire le risque avant de produire plus.",
      successRate,
      latestNote,
      doneCount: doneExperiments.length,
      runningCount: runningExperiments.length,
      readyCount: readyExperiments.length,
      passedCount: passedExperiments.length,
      failedCount: failedExperiments.length,
      readyDraftCount: readyDrafts.length,
      usedDraftCount: usedDrafts.length,
      latestUsedDraft,
    };
  }

  if (runningExperiments[0]) {
    return {
      status: "MESURER",
      action: `Collecter les résultats de ${runningExperiments[0].keyword}`,
      reason: "Un test est actif. L’Optimizer attend un résultat exploitable avant de recommander un pivot.",
      successRate,
      latestNote,
      doneCount: doneExperiments.length,
      runningCount: runningExperiments.length,
      readyCount: readyExperiments.length,
      passedCount: passedExperiments.length,
      failedCount: failedExperiments.length,
      readyDraftCount: readyDrafts.length,
      usedDraftCount: usedDrafts.length,
      latestUsedDraft,
    };
  }

  return {
    status: "LANCER",
    action: readyExperiments[0]
      ? `Démarrer ${readyExperiments[0].keyword}`
      : "Créer un test depuis une opportunité ATTAQUER",
    reason: "Pas assez de résultats terminés pour apprendre. Il faut alimenter la boucle d’expérimentation.",
    successRate,
    latestNote,
    doneCount: doneExperiments.length,
    runningCount: runningExperiments.length,
    readyCount: readyExperiments.length,
    passedCount: passedExperiments.length,
    failedCount: failedExperiments.length,
    readyDraftCount: readyDrafts.length,
    usedDraftCount: usedDrafts.length,
    latestUsedDraft,
  };
}

function OptimizerPanel({
  experiments,
  drafts,
}: {
  experiments: ExecutionExperimentSummary[];
  drafts: ProductionDraftSummary[];
}) {
  const recommendation = buildOptimizerRecommendation(experiments, drafts);
  const learningNotes = experiments
    .filter((experiment) => experiment.result_note.trim().length > 0)
    .slice(0, 3);

  return (
    <section className="cockpit-panel optimizer-panel" aria-labelledby="optimizer-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Optimizer</p>
          <h2 id="optimizer-title">Apprentissages</h2>
          <p className="panel-substatus">Lecture des tests terminés et recommandation de prochaine action.</p>
        </div>
        <span className="phase">{recommendation.status}</span>
      </div>

      <div className="optimizer-summary">
        <article>
          <span>Réussite</span>
          <strong>{recommendation.successRate}%</strong>
          <small>{recommendation.passedCount} réussis · {recommendation.failedCount} échecs</small>
        </article>
        <article>
          <span>Actifs</span>
          <strong>{recommendation.runningCount}</strong>
          <small>{recommendation.readyCount} prêts · {recommendation.doneCount} terminés</small>
        </article>
        <article>
          <span>Drafts</span>
          <strong>{recommendation.readyDraftCount}</strong>
          <small>{recommendation.usedDraftCount} utilisés · prêts Content Factory</small>
        </article>
      </div>

      <div className="optimizer-action">
        <span>Recommandation</span>
        <strong>{recommendation.action}</strong>
        <p>{recommendation.reason}</p>
      </div>

      <div className="optimizer-notes">
        <span>Notes apprises</span>
        {learningNotes.length === 0 ? (
          <p className="panel-empty">Aucune note résultat exploitable pour l’instant.</p>
        ) : (
          learningNotes.map((experiment) => (
            <blockquote key={experiment.id}>
              <strong>{experiment.keyword}</strong>
              <p>{experiment.result_note}</p>
            </blockquote>
          ))
        )}
      </div>

      {recommendation.latestUsedDraft ? (
        <div className="optimizer-action">
          <span>Dernier draft utilisé</span>
          <strong>{recommendation.latestUsedDraft.keyword}</strong>
          <p>{recommendation.latestUsedDraft.title}</p>
        </div>
      ) : null}
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
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("ALL");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("scout");
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

  const edgeProductionDraftsQuery = useQuery({
    queryKey: ["edge-production-drafts"],
    queryFn: listEdgeProductionDrafts,
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
      setWorkspaceView("optimizer");
    },
  });

  const updateExperimentMutation = useMutation({
    mutationFn: (payload: {
      experiment: ExecutionExperimentSummary;
      patch: Pick<ExecutionExperimentSummary, "status" | "outcome" | "result_note">;
    }) =>
      updateEdgeExperiment({
        experiment_id: payload.experiment.id,
        ...payload.patch,
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["edge-experiments"] });
      if (data.experiment.outcome === "PASSED") {
        setWorkspaceView("factory");
      }
    },
  });

  const createProductionDraftMutation = useMutation({
    mutationFn: (pack: ProductionPackContent) => {
      if (!selectedOpportunity) {
        throw new Error("Aucune opportunité sélectionnée.");
      }

      return createEdgeProductionDraft({
        opportunity_scan_id: selectedOpportunity.scanId,
        experiment_id: activeExperiment?.id ?? null,
        keyword: selectedOpportunity.keyword,
        title: pack.title,
        status: activeExperiment?.outcome === "PASSED" ? "READY" : "DRAFT",
        content: pack,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["edge-production-drafts"] });
      setWorkspaceView("factory");
    },
  });

  const updateProductionDraftMutation = useMutation({
    mutationFn: (payload: {
      draft: ProductionDraftSummary;
      status: ProductionDraftSummary["status"];
    }) =>
      updateEdgeProductionDraftStatus({
        draft_id: payload.draft.id,
        status: payload.status,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["edge-production-drafts"] });
    },
  });

  const saveFactoryDraftMutation = useMutation({
    mutationFn: (payload: {
      draft: ProductionDraftSummary;
      content: ProductionPackContent;
      title: string;
    }) =>
      updateEdgeProductionDraft({
        draft_id: payload.draft.id,
        title: payload.title,
        content: payload.content,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["edge-production-drafts"] });
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
  const productionDrafts = edgeProductionDraftsQuery.data?.drafts ?? [];
  const activeDraft = productionDrafts.find(
    (draft) => draft.opportunity_scan_id === selectedOpportunity?.scanId,
  );
  const activeFactoryDraft =
    productionDrafts.find((draft) => draft.id === selectedDraftId) ??
    activeDraft ??
    productionDrafts[0] ??
    undefined;
  const activeFactoryExperiment = activeFactoryDraft
    ? findDraftExperiment(activeFactoryDraft, edgeExperiments)
    : undefined;

  function runLocalScan({ count, keyword }: { count: number; keyword: string }) {
    const batchSize = count === 1 ? 5 : Math.max(5, Math.min(count, 12));
    const run = buildLocalRun(keyword.trim().replace(/\s+/g, " "), batchSize);

    setLocalRuns((current) => [run, ...current].slice(0, 8));
    setSelectedOpportunityId(run.scan.id);
    setWorkspaceView("decision");
  }

  function addEdgeRun(run: LocalRun) {
    setLocalRuns((current) => [run, ...current].slice(0, 8));
    setSelectedOpportunityId(run.scan.id);
    setWorkspaceView("decision");
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

      <nav className="machine-nav" aria-label="Espaces Machine">
        {([
          ["scout", "Scout", "Collecte + ledger"],
          ["decision", "Décision", "Analyse + test"],
          ["factory", "Factory", "Drafts + assets"],
          ["optimizer", "Optimizer", "Tests + apprentissages"],
        ] as Array<[WorkspaceView, string, string]>).map(([view, label, description]) => (
          <button
            className={`machine-nav__item ${workspaceView === view ? "is-active" : ""}`}
            key={view}
            onClick={() => setWorkspaceView(view)}
            type="button"
          >
            <span>{label}</span>
            <small>{description}</small>
          </button>
        ))}
      </nav>

      {workspaceView === "scout" ? (
        <section className="workspace-stage workspace-stage--scout" aria-label="Espace Scout">
          <ScoutConsole
            backendOnline={backendOnline}
            localModeActive={statusQuery.isError}
            onEdgeScan={addEdgeRun}
            onLocalScan={runLocalScan}
            scans={scans}
            videosByScan={videosByScan}
          />
          <OpportunityLedger
            allOpportunities={opportunityRecords}
            decisionFilter={decisionFilter}
            onDecisionFilterChange={setDecisionFilter}
            onSelectOpportunity={setSelectedOpportunityId}
            opportunities={filteredOpportunityRecords}
            selectedOpportunityId={selectedOpportunity?.scanId ?? null}
          />
        </section>
      ) : null}

      {workspaceView === "decision" ? (
        <section className="workspace-stage workspace-stage--decision" aria-label="Espace Décision">
          <OpportunityLedger
            allOpportunities={opportunityRecords}
            decisionFilter={decisionFilter}
            onDecisionFilterChange={setDecisionFilter}
            onSelectOpportunity={setSelectedOpportunityId}
            opportunities={filteredOpportunityRecords}
            selectedOpportunityId={selectedOpportunity?.scanId ?? null}
          />
          <ExecutionBrief
            activeExperiment={activeExperiment}
            isCreatingExperiment={createExperimentMutation.isPending}
            onCreateExperiment={(opportunity) => createExperimentMutation.mutate(opportunity)}
            opportunity={selectedOpportunity}
          />
          <AnalystConsole backendOnline={backendOnline} opportunity={selectedOpportunity} />
        </section>
      ) : null}

      {workspaceView === "factory" ? (
        <section className="workspace-stage workspace-stage--factory" aria-label="Espace Content Factory">
          <ProducerConsole
            activeDraft={activeDraft}
            activeExperiment={activeExperiment}
            isSavingDraft={createProductionDraftMutation.isPending}
            onSaveDraft={(pack) => createProductionDraftMutation.mutate(pack)}
            opportunity={selectedOpportunity}
          />
          <ContentFactoryWorkbench
            draft={activeFactoryDraft}
            experiment={activeFactoryExperiment}
            isSavingFactory={saveFactoryDraftMutation.isPending}
            onSaveFactory={(draft, content, title) =>
              saveFactoryDraftMutation.mutate({ draft, content, title })
            }
          />
          <ProductionDraftsPanel
            drafts={productionDrafts}
            error={edgeProductionDraftsQuery.error}
            experiments={edgeExperiments}
            isLoading={edgeProductionDraftsQuery.isLoading}
            isUpdatingDraft={updateProductionDraftMutation.isPending}
            onSelectDraft={setSelectedDraftId}
            onUpdateDraftStatus={(draft, status) =>
              updateProductionDraftMutation.mutate({ draft, status })
            }
            selectedDraftId={activeFactoryDraft?.id ?? null}
          />
        </section>
      ) : null}

      {workspaceView === "optimizer" ? (
        <section className="workspace-stage workspace-stage--optimizer" aria-label="Espace Optimizer">
          <ExperimentQueue
            error={edgeExperimentsQuery.error}
            experiments={edgeExperiments}
            isLoading={edgeExperimentsQuery.isLoading}
            isUpdatingExperiment={updateExperimentMutation.isPending}
            onUpdateExperiment={(experiment, patch) =>
              updateExperimentMutation.mutate({ experiment, patch })
            }
          />
          <OptimizerPanel drafts={productionDrafts} experiments={edgeExperiments} />
        </section>
      ) : null}
    </main>
  );
}
