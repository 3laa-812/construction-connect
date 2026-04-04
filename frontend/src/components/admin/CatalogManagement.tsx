import { useState, useMemo } from "react";
import { Plus, Package, FolderTree, Edit2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  parentId: string | null;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  base_price: string | number;
}

interface NewProductForm {
  name: string;
  unit: string;
  base_price: number | "";
  category: string;
  description: string;
}

const UNITS = ["Ton", "KG", "Piece", "M3", "Bag", "Roll", "SQM", "M", "Box", "L", "Gallon"];

export function CatalogManagement() {
  const queryClient = useQueryClient();
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [form, setForm] = useState<NewProductForm>({
    name: "",
    unit: "Ton",
    base_price: "",
    category: "",
    description: "",
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => (await api.get("/admin/categories")).data,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["admin-products", selectedCatId],
    queryFn: async () => (await api.get("/materials", { params: selectedCatId ? { category: selectedCatId } : {} })).data,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: NewProductForm) =>
      (await api.post("/materials", {
        name: data.name,
        unit: data.unit,
        base_price: Number(data.base_price),
        category: data.category,
        description: data.description,
        is_active: true,
      })).data,
    onSuccess: () => {
      toast({ title: "Product created", description: `${form.name} added to catalog.` });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowAddProduct(false);
      setForm({ name: "", unit: "Ton", base_price: "", category: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create product",
        description: error?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const rootCategories = categories.filter(c => !c.parentId);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddProduct = () => {
    if (!form.name.trim() || !form.unit || !form.base_price) {
      toast({ title: "Missing fields", description: "Name, unit, and base price are required.", variant: "destructive" });
      return;
    }
    createProductMutation.mutate(form);
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] bg-surface rounded-xl border border-border overflow-hidden flex flex-col relative">
      <div className="flex flex-1 min-h-0">
        
        {/* Left Panel: Category Tree (30%) */}
        <div className="w-[30%] border-r border-border bg-surface-2 flex flex-col min-h-0 shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface-2 z-10">
            <h3 className="font-medium text-text-1 flex items-center gap-2 text-[14px]">
              <FolderTree className="w-4 h-4 text-text-3" />
              Categories
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 text-sm text-text-3">Loading categories...</div>
            ) : rootCategories.length === 0 ? (
              <div className="p-4 text-sm text-text-3">No categories.</div>
            ) : (
              <div className="space-y-1">
                <button
                    onClick={() => setSelectedCatId(null)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                      selectedCatId === null ? "bg-amber/10 text-amber font-medium" : "text-text-2 hover:bg-white/5"
                    }`}
                  >
                    <span>All Categories</span>
                </button>
                {rootCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                      selectedCatId === cat.id ? "bg-amber/10 text-amber font-medium" : "text-text-2 hover:bg-white/5"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] font-mono opacity-50">{cat.productCount || 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Products Data Table (70%) */}
        <div className="w-[70%] flex flex-col min-h-0 bg-surface">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 text-sm text-text-3">
              <span>Selected Category:</span>
              <span className="font-medium text-text-1">{categories.find(c => c.id === selectedCatId)?.name || "All"}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface sticky top-0 border-b border-border z-10 shadow-sm">
                <tr>
                  <th className="p-3 text-[12px] font-medium text-text-3 uppercase tracking-wider pl-6">ID</th>
                  <th className="p-3 text-[12px] font-medium text-text-3 uppercase tracking-wider">Product Name</th>
                  <th className="p-3 text-[12px] font-medium text-text-3 uppercase tracking-wider">Unit</th>
                  <th className="p-3 text-[12px] font-medium text-text-3 uppercase tracking-wider text-right">Base Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoadingProducts ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-text-3 text-sm">Loading products...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-text-3 text-sm">No products found.</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-2 transition-colors group cursor-text">
                      <td className="p-3 pl-6 text-[13px] font-mono text-text-3">{product.id.slice(0, 8)}</td>
                      <td className="p-3 text-[14px] text-text-1 font-medium flex items-center justify-between group-hover:text-amber transition-colors">
                        {product.name}
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="p-3 text-[13px] text-text-2">{product.unit || "—"}</td>
                      <td className="p-3 text-[13px] font-mono text-text-1 text-right">{Number(product.base_price).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3">
        <Button className="rounded-full shadow-lg h-12 px-6 bg-surface-2 text-text-1 border border-border hover:bg-surface hover:text-amber transition-colors" variant="outline">
          <FolderTree className="w-4 h-4 mr-2" />
          Add Category
        </Button>
        <Button 
          onClick={() => setShowAddProduct(true)}
          className="rounded-full shadow-lg h-14 px-6 bg-amber hover:bg-amber-hover text-black font-semibold text-[15px] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-text-1">
              <Package className="w-5 h-5 text-amber" />
              Add New Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-text-2 uppercase tracking-wider">Product Name *</Label>
              <Input
                placeholder="e.g. Steel Rebar 16mm"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-text-2 uppercase tracking-wider">Unit *</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] text-text-2 uppercase tracking-wider">Base Price (SAR) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.base_price}
                  onChange={e => setForm(f => ({ ...f, base_price: e.target.value ? Number(e.target.value) : "" }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] text-text-2 uppercase tracking-wider">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {rootCategories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] text-text-2 uppercase tracking-wider">Description</Label>
              <Input
                placeholder="Short product description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
            <Button
              onClick={handleAddProduct}
              disabled={createProductMutation.isPending}
              className="bg-amber hover:bg-amber-hover text-black font-semibold"
            >
              {createProductMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
