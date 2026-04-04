import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MapPin, Phone, User, Building2, MoreVertical, Edit, Trash2, ClipboardList, FolderKanban } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

type ApiProject = {
  id: string;
  name: string;
  created_at?: string;
  end_date?: string;
  sites?: Array<{ name?: string; contact_person?: string; contact_phone?: string }>;
  rfqs?: Array<unknown>;
  purchase_orders?: Array<unknown>;
  budget?: number;
};

type Project = {
  id: string;
  name: string;
  location: string;
  receiverName: string;
  receiverPhone: string;
  status: "active" | "completed" | "on_hold";
  rfqCount: number;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
};

const statusConfig = {
  active: { color: "success", labelKey: "projects.status.active" },
  completed: { color: "neutral", labelKey: "projects.status.completed" },
  on_hold: { color: "warning", labelKey: "projects.status.on_hold" },
} as const;

export default function Projects() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    receiverName: "",
    receiverPhone: "",
    budget: "",
  });

  const { data, isLoading, isError } = useQuery<ApiProject[]>({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects")).data,
  });

  const projects: Project[] = useMemo(() => {
    if (!data) return [];
    return data.map((project) => {
      const site = project.sites?.[0];
      const status: Project["status"] =
        project.end_date && new Date(project.end_date).getTime() < Date.now()
          ? "completed"
          : "active";
      return {
        id: project.id,
        name: project.name,
        location: site?.name || "Location not set",
        receiverName: site?.contact_person || "Not assigned",
        receiverPhone: site?.contact_phone || "Not provided",
        status,
        rfqCount: project.rfqs?.length || 0,
        orderCount: project.purchase_orders?.length || 0,
        totalSpent: Number(project.budget || 0),
        createdAt: project.created_at ? new Date(project.created_at).toLocaleDateString() : "",
      };
    });
  }, [data]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = projects.filter(p => p.status === 'active').length;

  const handleCreateProject = () => {
    if (newProject.name && newProject.location && newProject.receiverName && newProject.receiverPhone) {
      toast({
        title: "Project Initialized",
        description: `Project setup for ${newProject.name} has been completed.`,
      });
      setShowCreateDialog(false);
      setNewProject({ name: "", location: "", receiverName: "", receiverPhone: "", budget: "" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-[24px] font-display text-text-1">Project Portfolio</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[13px] text-text-2">
                Manage operational locations and budgets across your organization.
              </p>
              <StatusBadge variant="success" size="sm" className="font-mono">{activeCount} ACTIVE</StatusBadge>
            </div>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="shrink-0 h-10 px-5 text-[14px] bg-amber text-black hover:bg-amber-hover font-bold shadow-lg shadow-amber/20 active:scale-95 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-surface border-border p-0 overflow-hidden">
              <div className="bg-surface-2 border-b border-border p-6 flex items-center justify-between">
                <div>
                  <DialogTitle className="text-[18px] font-display text-text-1">Initialize Project</DialogTitle>
                  <DialogDescription className="text-text-2 text-[13px] mt-1">
                     Configure standard procurement and delivery details for this new operational site.
                  </DialogDescription>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0 hidden sm:flex">
                  <FolderKanban className="w-6 h-6 text-amber" />
                </div>
              </div>
              
              <div className="p-6 space-y-6 bg-ground">
                 <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2 col-span-2">
                     <Label htmlFor="name" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Project Designation</Label>
                     <Input
                       id="name"
                       placeholder="e.g. Riyadh Villa Compound Phase 2"
                       value={newProject.name}
                       onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                       className="h-10 bg-surface-2 border-border-2 font-mono text-[13px]"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="budget" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Allocated Budget (SAR)</Label>
                     <Input
                       id="budget"
                       type="number"
                       placeholder="0.00"
                       value={newProject.budget}
                       onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                       className="h-10 bg-surface-2 border-border-2 font-mono text-[13px]"
                     />
                   </div>
                   
                   <div className="space-y-2 col-span-2 sm:col-span-1"></div>

                   <div className="space-y-2 col-span-2">
                     <Label htmlFor="location" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Delivery Site Logistics</Label>
                     <Textarea
                       id="location"
                       placeholder="Provide full shipping address or coordinate details for deliveries..."
                       value={newProject.location}
                       onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                       className="min-h-[80px] bg-surface-2 border-border-2 font-mono text-[13px] resize-none"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="receiver" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Site Superintendent</Label>
                     <Input
                       id="receiver"
                       placeholder="Authorised recipient name"
                       value={newProject.receiverName}
                       onChange={(e) => setNewProject({ ...newProject, receiverName: e.target.value })}
                       className="h-10 bg-surface-2 border-border-2 font-mono text-[13px]"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="phone" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Site Contact Number</Label>
                     <Input
                       id="phone"
                       placeholder="+966 5X XXX XXXX"
                       value={newProject.receiverPhone}
                       onChange={(e) => setNewProject({ ...newProject, receiverPhone: e.target.value })}
                       className="h-10 bg-surface-2 border-border-2 font-mono text-[13px]"
                     />
                   </div>
                 </div>
              </div>
              
              <DialogFooter className="border-t border-border bg-surface p-4 flex gap-2">
                <Button variant="outline" className="h-10 border-border text-text-2 hover:bg-surface-2 hover:text-text-1" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="h-10 bg-amber hover:bg-amber-hover text-black font-semibold shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]"
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.location || !newProject.receiverName || !newProject.receiverPhone}
                >
                  Confirm & Provision
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Action Bar */}
        <div className="bg-surface-2 rounded border border-border p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
            <Input
              placeholder="Query by project name or site location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-border bg-surface text-[14px]"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
             <div className="col-span-3 py-16 text-center text-text-3 font-mono text-sm tracking-widest">
                VERIFYING SITE DATA...
             </div>
          ) : isError ? (
            <div className="col-span-3 py-16 text-center text-danger bg-danger/5 border border-danger/20 rounded font-mono text-sm">
              TELEMETRY ERROR: FAILED TO LOAD PORTFOLIO
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-3 border border-dashed border-border-2 rounded-lg p-12 text-center">
              <Building2 className="w-8 h-8 text-text-3 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-text-1">No Projects Found</p>
              <p className="text-[13px] text-text-3 mt-1">Initialize a new project to track specific site material orders.</p>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="bg-surface rounded-xl border border-border p-5 group hover:border-amber/40 hover:shadow-amber transition-all duration-200 flex flex-col h-full active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-4">
                     <h3 className="font-display font-medium text-[16px] text-text-1 line-clamp-1" title={project.name}>
                        {project.name}
                     </h3>
                     <StatusBadge
                        variant={statusConfig[project.status].color as any}
                        size="sm"
                        className="mt-2 font-mono text-[10px] tracking-wider"
                      >
                        {t(statusConfig[project.status].labelKey).toUpperCase()}
                      </StatusBadge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Modify Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                         <ClipboardList className="w-4 h-4 mr-2" />
                         Procurement Ledger
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-danger">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Archive Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex-1 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-text-3 mt-0.5 shrink-0" />
                    <span className="text-[13px] text-text-2 leading-tight flex-1 line-clamp-2">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-3 shrink-0" />
                    <span className="text-[13px] text-text-2 flex-1 line-clamp-1">{project.receiverName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-text-3 shrink-0" />
                    <span className="text-[13px] font-mono text-text-2">{project.receiverPhone}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-2">
                  <div className="grid grid-cols-3 gap-2 py-1 text-center">
                    <div className="border-r border-border">
                      <p className="text-[16px] font-mono text-text-1 leading-tight">{project.rfqCount}</p>
                      <p className="text-[10px] tracking-widest uppercase text-text-3 mt-1">RFQs</p>
                    </div>
                    <div className="border-r border-border">
                      <p className="text-[16px] font-mono text-text-1 leading-tight">{project.orderCount}</p>
                      <p className="text-[10px] tracking-widest uppercase text-text-3 mt-1">Orders</p>
                    </div>
                    <div>
                      <p className="text-[15px] font-mono text-amber leading-tight">
                        {(project.totalSpent / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] tracking-widest uppercase text-text-3 mt-1">SAR Budget</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
