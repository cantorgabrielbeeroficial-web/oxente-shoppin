import { useState } from "react";
import { ChevronRight, Search, Sparkles, ThumbsUp, Play, Star } from "lucide-react";

export type ProductReview = {
  id: string;
  user: string;
  rating: number;
  variation?: string;
  text: string;
  helpful: number;
  media: { url: string; video?: boolean }[];
};

export type ReviewsSummary = {
  average: number;
  countLabel: string;
  highlights: { label: string; text: string }[];
  media: { url: string; video?: boolean }[];
  extraMedia: number;
  reviews: ProductReview[];
};

function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= Math.round(value) ? "fill-primary text-primary" : "text-border"}`}
        />
      ))}
    </span>
  );
}

function Thumb({ url, video, extra }: { url: string; video?: boolean; extra?: number }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      {video && !extra && (
        <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
          <Play className="h-3 w-3 fill-white" />
        </span>
      )}
      {extra ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export function ProductReviews({ summary }: { summary: ReviewsSummary | null }) {
  const [query, setQuery] = useState("");

  if (!summary) {
    return (
      <section className="mt-4 border-b border-border pb-4">
        <h2 className="text-sm font-semibold text-card-foreground">Avaliações do produto</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ainda ninguém avaliou esse produto, visse? Seja o primeiro a dar o papo!
        </p>
      </section>
    );
  }

  const reviews = summary.reviews.filter((r) =>
    `${r.text} ${r.user} ${r.variation ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section className="mt-4 border-b border-border pb-4">
      <button type="button" className="flex w-full items-center gap-1.5 text-left">
        <span className="text-base font-bold text-card-foreground">
          {summary.average.toFixed(1)}
        </span>
        <Star className="h-4 w-4 fill-primary text-primary" />
        <span className="text-sm font-semibold text-card-foreground">Avaliações do produto</span>
        <span className="text-sm text-muted-foreground">({summary.countLabel})</span>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </button>

      <div className="mt-3 rounded-lg bg-muted/60 p-3">
        <p className="flex items-center gap-1 text-sm font-semibold text-card-foreground">
          Resumo das avaliações <Sparkles className="h-3.5 w-3.5 text-primary" />
        </p>
        <ul className="mt-2 space-y-1 text-[13px] text-card-foreground">
          {summary.highlights.map((h) => (
            <li key={h.label} className="flex gap-1.5">
              <span>•</span>
              <span>
                <b>{h.label}:</b> {h.text}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {summary.media.slice(0, 3).map((m, i, arr) => (
            <Thumb
              key={m.url + i}
              url={m.url}
              video={m.video}
              extra={i === arr.length - 1 ? summary.extraMedia : undefined}
            />
          ))}
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por palavras nas outras avaliações"
          className="w-full bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-4 space-y-5">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma avaliação com essa palavra, oxente.
          </p>
        )}
        {reviews.map((r) => (
          <article key={r.id}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold uppercase text-primary">
                {r.user[0]}
              </span>
              <span className="text-xs text-muted-foreground">{r.user}</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                Útil ({r.helpful}) <ThumbsUp className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-1.5">
              <Stars value={r.rating} />
            </div>
            {r.variation && (
              <p className="mt-1 text-xs text-muted-foreground">Variação: {r.variation}</p>
            )}
            <p className="mt-1 text-sm text-card-foreground">{r.text}</p>
            {r.media.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {r.media.slice(0, 3).map((m, i) => (
                  <Thumb key={m.url + i} url={m.url} video={m.video} />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <button type="button" className="mt-4 block w-full text-center text-sm text-muted-foreground">
        Ver tudo
      </button>
    </section>
  );
}
