import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      to="/produto/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          isVideoUrl(product.image_url) ? (
            <video
              src={product.image_url}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Store className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2 sm:p-3">
        <h3 className="line-clamp-2 text-xs sm:text-sm text-card-foreground leading-tight">
          {product.name}
        </h3>
        <p className="mt-auto text-base sm:text-lg font-bold text-primary">
          {formatBRL(product.price)}
        </p>
        <p className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <span className="text-primary">🏪</span>
          <span className="truncate">{product.store.name}</span>
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  emptyMessage = "Nenhum produto encontrado.",
}: {
  products: ProductListItem[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
