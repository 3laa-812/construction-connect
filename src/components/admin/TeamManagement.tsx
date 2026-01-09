import { useState } from "react";
import { UserPlus, Mail, Shield, User, MoreHorizontal, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "procurement_manager" | "site_engineer" | "finance";
  status: "active" | "pending" | "inactive";
  budgetLimit?: number;
  invitedAt: string;
  lastActive?: string;
}

// FR-A04: Sub-Accounts Management
export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "user-1",
      name: "Ahmed Al-Rashid",
      email: "ahmed@buildpro.sa",
      role: "admin",
      status: "active",
      invitedAt: "2023-06-15",
      lastActive: "2024-01-18",
    },
    {
      id: "user-2",
      name: "Mohammed Al-Qahtani",
      email: "mohammed@buildpro.sa",
      role: "procurement_manager",
      status: "active",
      budgetLimit: 500000,
      invitedAt: "2023-08-20",
      lastActive: "2024-01-17",
    },
    {
      id: "user-3",
      name: "Khalid Hassan",
      email: "khalid@buildpro.sa",
      role: "site_engineer",
      status: "active",
      budgetLimit: 50000,
      invitedAt: "2023-10-10",
      lastActive: "2024-01-18",
    },
    {
      id: "user-4",
      name: "Sara Ibrahim",
      email: "sara@buildpro.sa",
      role: "finance",
      status: "pending",
      invitedAt: "2024-01-15",
    },
  ]);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    role: "site_engineer" as TeamMember["role"],
    budgetLimit: 50000,
  });

  const roleConfig = {
    admin: {
      label: "Company Admin",
      description: "Full access to all features",
      color: "primary",
    },
    procurement_manager: {
      label: "Procurement Manager",
      description: "Create RFQs, manage orders with budget limit",
      color: "accent",
    },
    site_engineer: {
      label: "Site Engineer",
      description: "Confirm deliveries, limited procurement",
      color: "success",
    },
    finance: {
      label: "Finance",
      description: "View invoices, payments, and reports",
      color: "warning",
    },
  };

  const statusConfig = {
    active: { label: "Active", icon: CheckCircle, color: "success" },
    pending: { label: "Pending", icon: Clock, color: "warning" },
    inactive: { label: "Inactive", icon: XCircle, color: "neutral" },
  };

  const handleInvite = () => {
    if (!newMember.email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const newTeamMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: newMember.email.split("@")[0],
      email: newMember.email,
      role: newMember.role,
      status: "pending",
      budgetLimit: newMember.role !== "admin" && newMember.role !== "finance" ? newMember.budgetLimit : undefined,
      invitedAt: new Date().toISOString().split("T")[0],
    };

    setTeamMembers((prev) => [...prev, newTeamMember]);
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${newMember.email}`,
    });
    setShowInviteDialog(false);
    setNewMember({ email: "", role: "site_engineer", budgetLimit: 50000 });
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.role === "admin" && teamMembers.filter((m) => m.role === "admin").length === 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one admin must remain in the team",
        variant: "destructive",
      });
      return;
    }

    setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast({
      title: "Member Removed",
      description: `${member.name} has been removed from the team`,
    });
  };

  const handleResendInvite = (member: TeamMember) => {
    toast({
      title: "Invitation Resent",
      description: `A new invitation has been sent to ${member.email}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Invite team members with specific roles and permissions (FR-A04)
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 me-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your company account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(v) => setNewMember({ ...newMember, role: v as TeamMember["role"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(newMember.role === "procurement_manager" || newMember.role === "site_engineer") && (
                <div className="space-y-2">
                  <Label>Budget Limit (SAR)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newMember.budgetLimit}
                    onChange={(e) => setNewMember({ ...newMember, budgetLimit: parseInt(e.target.value) || 0 })}
                    className="tabular-nums"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum order value this member can approve
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>
                <Mail className="w-4 h-4 me-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(roleConfig).map(([key, config]) => (
          <div
            key={key}
            className="bg-card rounded-lg border border-border p-3 text-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{config.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        ))}
      </div>

      {/* Team Members List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-start p-3 text-sm font-medium text-muted-foreground">Member</th>
              <th className="text-start p-3 text-sm font-medium text-muted-foreground">Role</th>
              <th className="text-start p-3 text-sm font-medium text-muted-foreground">Budget Limit</th>
              <th className="text-start p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-start p-3 text-sm font-medium text-muted-foreground">Last Active</th>
              <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member, index) => {
              const StatusIcon = statusConfig[member.status].icon;
              return (
                <tr
                  key={member.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge variant={roleConfig[member.role].color as any} size="sm">
                      {roleConfig[member.role].label}
                    </StatusBadge>
                  </td>
                  <td className="p-3 tabular-nums">
                    {member.budgetLimit ? `SAR ${member.budgetLimit.toLocaleString()}` : "-"}
                  </td>
                  <td className="p-3">
                    <StatusBadge variant={statusConfig[member.status].color as any} size="sm">
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[member.status].label}
                    </StatusBadge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground tabular-nums">
                    {member.lastActive || "Never"}
                  </td>
                  <td className="p-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 me-2" />
                          Edit Permissions
                        </DropdownMenuItem>
                        {member.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                            <Mail className="w-4 h-4 me-2" />
                            Resend Invitation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-danger"
                          onClick={() => handleRemoveMember(member)}
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          Remove Member
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
    </div>
  );
}
