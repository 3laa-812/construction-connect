import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  });

  const { data, isLoading, isError } = useQuery<ApiProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get("/projects");
      return response.data;
    },
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

  const handleCreateProject = () => {
    if (newProject.name && newProject.location && newProject.receiverName && newProject.receiverPhone) {
      toast({
        title: t("projects.toast.created_title"),
        description: t("projects.toast.created_desc", { name: newProject.name }),
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("projects.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("projects.subtitle")}
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 me-2" />
                {t("projects.create_new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("projects.create_dialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("projects.create_dialog.desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("projects.create_dialog.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("projects.create_dialog.name_placeholder")}
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("projects.create_dialog.location")}</Label>
                  <Textarea
                    id="location"
                    placeholder={t("projects.create_dialog.location_placeholder")}
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("projects.create_dialog.location_tip")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiver">{t("projects.create_dialog.receiver")}</Label>
                    <Input
                      id="receiver"
                      placeholder={t("projects.create_dialog.receiver_placeholder")}
                      value={newProject.receiverName}
                      onChange={(e) => setNewProject({ ...newProject, receiverName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("projects.create_dialog.phone")}</Label>
                    <Input
                      id="phone"
                      placeholder={t("projects.create_dialog.phone_placeholder")}
                      value={newProject.receiverPhone}
                      onChange={(e) => setNewProject({ ...newProject, receiverPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t("projects.create_dialog.cancel")}
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.location || !newProject.receiverName || !newProject.receiverPhone}
                >
                  {t("projects.create_dialog.submit")}
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
              placeholder={t("projects.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              Loading projects...
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-danger">
              Failed to load projects
            </div>
          ) : (
            filteredProjects.map((project, index) => (
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
                        {t(statusConfig[project.status].labelKey)}
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
                        {t("projects.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>{t("projects.actions.view_rfqs")}</DropdownMenuItem>
                      <DropdownMenuItem>{t("projects.actions.view_orders")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-danger">
                        <Trash2 className="w-4 h-4 me-2" />
                        {t("projects.actions.delete")}
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
                      <p className="text-xs text-muted-foreground">{t("projects.metrics.rfqs")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{project.orderCount}</p>
                      <p className="text-xs text-muted-foreground">{t("projects.metrics.orders")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-primary">
                        {(project.totalSpent / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-muted-foreground">{t("projects.metrics.sar_spent")}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && !isError && filteredProjects.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">{t("projects.empty.no_projects")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("projects.empty.desc")}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
