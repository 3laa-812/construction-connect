import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Mail, Shield, MoreVertical, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type ApiUser = {
  id: string;
  email: string;
  role?: string;
  is_active: boolean;
  created_at: string;
};

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  lastActive: string;
  colorSeed: number; // For sticky avatar colors
}

const COLORS = ["bg-[#E5484D]", "bg-[#F76B15]", "bg-[#FFB224]", "bg-[#30A46C]", "bg-[#0090FF]", "bg-[#8D4DE8]"];

export function TeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SITE_ENGINEER");

  const { data: usersData, isLoading } = useQuery<ApiUser[]>({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const generateSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % COLORS.length;
  };

  const members: TeamMember[] = (usersData || []).map((u) => {
    return {
      id: u.id,
      name: u.email.split("@")[0],
      email: u.email,
      role: (u.role || "SITE_ENGINEER").replace("_", " "),
      status: u.is_active ? "active" : "pending",
      lastActive: u.is_active ? new Date().toISOString().split("T")[0] : "Never",
      colorSeed: generateSeed(u.email),
    };
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      return api.post("/users", {
        email: inviteEmail,
        role: inviteRole,
        company: user?.companyId ? { connect: { id: user.companyId } } : undefined,
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Invitation Sent", description: `Sent to ${inviteEmail}` });
      setShowInviteDialog(false);
      setInviteEmail("");
    },
  });

  if (isLoading) return <div className="p-8 text-center text-text-3">Loading team...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Members Cards */}
        {members.map((member) => {
          const initials = member.name.substring(0, 2).toUpperCase();
          const avatarColor = COLORS[member.colorSeed];
          
          return (
            <div key={member.id} className="bg-surface rounded-xl border border-border p-5 relative group hover:border-text-3 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center text-lg font-bold shadow-sm`}>
                  {initials}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                    {member.status === "pending" && <DropdownMenuItem>Resend Invite</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger">
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="text-[15px] font-semibold text-text-1 truncate" title={member.name}>
                  {member.name}
                </h3>
                <p className="text-[13px] text-text-3 truncate" title={member.email}>
                  {member.email}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-[11px] font-mono text-text-3 bg-surface-2 px-2 py-1 rounded truncate max-w-[100px]">
                  {member.role}
                </span>
                <span className="text-[11px] flex items-center gap-1.5 text-text-2">
                  {member.status === "active" ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-success"></span> Active</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-warning"></span> Pending</>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Invite CTA Card */}
        <button
          onClick={() => setShowInviteDialog(true)}
          className="bg-transparent rounded-xl border-2 border-dashed border-amber/50 hover:border-amber hover:bg-amber/5 p-5 flex flex-col items-center justify-center text-amber transition-all h-[210px] active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="font-medium text-[15px]">Invite Member</span>
          <span className="text-[13px] text-amber/70 mt-1">Add to team</span>
        </button>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation email to join the company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                value={inviteRole} 
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="ADMIN">Admin</option>
                <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                <option value="SITE_ENGINEER">Site Engineer</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteEmail}>
              <Mail className="w-4 h-4 mr-2" />
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
