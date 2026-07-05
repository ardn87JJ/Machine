import { useQuery } from "@tanstack/react-query";
import { getSystemStatus } from "../features/system/api";
import "./app.css";

const principles = [
  "Données réelles et traçables",
  "Scores explicables et versionnés",
  "Décision humaine conservée",
  "Aucun fallback simulé silencieux",
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
