import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, RefreshCw } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  active: boolean;
  image_url?: string;
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("products").insert([
      {
        name,
        price: parseFloat(price),
        stock_quantity: parseInt(stock, 10),
        image_url: imageUrl,
        active: true,
      },
    ]);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Produto cadastrado no Oxente Shoppin." });
      setOpenModal(false);
      setName("");
      setPrice("");
      setStock("");
      setImageUrl("");
      fetchProducts();
    }
  };

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    } else {
      fetchProducts();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-orange-600" /> Painel Admin - Produtos
          </h1>
          <p className="text-muted-foreground">Gerencie o estoque e o catálogo da loja</p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Nome do Produto</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Preço (R$)</label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Estoque</label>
                  <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL da Imagem</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                Salvar Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">Carregando catálogo...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">Nenhum produto cadastrado.</TableCell>
              </TableRow>
            ) : (
              products.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                    {item.name}
                  </TableCell>
                  <TableCell>R$ {Number(item.price).toFixed(2)}</TableCell>
                  <TableCell>{item.stock_quantity} un</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleProductActive(item.id, item.active)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> {item.active ? "Desativar" : "Ativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}