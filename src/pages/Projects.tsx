import { useState } from "react";
import { Plus, Search, ClipboardList, MapPin, Phone, User, Building2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  receiverName: string;
  receiverPhone: string;
  status: "active" | "completed" | "on_hold";
  rfqCount: number;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Al-Faisaliah Tower Renovation",
    location: "King Fahd Road, Olaya District, Riyadh",
    coordinates: { lat: 24.6906, lng: 46.6853 },
    receiverName: "Mohammed Al-Qahtani",
    receiverPhone: "+966 50 123 4567",
    status: "active",
    rfqCount: 8,
    orderCount: 12,
    totalSpent: 1250000,
    createdAt: "2024-01-01",
  },
  {
    id: "proj-002",
    name: "King Abdullah Financial District - Phase 3",
    location: "KAFD, Northern Ring Road, Riyadh",
    coordinates: { lat: 24.7651, lng: 46.6395 },
    receiverName: "Ahmed Ibrahim",
    receiverPhone: "+966 55 987 6543",
    status: "active",
    rfqCount: 15,
    orderCount: 22,
    totalSpent: 4500000,
    createdAt: "2023-11-15",
  },
  {
    id: "proj-003",
    name: "Riyadh Metro Station Finishing",
    location: "Olaya Street Metro Station, Riyadh",
    coordinates: { lat: 24.7136, lng: 46.6753 },
    receiverName: "Khalid Hassan",
    receiverPhone: "+966 56 456 7890",
    status: "active",
    rfqCount: 6,
    orderCount: 9,
    totalSpent: 890000,
    createdAt: "2024-01-10",
  },
  {
    id: "proj-004",
    name: "Jeddah Waterfront Development",
    location: "Corniche Road, Jeddah",
    coordinates: { lat: 21.5433, lng: 39.1728 },
    receiverName: "Omar Al-Rashid",
    receiverPhone: "+966 54 321 0987",
    status: "on_hold",
    rfqCount: 3,
    orderCount: 4,
    totalSpent: 320000,
    createdAt: "2023-12-20",
  },
  {
    id: "proj-005",
    name: "Red Sea Resort Complex",
    location: "NEOM, Tabuk Province",
    receiverName: "Fahad Al-Otaibi",
    receiverPhone: "+966 59 876 5432",
    status: "completed",
    rfqCount: 20,
    orderCount: 35,
    totalSpent: 8750000,
    createdAt: "2023-06-01",
  },
];

const statusConfig = {
  active: { color: "success", label: "Active" },
  completed: { color: "neutral", label: "Completed" },
  on_hold: { color: "warning", label: "On Hold" },
} as const;

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    receiverName: "",
    receiverPhone: "",
  });

  const filteredProjects = mockProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    if (newProject.name && newProject.location && newProject.receiverName && newProject.receiverPhone) {
      toast({
        title: "Project Created",
        description: `${newProject.name} has been added to your projects.`,
      });
      setShowCreateDialog(false);
      setNewProject({ name: "", location: "", receiverName: "", receiverPhone: "" });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your construction sites and delivery locations
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 me-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new construction project with delivery location details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Riyadh Villa Compound"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Site Location *</Label>
                  <Textarea
                    id="location"
                    placeholder="Enter the full address or use Google Maps integration"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Include street name, district, and city for accurate deliveries
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiver">Receiver Name *</Label>
                    <Input
                      id="receiver"
                      placeholder="Site contact person"
                      value={newProject.receiverName}
                      onChange={(e) => setNewProject({ ...newProject, receiverName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+966 5X XXX XXXX"
                      value={newProject.receiverPhone}
                      onChange={(e) => setNewProject({ ...newProject, receiverPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.location || !newProject.receiverName || !newProject.receiverPhone}
                >
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <StatusBadge
                      variant={statusConfig[project.status].color as any}
                      size="sm"
                      className="mt-1"
                    >
                      {statusConfig[project.status].label}
                    </StatusBadge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 me-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem>View RFQs</DropdownMenuItem>
                    <DropdownMenuItem>View Orders</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger">
                      <Trash2 className="w-4 h-4 me-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{project.receiverName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground tabular-nums">{project.receiverPhone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold tabular-nums">{project.rfqCount}</p>
                    <p className="text-xs text-muted-foreground">RFQs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{project.orderCount}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-primary">
                      {(project.totalSpent / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-muted-foreground">SAR Spent</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first project to start managing procurement
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
