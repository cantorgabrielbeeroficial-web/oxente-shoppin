import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  Store as StoreIcon,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listCategories } from "@/lib/catalog.functions";
import {
  getMyStore,
  listMyProducts,
  listMyStoreOrders,
  toggleMyProduct,
  updateMyStore,
  upsertMyProduct,
  deleteMyProduct,
} from "@/lib/seller.functions";
import type { SellerProduct, SellerStore } from "@/lib/types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS, formatBRL, formatDateBR } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da loja — Oxente" },
      {
        name: "description",
        content:
          "Personalize sua vitrine, gerencie produtos e acompanhe os pedidos da sua loja no Oxente.",
      },
      { property: "og:title", content: "Painel da loja — Oxente" },
      {
        property: "og:description",
        content: "Central do vendedor Oxente: vitrine, produtos e pedidos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellerDashboard,
});

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

async function uploadStoreAsset(storeId: string, kind: "logo" | "banner" | "product", file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${storeId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("store-assets")
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data, error: signError } = await supabase.storage
    .from("store-assets")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data) throw new Error(signError?.message ?? "Falha ao gerar link da imagem.");
  return data.signedUrl;
}

function SellerDashboard() {
  const navigate = useNavigate();
  const fetchStore = useServerFn(getMyStore);
  const { data: store, isLoading } = useQuery({ queryKey: ["my-store"], queryFn: fetchStore });

  useEffect(() => {
    if (!isLoading && store === null) navigate({ to: "/vender", replace: true });
  }, [isLoading, store, navigate]);

  if (isLoading || !store) {
    return (
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando painel...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Central do Vendedor</h1>
          <p className="text-sm text-muted-foreground">
            Sua loja <strong>{store.name}</strong> já está no ar.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/loja/$slug" params={{ slug: store.slug }}>
            Ver minha vitrine
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="loja" className="mt-6">
        <TabsList>
          <TabsTrigger value="loja">Minha loja</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="loja" className="mt-4">
          <StoreSettings store={store} />
        </TabsContent>
        <TabsContent value="produtos" className="mt-4">
          <ProductsPanel storeId={store.id} />
        </TabsContent>
        <TabsContent value="pedidos" className="mt-4">
          <OrdersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StoreSettings({ store }: { store: SellerStore }) {
  const queryClient = useQueryClient();
  const saveStore = useServerFn(updateMyStore);
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (input: {
      name?: string;
      description?: string;
      logo_url?: string;
      banner_url?: string;
    }) => saveStore({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Vitrine atualizada!");
    },
    onError: () => toast.error("Não foi possível salvar as alterações."),
  });

  async function handleAsset(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadStoreAsset(store.id, kind, file);
      await mutation.mutateAsync(kind === "logo" ? { logo_url: url } : { banner_url: url });
    } catch {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative h-40 w-full bg-sertao-gradient">
          {store.banner_url && (
            <img src={store.banner_url} alt="Capa da loja" className="h-full w-full object-cover" />
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-3 right-3"
            disabled={uploading === "banner"}
            onClick={() => bannerInput.current?.click()}
          >
            {uploading === "banner" ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1 h-4 w-4" />
            )}
            Trocar capa
          </Button>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleAsset("banner", event.target.files?.[0])}
          />
        </div>
        <div className="flex items-center gap-4 p-5">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
              <StoreIcon className="h-7 w-7" />
            </span>
          )}
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading === "logo"}
              onClick={() => logoInput.current?.click()}
            >
              {uploading === "logo" ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-1 h-4 w-4" />
              )}
              Trocar logo
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              Imagem quadrada, aparece na vitrine e nos produtos.
            </p>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAsset("logo", event.target.files?.[0])}
            />
          </div>
        </div>
      </section>

      <form
        className="space-y-4 rounded-lg border border-border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ name, description });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="store-name">Nome da loja</Label>
          <Input
            id="store-name"
            value={name}
            maxLength={80}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="store-desc">Descrição da loja</Label>
          <Textarea
            id="store-desc"
            rows={4}
            maxLength={600}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  description: "",
  price: "",
  stock: "1",
  category_id: "",
  image_url: null as string | null,
  images: [] as string[],
  active: true,
  weight_kg: "0",
  height_cm: "0",
  width_cm: "0",
  length_cm: "0",
  variations: [] as { name: string; options: string[] }[],
};

function ProductsPanel({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listMyProducts);
  const fetchCategories = useServerFn(listCategories);
  const saveProduct = useServerFn(upsertMyProduct);
  const toggleProduct = useServerFn(toggleMyProduct);
  const deleteProduct = useServerFn(deleteMyProduct);

  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({ queryKey: ["my-products"], queryFn: fetchProducts });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories({}),
  });

  const save = useMutation({
    mutationFn: () =>
      saveProduct({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name,
          description: form.description,
          price: Number(form.price.replace(",", ".")),
          stock: Number(form.stock),
          category_id: form.category_id || null,
          image_url: form.image_url,
          images: form.images,
          active: form.active,
          weight_kg: Number(form.weight_kg.replace(",", ".")),
          height_cm: Number(form.height_cm.replace(",", ".")),
          width_cm: Number(form.width_cm.replace(",", ".")),
          length_cm: Number(form.length_cm.replace(",", ".")),
          variations: form.variations,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      setForm(emptyForm);
      setIsSheetOpen(false);
      toast.success("Produto salvo com sucesso!");
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar o produto."),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => toggleProduct({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-products"] }),
    onError: () => toast.error("Não foi possível atualizar o produto."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      toast.success("Produto excluído.");
    },
    onError: () => toast.error("Não foi possível excluir o produto."),
  });

  function editProduct(product: SellerProduct) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id ?? "",
      image_url: product.image_url,
      images: product.images ?? [],
      active: product.active,
      weight_kg: String(product.weight_kg),
      height_cm: String(product.height_cm),
      width_cm: String(product.width_cm),
      length_cm: String(product.length_cm),
      variations: product.variations ?? [],
    });
    setIsSheetOpen(true);
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error("Selecione uma imagem ou vídeo válido.");
        return;
      }
      if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
        toast.error("O vídeo deve ter no máximo 50 MB.");
        return;
      }
      const url = await uploadStoreAsset(storeId, "product", file);
      setForm((prev) => ({
        ...prev,
        image_url: prev.image_url || url,
        images: [...prev.images, url],
      }));
    } catch {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Meus Produtos</h2>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setIsSheetOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Produto
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{form.id ? "Editar Produto" : "Novo Produto"}</SheetTitle>
            <SheetDescription>
              Preencha as informações do produto. O produto ficará visível instantaneamente.
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-6 space-y-6 pb-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.image_url) {
                toast.error("Adicione pelo menos uma imagem ou vídeo.");
                return;
              }
              save.mutate();
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Título do produto</Label>
                <Input
                  id="p-name"
                  required
                  placeholder="Ex: Chapéu de Couro Artesanal"
                  maxLength={140}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-desc">Descrição detalhada</Label>
                <Textarea
                  id="p-desc"
                  rows={4}
                  placeholder="Conte a história do seu artesanato..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-price">Preço de venda (R$)</Label>
                  <Input
                    id="p-price"
                    required
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-stock">Qtd. em estoque</Label>
                  <Input
                    id="p-stock"
                    required
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Logística e Dimensões (Frete)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="p-weight">Peso (kg)</Label>
                    <Input
                      id="p-weight"
                      placeholder="0.500"
                      value={form.weight_kg}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight_kg: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-height">Altura (cm)</Label>
                    <Input
                      id="p-height"
                      placeholder="10"
                      value={form.height_cm}
                      onChange={(e) => setForm((prev) => ({ ...prev, height_cm: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-width">Largura (cm)</Label>
                    <Input
                      id="p-width"
                      placeholder="20"
                      value={form.width_cm}
                      onChange={(e) => setForm((prev) => ({ ...prev, width_cm: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-length">Comprimento (cm)</Label>
                    <Input
                      id="p-length"
                      placeholder="30"
                      value={form.length_cm}
                      onChange={(e) => setForm((prev) => ({ ...prev, length_cm: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Variações (Opcional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        variations: [...prev.variations, { name: "", options: [] }],
                      }))
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Atributo
                  </Button>
                </div>
                {form.variations.map((v, vIdx) => (
                  <div key={vIdx} className="space-y-2 rounded-md bg-muted/30 p-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Tamanho"
                        className="h-8 text-xs"
                        value={v.name}
                        onChange={(e) => {
                          const newV = [...form.variations];
                          if (newV[vIdx]) {
                            newV[vIdx] = { ...newV[vIdx], name: e.target.value };
                            setForm((prev) => ({ ...prev, variations: newV }));
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          const newV = form.variations.filter((_, i) => i !== vIdx);
                          setForm((prev) => ({ ...prev, variations: newV }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="Opções separadas por vírgula (P, M, G)"
                        className="h-8 text-xs"
                        value={v.options.join(", ")}
                        onChange={(e) => {
                          const newV = [...form.variations];
                          if (newV[vIdx]) {
                            newV[vIdx] = {
                              ...newV[vIdx],
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setForm((prev) => ({ ...prev, variations: newV }));
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label>Mídias do produto (Máx 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative h-20 w-20 group">
                      {isVideoUrl(url) ? (
                        <video
                          src={url}
                          muted
                          playsInline
                          preload="metadata"
                          className={`h-full w-full rounded-md object-cover border-2 ${url === form.image_url ? "border-primary" : "border-transparent"}`}
                        />
                      ) : (
                        <img
                          src={url}
                          alt=""
                          className={`h-full w-full rounded-md object-cover border-2 ${url === form.image_url ? "border-primary" : "border-transparent"}`}
                        />
                      )}
                      {url === form.image_url && (
                        <Badge className="absolute -top-2 -right-2 scale-75">Capa</Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = form.images.filter((_, i) => i !== idx);
                          setForm((prev) => ({
                            ...prev,
                            images: newImages,
                            image_url:
                              prev.image_url === url ? newImages[0] || null : prev.image_url,
                          }));
                        }}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {url !== form.image_url && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, image_url: url }))}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                        >
                          Definir Capa
                        </button>
                      )}
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => imageInput.current?.click()}
                      className="flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-5 w-5 mb-1" />
                          <span className="text-[10px]">Adicionar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={imageInput}
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="p-active" className="text-sm font-semibold">
                    Publicar instantaneamente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ficará visível para todos os compradores.
                  </p>
                </div>
                <Switch
                  id="p-active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={save.isPending}
              >
                {save.isPending
                  ? "Salvando..."
                  : form.id
                    ? "Salvar Alterações"
                    : "Publicar Produto"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <p className="mt-3 text-muted-foreground">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Preço</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                          {product.image_url ? (
                            isVideoUrl(product.image_url) ? (
                              <video
                                src={product.image_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={product.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBRL(product.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.stock <= 0 ? "destructive" : "secondary"}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.active}
                          onCheckedChange={(checked) =>
                            toggle.mutate({ id: product.id, active: checked })
                          }
                          className="scale-75"
                        />
                        <span
                          className={`text-[10px] uppercase font-bold tracking-tighter ${product.active ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {product.active ? "Ativo" : "Pausado"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => editProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Deseja realmente excluir este produto?")) {
                              remove.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const fetchOrders = useServerFn(listMyStoreOrders);
  const { data: orders = [] } = useQuery({ queryKey: ["my-store-orders"], queryFn: fetchOrders });

  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        Nenhum pedido recebido ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-card-foreground">
                Pedido #{order.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateBR(order.created_at)}</p>
            </div>
            <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.product_name} — {formatBRL(item.unit_price * item.quantity)}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Total: {formatBRL(order.total)}</span>
            <span>Comissão Oxente: {formatBRL(order.platform_fee)}</span>
            <span className="font-semibold text-foreground">
              Seu repasse: {formatBRL(order.seller_net)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
