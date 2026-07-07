import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import {
  createScan,
  listScans,
  listScanVideos,
  type ScanSummary,
} from "../features/scans/api";
import { getSystemStatus } from "../features/system/api";
import { ApiError } from "../lib/api";
import "./app.css";

const principles = [
  "Données réelles et traçables",
  "Scores explicables et versionnés",
  "Décision humaine conservée",
  "Aucun fallback simulé silencieux",
];

const verifiedVideos = [
  {
    rank: 1,
    videoId: "L48-pHflCnk",
    title: "I Made a Netflix-Level Drama Series in 24 HOURS Using ONLY AI!",
    channelTitle: "AI Money Maniac",
    viewCount: 19863,
    thumbnailUrl: "https://i.ytimg.com/vi/L48-pHflCnk/maxresdefault.jpg",
  },
  {
    rank: 2,
    videoId: "ZXoLeZqhaWI",
    title: "Contratada para salvar a su hijo, no imaginó que su jefe frío era el hombre de aquella noche.#movie",
    channelTitle: "Mini drama de IA",
    viewCount: 67960,
    thumbnailUrl: "https://i.ytimg.com/vi/ZXoLeZqhaWI/maxresdefault.jpg",
  },
  {
    rank: 3,
    videoId: "EZoU1JYB-n4",
    title: "D’un doigt, elle arrête la voiture d’un PDG et lui sauve la vie… il tombe amoureux aussitôt !",
    channelTitle: "L-Mini Drama",
    viewCount: 27274,
    thumbnailUrl: "https://i.ytimg.com/vi/EZoU1JYB-n4/maxresdefault.jpg",
  },
  {
    rank: 4,
    videoId: "2_pGuvUbNUc",
    title: "Mon Visage Volé par l'IA : Ma Revanche en Direct | Mini-Drama Chinois#MiniDrama #DramaChinois",
    channelTitle: "Dramas IA",
    viewCount: 6,
    thumbnailUrl: "https://i.ytimg.com/vi/2_pGuvUbNUc/maxresdefault.jpg",
  },
  {
    rank: 5,
    videoId: "QGUS4TPNn3c",
    title: "Bloquée à la banque pendant son retrait,l ne sait pas qu’elle est reine de la mafia,un pied le calme",
    channelTitle: "MiniDrama FR",
    viewCount: 133347,
    thumbnailUrl: "https://i.ytimg.com/vi/QGUS4TPNn3c/maxresdefault.jpg",
  },
];

function ApiStatus() {
  const statusQuery = useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    retry: false,
    refetchInterval: 30_000,
  });

  if (statusQuery.isPending) {
    return <span className="status status--pending">API : vérification…</span>;
  }

  if (statusQuery.isError) {
    return (
      <span className="status status--error">
        API indisponible — démarrez le backend
      </span>
    );
  }

  return (
    <span className="status status--success">
      API opérationnelle · {statusQuery.data.environment}
    </span>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Une erreur inconnue est survenue.";
}

function formatScanDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMetric(value: number | null) {
  if (value === null) {
    return "n.c.";
  }

  return new Intl.NumberFormat("fr-FR", {
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

function ScanStatusBadge({ status }: { status: ScanSummary["status"] }) {
  const labelByStatus: Record<ScanSummary["status"], string> = {
    queued: "En file",
    running: "En cours",
    cancel_requested: "Arrêt demandé",
    cancelled: "Annulé",
    completed: "Terminé",
    failed: "Échec",
  };

  return <span className={`status status--${status}`}>{labelByStatus[status]}</span>;
}

function ScanVideos({ scan }: { scan: ScanSummary }) {
  const videosQuery = useQuery({
    queryKey: ["scan-videos", scan.id],
    queryFn: () => listScanVideos(scan.id),
    enabled: scan.status === "completed",
    retry: false,
  });

  if (scan.status !== "completed") {
    return null;
  }

  if (videosQuery.isPending) {
    return <p className="panel-empty">Chargement des vidéos collectées...</p>;
  }

  if (videosQuery.isError) {
    return (
      <p className="panel-error">
        {getErrorMessage(videosQuery.error)}
      </p>
    );
  }

  if (videosQuery.data.videos.length === 0) {
    return <p className="panel-empty">Aucune vidéo collectée pour ce scan.</p>;
  }

  return (
    <div className="video-results">
      {videosQuery.data.videos.map((video) => (
        <a
          className="video-result"
          href={`https://www.youtube.com/watch?v=${video.video_id}`}
          key={video.video_id}
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
              {video.channel_title || video.channel_id} · {formatMetric(video.view_count)} vues
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

function ScoutPanel() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");

  const scansQuery = useQuery({
    queryKey: ["scout-scans"],
    queryFn: listScans,
    retry: false,
    refetchInterval: 30_000,
  });

  const createScanMutation = useMutation({
    mutationFn: createScan,
    onSuccess: async () => {
      setKeyword("");
      await queryClient.invalidateQueries({ queryKey: ["scout-scans"] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedKeyword = keyword.trim().replace(/\s+/g, " ");

    if (normalizedKeyword.length < 2 || createScanMutation.isPending) {
      return;
    }

    createScanMutation.mutate(normalizedKeyword);
  }

  return (
    <section aria-labelledby="scout-runtime">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Scout V1</p>
          <h2 id="scout-runtime">Premier scan réel</h2>
        </div>
        <span className="phase">Phase 1</span>
      </div>

      <form className="scan-form" onSubmit={handleSubmit}>
        <label className="scan-form__field">
          <span>Mot-clé</span>
          <input
            name="keyword"
            type="text"
            placeholder="Ex. mini drama ia"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            minLength={2}
            maxLength={120}
          />
        </label>
        <button
          className="scan-form__submit"
          type="submit"
          disabled={keyword.trim().length < 2 || createScanMutation.isPending}
        >
          {createScanMutation.isPending ? "Création..." : "Créer un scan"}
        </button>
      </form>

      {createScanMutation.isError ? (
        <p className="panel-error">{getErrorMessage(createScanMutation.error)}</p>
      ) : null}

      {scansQuery.isPending ? <p className="panel-empty">Chargement des scans...</p> : null}
      {scansQuery.isError ? (
        <p className="panel-error">{getErrorMessage(scansQuery.error)}</p>
      ) : null}
      {scansQuery.data && scansQuery.data.scans.length === 0 ? (
        <p className="panel-empty">Aucun scan enregistré pour le moment.</p>
      ) : null}
      {scansQuery.data && scansQuery.data.scans.length > 0 ? (
        <div className="scan-list">
          {scansQuery.data.scans.map((scan) => (
            <article className="scan-card" key={scan.id}>
              <div className="scan-card__header">
                <div>
                  <p className="eyebrow">YouTube</p>
                  <h3>{scan.keyword}</h3>
                </div>
                <ScanStatusBadge status={scan.status} />
              </div>
              <p className="scan-card__meta">Créé le {formatScanDate(scan.created_at)}</p>
              {scan.error_message ? (
                <p className="scan-card__error">{scan.error_message}</p>
              ) : (
                <p className="scan-card__meta">Aucune erreur remontée.</p>
              )}
              <ScanVideos scan={scan} />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function VerifiedSnapshot() {
  return (
    <section aria-labelledby="verified-snapshot">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Collecte vérifiée</p>
          <h2 id="verified-snapshot">Résultat réel du scan “mini drama ia”</h2>
        </div>
        <span className="phase">Supabase + YouTube</span>
      </div>

      <div className="snapshot">
        <p>
          Aperçu statique issu du scan réel `ee79c511-d1cf-4385-94a6-d19057d6deda`,
          collecté via le worker YouTube. Ce bloc n’est pas une simulation et reste
          visible même si l’API locale n’est pas accessible depuis GitHub Pages.
        </p>
        <div className="video-results">
          {verifiedVideos.map((video) => (
            <a
              className="video-result"
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              key={video.videoId}
              rel="noreferrer"
              target="_blank"
            >
              <img alt="" src={video.thumbnailUrl} />
              <span className="video-result__body">
                <span className="video-result__rank">#{video.rank}</span>
                <span className="video-result__title">{video.title}</span>
                <span className="video-result__meta">
                  {video.channelTitle} · {formatMetric(video.viewCount)} vues
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <main className="shell">
      <header className="header">
        <div>
          <p className="eyebrow">Fondation V1</p>
          <h1>IA Agent Tool</h1>
          <p className="subtitle">
            Détecter, expliquer et décider quelles opportunités YouTube méritent
            un test réel.
          </p>
        </div>
        <ApiStatus />
      </header>

      <section className="focus" aria-labelledby="active-scope">
        <div>
          <p className="eyebrow">Périmètre actif</p>
          <h2 id="active-scope">Scout → Analyste → Décision humaine</h2>
        </div>
        <p>
          Le Producteur et l’automatisation de publication restent hors V1
          jusqu’à validation de la qualité des opportunités.
        </p>
      </section>

      <ScoutPanel />

      <VerifiedSnapshot />

      <section aria-labelledby="principles">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contrat produit</p>
            <h2 id="principles">Principes non négociables</h2>
          </div>
          <span className="phase">Phase 0</span>
        </div>

        <div className="principles">
          {principles.map((principle, index) => (
            <article className="principle" key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{principle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="next-step" aria-labelledby="next-step">
        <div>
          <p className="eyebrow">Prochaine tranche</p>
          <h2 id="next-step">Un scan réel, de bout en bout</h2>
        </div>
        <p>
          Créer un scan à un mot-clé, appeler YouTube côté worker, enregistrer
          une vidéo et une chaîne, puis afficher le résultat sans simulation.
        </p>
      </section>
    </main>
  );
}
