type JsonRecord = Record<string, unknown>;

type YouTubeVideo = {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  published_at: string | null;
  duration: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  thumbnail_url: string | null;
  raw: JsonRecord;
};

type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  published_at: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  thumbnail_url: string | null;
  raw: JsonRecord;
};

type ScanVideoSummary = {
  rank: number;
  video_id: string;
  title: string;
  channel_id: string;
  channel_title: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  published_at: string | null;
  thumbnail_url: string | null;
};

type BusinessScores = {
  money_score: number;
  attack_score: number;
  speed_cash_score: number;
  quality_gap_score: number;
  weak_competitor_score: number;
  upload_pressure_score: number;
  ecosystem_score: number;
  confidence: number;
};

type ScanAnalysis = {
  model_version: string;
  opportunity_title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  scores: BusinessScores;
  summary: string;
  evidence_video_ids: string[];
  competitor_channels: string[];
};

type OpportunitySummary = {
  id: string;
  scan_id: string;
  keyword: string;
  title: string;
  verdict: "GO" | "WATCH" | "SKIP";
  model_version: string;
  summary: string;
  scores: BusinessScores;
  evidence_video_ids: string[];
  competitor_channels: string[];
  execution_plan: {
    angle: string;
    first_test: string;
    criteria_go: string;
    notes: string;
  };
  source: string;
  created_at: string;
  updated_at: string;
};

type ExecutionExperimentSummary = {
  id: string;
  opportunity_scan_id: string;
  keyword: string;
  title: string;
  decision_label: "ATTAQUER" | "TESTER" | "VEILLE";
  priority_score: number;
  status: "READY" | "RUNNING" | "DONE" | "PAUSED";
  outcome: "UNKNOWN" | "PASSED" | "FAILED";
  next_action: string;
  success_criteria: string;
  result_note: string;
  evidence_video_ids: string[];
  created_at: string;
  updated_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method === "GET") {
    try {
      assertConfigured();
      const url = new URL(request.url);

      if (url.searchParams.get("view") === "experiments") {
        return json(await listExecutionExperiments(request));
      }

      return json(await listScoutLedger(request));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue.";
      return json({ error: "list_scout_ledger_failed", message }, 500);
    }
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === "create-experiment") {
      assertConfigured();
      return json(await createExecutionExperiment(body));
    }

    if (body.action === "update-experiment") {
      assertConfigured();
      return json(await updateExecutionExperiment(body));
    }

    const keyword = normalizeKeyword(String(body.keyword ?? ""));

    if (keyword.length < 2) {
      return json({ error: "invalid_keyword", message: "Le mot-cle doit contenir au moins 2 caracteres." }, 400);
    }

    assertConfigured();

    const scan = await createScan(keyword);
    const collection = await collectYouTube(keyword);
    await storeCollection(scan.id, collection);

    const videos = toVideoSummaries(collection);
    const analysis = buildScanAnalysis(keyword, videos);
    await updateScan(scan.id, "completed", null, null);
    await upsertOpportunity(scan.id, keyword, analysis).catch((error) => {
      if (!isMissingOpportunitiesTable(error)) {
        throw error;
      }
    });

    return json({
      scan: {
        ...scan,
        status: "completed",
        updated_at: new Date().toISOString(),
      },
      videos,
      analysis,
      opportunity: buildOpportunityPayload(scan.id, keyword, analysis),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return json({ error: "run_scout_failed", message }, 500);
  }
});

async function listExecutionExperiments(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const experiments = await supabaseFetch<ExecutionExperimentSummary[]>(
    `/rest/v1/execution_experiments?select=id,opportunity_scan_id,keyword,title,decision_label,priority_score,status,outcome,next_action,success_criteria,result_note,evidence_video_ids,created_at,updated_at&order=created_at.desc&limit=${limit}`,
  );

  return { experiments };
}

async function createExecutionExperiment(body: JsonRecord) {
  const scanId = String(body.scan_id ?? "");
  const decisionLabel = String(body.decision_label ?? "TESTER") as ExecutionExperimentSummary["decision_label"];
  const priorityScore = Number(body.priority_score ?? 0);

  if (!scanId) {
    throw new Error("scan_id est requis pour creer un test.");
  }

  const opportunities = await supabaseFetch<OpportunitySummary[]>(
    `/rest/v1/opportunities?select=id,scan_id,keyword,title,execution_plan,evidence_video_ids&scan_id=eq.${scanId}&limit=1`,
  );
  const opportunity = opportunities[0];

  if (!opportunity) {
    throw new Error("Opportunite introuvable pour ce scan.");
  }

  const rows = await supabaseFetch<ExecutionExperimentSummary[]>(
    "/rest/v1/execution_experiments?on_conflict=opportunity_scan_id",
    {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        opportunity_scan_id: opportunity.scan_id,
        keyword: opportunity.keyword,
        title: opportunity.title,
        decision_label: decisionLabel,
        priority_score: priorityScore,
        status: "READY",
        outcome: "UNKNOWN",
        next_action: opportunity.execution_plan.first_test,
        success_criteria: opportunity.execution_plan.criteria_go,
        result_note: "",
        evidence_video_ids: opportunity.evidence_video_ids,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return { experiment: rows[0] };
}

async function updateExecutionExperiment(body: JsonRecord) {
  const experimentId = String(body.experiment_id ?? "");
  const status = String(body.status ?? "");
  const outcome = String(body.outcome ?? "UNKNOWN");
  const resultNote = String(body.result_note ?? "").slice(0, 1000);
  const allowedStatuses = new Set(["READY", "RUNNING", "DONE", "PAUSED"]);
  const allowedOutcomes = new Set(["UNKNOWN", "PASSED", "FAILED"]);

  if (!experimentId) {
    throw new Error("experiment_id est requis pour mettre a jour un test.");
  }

  if (!allowedStatuses.has(status)) {
    throw new Error("Statut de test invalide.");
  }

  if (!allowedOutcomes.has(outcome)) {
    throw new Error("Resultat de test invalide.");
  }

  const rows = await supabaseFetch<ExecutionExperimentSummary[]>(
    `/rest/v1/execution_experiments?id=eq.${experimentId}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        outcome,
        result_note: resultNote,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!rows[0]) {
    throw new Error("Test introuvable.");
  }

  return { experiment: rows[0] };
}

async function listScoutLedger(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));
  const opportunities = await supabaseFetch<OpportunitySummary[]>(
    `/rest/v1/opportunities?select=id,scan_id,keyword,title,verdict,model_version,summary,scores,evidence_video_ids,competitor_channels,execution_plan,source,created_at,updated_at&order=created_at.desc&limit=${limit}`,
  );
  const scanIds = opportunities.map((opportunity) => opportunity.scan_id);

  if (scanIds.length === 0) {
    return { opportunities, scans: [], videos_by_scan: {} };
  }

  const scans = await supabaseFetch<JsonRecord[]>(
    `/rest/v1/scans?select=id,platform,keyword,status,error_code,error_message,created_at,updated_at&id=in.(${scanIds.join(",")})`,
  );
  const scanVideos = await supabaseFetch<JsonRecord[]>(
    `/rest/v1/scan_videos?select=scan_id,rank,video_id,youtube_videos(title,channel_id,view_count,like_count,comment_count,published_at,thumbnail_url,youtube_channels(title))&scan_id=in.(${scanIds.join(",")})&order=rank.asc`,
  );
  const videosByScan: Record<string, ScanVideoSummary[]> = {};

  scanVideos.forEach((item) => {
    const scanId = String(item.scan_id);
    const video = item.youtube_videos as JsonRecord | undefined;
    const channel = video?.youtube_channels as JsonRecord | undefined;
    const summary = {
      rank: Number(item.rank),
      video_id: String(item.video_id),
      title: String(video?.title ?? ""),
      channel_id: String(video?.channel_id ?? ""),
      channel_title: String(channel?.title ?? ""),
      view_count: optionalNumber(video?.view_count),
      like_count: optionalNumber(video?.like_count),
      comment_count: optionalNumber(video?.comment_count),
      published_at: optionalString(video?.published_at),
      thumbnail_url: optionalString(video?.thumbnail_url),
    };

    videosByScan[scanId] = [...(videosByScan[scanId] ?? []), summary];
  });

  return {
    opportunities,
    scans,
    videos_by_scan: videosByScan,
  };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function assertConfigured() {
  if (!youtubeApiKey) {
    throw new Error("YOUTUBE_API_KEY manque dans les secrets Supabase.");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manque dans les secrets Supabase.");
  }
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().replace(/\s+/g, " ");
}

async function createScan(keyword: string) {
  const rows = await supabaseFetch<JsonRecord[]>("/rest/v1/scans", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ platform: "youtube", keyword, status: "running" }),
  });

  return rows[0] as {
    id: string;
    platform: "youtube";
    keyword: string;
    status: string;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
}

async function updateScan(
  scanId: string,
  status: "completed" | "failed",
  errorCode: string | null,
  errorMessage: string | null,
) {
  await supabaseFetch(`/rest/v1/scans?id=eq.${scanId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      error_code: errorCode,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function collectYouTube(keyword: string) {
  const searchPayload = await youtubeFetch("/search", {
    part: "snippet",
    q: keyword,
    type: "video",
    order: "relevance",
    maxResults: "5",
  });
  const ranks = extractVideoRanks(searchPayload);
  const videoIds = Object.keys(ranks);

  if (videoIds.length === 0) {
    return { channels: [], videos: [], ranks };
  }

  const videosPayload = await youtubeFetch("/videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
  });
  const videos = (videosPayload.items as JsonRecord[] | undefined ?? []).map(toYouTubeVideo);
  const channelIds = [...new Set(videos.map((video) => video.channel_id))];
  const channelsPayload = await youtubeFetch("/channels", {
    part: "snippet,statistics",
    id: channelIds.join(","),
  });
  const channels = (channelsPayload.items as JsonRecord[] | undefined ?? []).map(toYouTubeChannel);

  return { channels, videos, ranks };
}

async function youtubeFetch(path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3${path}`);
  Object.entries({ ...params, key: youtubeApiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = (payload as { error?: { message?: string } }).error;
    throw new Error(error?.message ?? `YouTube a repondu avec le statut ${response.status}.`);
  }

  return payload as JsonRecord;
}

function extractVideoRanks(payload: JsonRecord) {
  const ranks: Record<string, number> = {};
  const items = payload.items as JsonRecord[] | undefined ?? [];

  items.forEach((item, index) => {
    const itemId = item.id as JsonRecord | undefined;
    const videoId = itemId?.videoId;

    if (typeof videoId === "string") {
      ranks[videoId] = index + 1;
    }
  });

  return ranks;
}

function toYouTubeVideo(item: JsonRecord): YouTubeVideo {
  const snippet = item.snippet as JsonRecord | undefined ?? {};
  const statistics = item.statistics as JsonRecord | undefined ?? {};
  const contentDetails = item.contentDetails as JsonRecord | undefined ?? {};

  return {
    id: String(item.id),
    channel_id: String(snippet.channelId ?? ""),
    title: String(snippet.title ?? ""),
    description: String(snippet.description ?? ""),
    published_at: optionalString(snippet.publishedAt),
    duration: optionalString(contentDetails.duration),
    view_count: optionalNumber(statistics.viewCount),
    like_count: optionalNumber(statistics.likeCount),
    comment_count: optionalNumber(statistics.commentCount),
    thumbnail_url: bestThumbnailUrl(snippet),
    raw: item,
  };
}

function toYouTubeChannel(item: JsonRecord): YouTubeChannel {
  const snippet = item.snippet as JsonRecord | undefined ?? {};
  const statistics = item.statistics as JsonRecord | undefined ?? {};

  return {
    id: String(item.id),
    title: String(snippet.title ?? ""),
    description: String(snippet.description ?? ""),
    published_at: optionalString(snippet.publishedAt),
    subscriber_count: optionalNumber(statistics.subscriberCount),
    video_count: optionalNumber(statistics.videoCount),
    view_count: optionalNumber(statistics.viewCount),
    thumbnail_url: bestThumbnailUrl(snippet),
    raw: item,
  };
}

function optionalString(value: unknown) {
  return value === undefined || value === null ? null : String(value);
}

function optionalNumber(value: unknown) {
  return value === undefined || value === null ? null : Number(value);
}

function bestThumbnailUrl(snippet: JsonRecord) {
  const thumbnails = snippet.thumbnails as Record<string, { url?: string }> | undefined;

  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails?.[key]?.url;

    if (typeof url === "string") {
      return url;
    }
  }

  return null;
}

async function storeCollection(
  scanId: string,
  collection: {
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
    ranks: Record<string, number>;
  },
) {
  if (collection.channels.length > 0) {
    await supabaseFetch("/rest/v1/youtube_channels?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(collection.channels),
    });
  }

  if (collection.videos.length > 0) {
    await supabaseFetch("/rest/v1/youtube_videos?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(collection.videos),
    });

    await supabaseFetch("/rest/v1/scan_videos?on_conflict=scan_id,video_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(
        collection.videos.map((video) => ({
          scan_id: scanId,
          video_id: video.id,
          rank: collection.ranks[video.id],
        })),
      ),
    });
  }
}

function toVideoSummaries(
  collection: {
    channels: YouTubeChannel[];
    videos: YouTubeVideo[];
    ranks: Record<string, number>;
  },
): ScanVideoSummary[] {
  const channelTitles = new Map(collection.channels.map((channel) => [channel.id, channel.title]));

  return collection.videos
    .map((video) => ({
      rank: collection.ranks[video.id],
      video_id: video.id,
      title: video.title,
      channel_id: video.channel_id,
      channel_title: channelTitles.get(video.channel_id) ?? "",
      view_count: video.view_count,
      like_count: video.like_count,
      comment_count: video.comment_count,
      published_at: video.published_at,
      thumbnail_url: video.thumbnail_url,
    }))
    .sort((left, right) => left.rank - right.rank);
}

function buildScanAnalysis(keyword: string, videos: ScanVideoSummary[]): ScanAnalysis {
  const totalViews = videos.reduce((total, video) => total + (video.view_count ?? 0), 0);
  const averageViews = videos.length > 0 ? totalViews / videos.length : 0;
  const competitorChannels = [...new Set(videos.map((video) => video.channel_title || video.channel_id))].sort();
  const lowViewCount = videos.filter((video) => (video.view_count ?? 0) < 30000).length;
  const highViewCount = videos.filter((video) => (video.view_count ?? 0) >= 50000).length;

  const scores = {
    money_score: clampScore(48 + safeLog10(totalViews) * 10),
    attack_score: clampScore(45 + lowViewCount * 9 + competitorChannels.length * 3),
    speed_cash_score: clampScore(42 + highViewCount * 13 + videos.length * 2),
    quality_gap_score: clampScore(35 + lowViewCount * 14),
    weak_competitor_score: clampScore(30 + lowViewCount * 12 + (competitorChannels.length >= 4 ? 10 : 0)),
    upload_pressure_score: clampScore(55 + videos.length * 5 - lowViewCount * 3),
    ecosystem_score: clampScore(40 + competitorChannels.length * 8 + highViewCount * 7),
    confidence: clampScore(35 + videos.length * 8 + competitorChannels.length * 4),
  };
  let verdict: "GO" | "WATCH" | "SKIP" = "WATCH";

  if (scores.money_score >= 70 && scores.attack_score >= 65 && scores.confidence >= 55) {
    verdict = "GO";
  } else if (scores.money_score < 50 || scores.confidence < 40) {
    verdict = "SKIP";
  }

  return {
    model_version: "edge-business-heuristic-v0.2",
    opportunity_title: inferOpportunityTitle(keyword, videos),
    verdict,
    scores,
    summary: `${Math.round(averageViews).toLocaleString("fr-FR")} vues moyennes sur ${videos.length} vidéos, ${competitorChannels.length} chaînes observées, ${lowViewCount} quality gaps.`,
    evidence_video_ids: videos.slice(0, 3).map((video) => video.video_id),
    competitor_channels: competitorChannels,
  };
}

function inferOpportunityTitle(keyword: string, videos: ScanVideoSummary[]) {
  const haystack = [keyword, ...videos.map((video) => video.title)].join(" ").toLowerCase();

  if (hasAny(haystack, ["music", "song", "suno", "udio", "ai music", "musique"])) {
    return "Chaîne musicale IA monétisable";
  }

  if (hasAny(haystack, ["faceless", "story", "stories", "narration", "reddit", "histoire"])) {
    return "Chaîne faceless stories automatisable";
  }

  if (hasAny(haystack, ["drama", "mini drama", "series", "romance", "revenge", "vertical"])) {
    return "Mini-drama IA vertical court";
  }

  if (hasAny(haystack, ["business", "money", "finance", "monetization", "cash", "income"])) {
    return "Shorts business faceless";
  }

  if (hasAny(haystack, ["reels", "shorts", "tiktok", "viral"])) {
    return "Format court viral automatisable";
  }

  return `${toTitleCase(keyword)} · niche contenu automatisable`;
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeLog10(value: number) {
  return value > 0 ? Math.log10(value) : 0;
}

function buildExecutionPlan(keyword: string, analysis: ScanAnalysis) {
  if (analysis.verdict === "GO") {
    if (analysis.opportunity_title === "Chaîne musicale IA monétisable") {
      return {
        angle: "Chaîne musicale IA faceless orientée playlists et émotions",
        first_test: `Publier 7 morceaux courts autour de ${keyword} avec visuels cohérents`,
        criteria_go: "Un morceau dépasse le benchmark de vues initial en 72h",
        notes: "Tester style musical, niche émotionnelle, miniature et boucle Shorts.",
      };
    }

    if (analysis.opportunity_title === "Chaîne faceless stories automatisable") {
      return {
        angle: "Stories faceless à tension immédiate",
        first_test: `Produire 5 histoires courtes autour de ${keyword} sur 7 jours`,
        criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
        notes: "Optimiser hook narratif, payoff rapide et continuité entre épisodes.",
      };
    }

    return {
      angle: "Série verticale IA sur tension dramatique courte",
      first_test: `Lancer 5 épisodes courts autour de ${keyword} sur 7 jours`,
      criteria_go: "Un épisode dépasse le benchmark de vues initial en 48h",
      notes: "Accélérer le hook, garder des formats courts, pousser le volume d'itérations.",
    };
  }

  if (analysis.verdict === "WATCH") {
    return {
      angle: `Observer et resserrer: ${analysis.opportunity_title}`,
      first_test: `Tester 3 hooks et 2 formulations de ${keyword}`,
      criteria_go: "Le score money et le score attack montent au-dessus de 70",
      notes: "Le marché est intéressant mais la préparation doit être affinée.",
    };
  }

  return {
    angle: "Retirer cette piste du plan actif",
    first_test: `Conserver ${keyword} uniquement pour veille`,
    criteria_go: "Réouverture si la concurrence baisse ou si les signaux montent",
    notes: "Ne pas investir de temps de production pour l'instant.",
  };
}

function buildOpportunityPayload(scanId: string, keyword: string, analysis: ScanAnalysis) {
  return {
    scan_id: scanId,
    keyword,
    title: analysis.opportunity_title,
    verdict: analysis.verdict,
    model_version: analysis.model_version,
    summary: analysis.summary,
    scores: analysis.scores,
    evidence_video_ids: analysis.evidence_video_ids,
    competitor_channels: analysis.competitor_channels,
    execution_plan: buildExecutionPlan(keyword, analysis),
    source: "edge-run-scout",
  };
}

async function upsertOpportunity(scanId: string, keyword: string, analysis: ScanAnalysis) {
  await supabaseFetch("/rest/v1/opportunities?on_conflict=scan_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(buildOpportunityPayload(scanId, keyword, analysis)),
  });
}

async function supabaseFetch<T = unknown>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      typeof payload?.message === "string"
        ? payload.message
        : `Supabase a repondu avec le statut ${response.status}.`,
    );
    Object.assign(error, { status: response.status, payload });
    throw error;
  }

  return payload as T;
}

function isMissingOpportunitiesTable(error: unknown) {
  const payload = (error as { payload?: { code?: string } }).payload;
  return payload?.code === "PGRST205";
}
