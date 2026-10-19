import { Minus, Plus, Store } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  actionLabel: string;
  pending: boolean;
  onConfirm: () => void;
};

function Thumb({
  imageUrl,
  name,
  className,
}: {
  imageUrl: string | null;
  name: string;
  className: string;
}) {
  if (!imageUrl || isVideoUrl(imageUrl)) {
    return (
      <span
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <Store className="h-5 w-5" />
      </span>
    );
  }
  return <img src={imageUrl} alt={name} className={`object-cover ${className}`} />;
}

export function ProductSpecsSheet({
  open,
  onOpenChange,
  name,
  price,
  stock,
  imageUrl,
  quantity,
  onQuantityChange,
  actionLabel,
  pending,
  onConfirm,
}: Props) {
  const soldOut = stock <= 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-2xl border-0 p-0 sm:mx-auto sm:max-w-md"
      >
        <SheetTitle className="sr-only">Escolha as opções de {name}</SheetTitle>
        <SheetDescription className="sr-only">
          Selecione a opção e a quantidade antes de finalizar a compra.
        </SheetDescription>

        <div className="flex gap-4 border-b border-border p-4 pr-12">
          <Thumb
            imageUrl={imageUrl}
            name={name}
            className="h-28 w-28 shrink-0 rounded-lg border border-border"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="text-3xl font-extrabold leading-none text-primary">{formatBRL(price)}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{name}</p>
            <p className="text-sm font-bold text-primary">Oferta arretada da Oxente</p>
            <p className="text-base text-muted-foreground">Estoque: {stock}</p>
          </div>
        </div>

        <div className="border-b border-border p-4">
          <p className="text-sm text-card-foreground">Opção:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed="true"
              className="flex max-w-full items-center gap-2 rounded-md border border-primary bg-primary/5 p-1.5 pr-3 text-sm text-primary"
            >
              <Thumb imageUrl={imageUrl} name={name} className="h-9 w-9 shrink-0 rounded" />
              <span className="truncate">Modelo único</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-4">
          <span className="text-base text-card-foreground">Quantidade</span>
          <div className="flex items-center overflow-hidden rounded-md border border-border">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex h-9 w-12 items-center justify-center border-x border-border text-sm text-primary">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={quantity >= stock}
              onClick={() => onQuantityChange(Math.min(stock, quantity + 1))}
              className="flex h-9 w-9 items-center justify-center text-card-foreground disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-border p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <button
            type="button"
            disabled={soldOut || pending}
            onClick={onConfirm}
            className="h-12 w-full rounded-lg bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-60"
          >
            {soldOut ? "Esgotado" : pending ? "Um instante, visse..." : actionLabel}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
