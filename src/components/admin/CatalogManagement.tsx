import { useState } from "react";
import { Plus, Edit, Trash2, FolderTree, Package, Scale, Search, MoreHorizontal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  parentId: string | null;
  productCount: number;
}

interface UnitOfMeasure {
  id: string;
  name: string;
  nameAr: string;
  symbol: string;
  type: "weight" | "volume" | "length" | "area" | "count";
}

// FR-F02: Catalog Management Component
export function CatalogManagement() {
  const [categories, setCategories] = useState<Category[]>([
    { id: "cat-1", name: "Building Materials", nameAr: "مواد البناء", parentId: null, productCount: 245 },
    { id: "cat-2", name: "Steel & Metal", nameAr: "الحديد والمعادن", parentId: null, productCount: 89 },
    { id: "cat-3", name: "Electrical", nameAr: "كهربائي", parentId: null, productCount: 156 },
    { id: "cat-4", name: "Plumbing", nameAr: "السباكة", parentId: null, productCount: 78 },
    { id: "cat-5", name: "HVAC", nameAr: "التكييف", parentId: null, productCount: 45 },
    { id: "cat-6", name: "Cement", nameAr: "أسمنت", parentId: "cat-1", productCount: 34 },
    { id: "cat-7", name: "Bricks", nameAr: "طوب", parentId: "cat-1", productCount: 28 },
    { id: "cat-8", name: "Reinforcement Steel", nameAr: "حديد التسليح", parentId: "cat-2", productCount: 52 },
  ]);

  const [units, setUnits] = useState<UnitOfMeasure[]>([
    { id: "unit-1", name: "Kilogram", nameAr: "كيلوغرام", symbol: "kg", type: "weight" },
    { id: "unit-2", name: "Ton", nameAr: "طن", symbol: "ton", type: "weight" },
    { id: "unit-3", name: "Meter", nameAr: "متر", symbol: "m", type: "length" },
    { id: "unit-4", name: "Square Meter", nameAr: "متر مربع", symbol: "m²", type: "area" },
    { id: "unit-5", name: "Cubic Meter", nameAr: "متر مكعب", symbol: "m³", type: "volume" },
    { id: "unit-6", name: "Piece", nameAr: "قطعة", symbol: "pc", type: "count" },
    { id: "unit-7", name: "Bag", nameAr: "كيس", symbol: "bag", type: "count" },
    { id: "unit-8", name: "Box", nameAr: "صندوق", symbol: "box", type: "count" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    nameAr: "",
    parentId: "",
  });

  const [newUnit, setNewUnit] = useState({
    name: "",
    nameAr: "",
    symbol: "",
    type: "count" as UnitOfMeasure["type"],
  });

  const parentCategories = categories.filter((c) => c.parentId === null);

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.nameAr.includes(searchTerm)
  );

  const handleSaveCategory = () => {
    if (!newCategory.name || !newCategory.nameAr) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: newCategory.name, nameAr: newCategory.nameAr, parentId: newCategory.parentId || null }
            : c
        )
      );
      toast({ title: "Category Updated", description: `${newCategory.name} has been updated` });
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: newCategory.name,
        nameAr: newCategory.nameAr,
        parentId: newCategory.parentId || null,
        productCount: 0,
      };
      setCategories((prev) => [...prev, newCat]);
      toast({ title: "Category Created", description: `${newCategory.name} has been added` });
    }

    setShowCategoryDialog(false);
    setEditingCategory(null);
    setNewCategory({ name: "", nameAr: "", parentId: "" });
  };

  const handleSaveUnit = () => {
    if (!newUnit.name || !newUnit.nameAr || !newUnit.symbol) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingUnit) {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === editingUnit.id
            ? { ...u, ...newUnit }
            : u
        )
      );
      toast({ title: "Unit Updated", description: `${newUnit.name} has been updated` });
    } else {
      const newU: UnitOfMeasure = {
        id: `unit-${Date.now()}`,
        ...newUnit,
      };
      setUnits((prev) => [...prev, newU]);
      toast({ title: "Unit Created", description: `${newUnit.name} has been added` });
    }

    setShowUnitDialog(false);
    setEditingUnit(null);
    setNewUnit({ name: "", nameAr: "", symbol: "", type: "count" });
  };

  const handleDeleteCategory = (cat: Category) => {
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    toast({ title: "Category Deleted", description: `${cat.name} has been removed` });
  };

  const handleDeleteUnit = (unit: UnitOfMeasure) => {
    setUnits((prev) => prev.filter((u) => u.id !== unit.id));
    toast({ title: "Unit Deleted", description: `${unit.name} has been removed` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Catalog Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage categories, subcategories, and units of measurement (FR-F02)
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Units
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCategory(null)}>
                  <Plus className="w-4 h-4 me-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </DialogTitle>
                  <DialogDescription>
                    Create a new product category for the marketplace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name (English) *</Label>
                      <Input
                        placeholder="e.g., Building Materials"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (Arabic) *</Label>
                      <Input
                        placeholder="مواد البناء"
                        dir="rtl"
                        value={newCategory.nameAr}
                        onChange={(e) => setNewCategory({ ...newCategory, nameAr: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select
                      value={newCategory.parentId}
                      onValueChange={(v) => setNewCategory({ ...newCategory, parentId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top-level category)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Top-level)</SelectItem>
                        {parentCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCategory}>
                    <Save className="w-4 h-4 me-2" />
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start p-3 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-start p-3 text-sm font-medium text-muted-foreground">Arabic</th>
                  <th className="text-start p-3 text-sm font-medium text-muted-foreground">Parent</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Products</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parentId);
                  return (
                    <tr key={cat.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground" dir="rtl">{cat.nameAr}</td>
                      <td className="p-3 text-muted-foreground">{parent?.name || "-"}</td>
                      <td className="p-3 text-center tabular-nums">{cat.productCount}</td>
                      <td className="p-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCategory(cat);
                                setNewCategory({
                                  name: cat.name,
                                  nameAr: cat.nameAr,
                                  parentId: cat.parentId || "",
                                });
                                setShowCategoryDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 me-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-danger"
                              onClick={() => handleDeleteCategory(cat)}
                            >
                              <Trash2 className="w-4 h-4 me-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUnit(null)}>
                  <Plus className="w-4 h-4 me-2" />
                  Add Unit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUnit ? "Edit Unit" : "Add New Unit"}
                  </DialogTitle>
                  <DialogDescription>
                    Create a new unit of measurement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name (English) *</Label>
                      <Input
                        placeholder="e.g., Kilogram"
                        value={newUnit.name}
                        onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (Arabic) *</Label>
                      <Input
                        placeholder="كيلوغرام"
                        dir="rtl"
                        value={newUnit.nameAr}
                        onChange={(e) => setNewUnit({ ...newUnit, nameAr: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Symbol *</Label>
                      <Input
                        placeholder="e.g., kg"
                        value={newUnit.symbol}
                        onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={newUnit.type}
                        onValueChange={(v) => setNewUnit({ ...newUnit, type: v as UnitOfMeasure["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weight">Weight</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="length">Length</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUnitDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUnit}>
                    <Save className="w-4 h-4 me-2" />
                    {editingUnit ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{unit.symbol}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{unit.name}</h4>
                      <p className="text-sm text-muted-foreground" dir="rtl">{unit.nameAr}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUnit(unit);
                          setNewUnit({
                            name: unit.name,
                            nameAr: unit.nameAr,
                            symbol: unit.symbol,
                            type: unit.type,
                          });
                          setShowUnitDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 me-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-danger"
                        onClick={() => handleDeleteUnit(unit)}
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {unit.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
