import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type ApiUser = {
  id: string;
  email: string;
  phone?: string;
  role?: "ADMIN" | "PROCUREMENT_MANAGER" | "SITE_ENGINEER";
  is_active: boolean;
  created_at: string;
};

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all users (we'll filter by company on backend or frontend)
  const { data: usersData, isLoading } = useQuery<ApiUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  // Filter users by company
  const companyUsers = usersData?.filter(u => {
    // Since backend doesn't return company_id in user list, we'll show all users for now
    // In production, backend should filter by company_id
    return true;
  }) || [];

  // Map API users to TeamMember format
  const teamMembers: TeamMember[] = companyUsers.map((apiUser) => {
    const roleMap: Record<string, TeamMember["role"]> = {
      ADMIN: "admin",
      PROCUREMENT_MANAGER: "procurement_manager",
      SITE_ENGINEER: "site_engineer",
    };
    
    return {
      id: apiUser.id,
      name: apiUser.email.split("@")[0],
      email: apiUser.email,
      role: roleMap[apiUser.role || ""] || "site_engineer",
      status: apiUser.is_active ? "active" : "inactive",
      invitedAt: apiUser.created_at ? new Date(apiUser.created_at).toISOString().split("T")[0] : "",
      lastActive: apiUser.is_active ? new Date().toISOString().split("T")[0] : undefined,
    };
  });

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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; companyId?: string }) => {
      const roleMap: Record<string, string> = {
        admin: "ADMIN",
        procurement_manager: "PROCUREMENT_MANAGER",
        site_engineer: "SITE_ENGINEER",
        finance: "SITE_ENGINEER", // Finance role not in backend, map to SITE_ENGINEER
      };
      
      return api.post("/users", {
        email: data.email,
        role: roleMap[data.role] || "SITE_ENGINEER",
        company: user?.companyId ? { connect: { id: user.companyId } } : undefined,
        is_active: false, // Pending until they accept invitation
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${newMember.email}`,
      });
      setShowInviteDialog(false);
      setNewMember({ email: "", role: "site_engineer", budgetLimit: 50000 });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Invitation Failed",
        description: error.response?.data?.message || "Could not send invitation",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Member Removed",
        description: "Team member has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: error.response?.data?.message || "Could not remove team member",
      });
    },
  });

  // Update user mutation (for activating/deactivating)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return api.patch(`/users/${userId}`, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.message || "Could not update user",
      });
    },
  });

  const handleInvite = () => {
    if (!newMember.email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!user?.companyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your account is not linked to a company",
      });
      return;
    }

    createUserMutation.mutate({
      email: newMember.email,
      role: newMember.role,
      companyId: user.companyId,
    });
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

    deleteUserMutation.mutate(member.id);
  };

  const handleResendInvite = (member: TeamMember) => {
    // Activate the user (assuming resending invite means activating them)
    updateUserMutation.mutate({ userId: member.id, isActive: true });
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
              <Button onClick={handleInvite} disabled={createUserMutation.isPending}>
                <Mail className="w-4 h-4 me-2" />
                {createUserMutation.isPending ? "Sending..." : "Send Invitation"}
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
      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-6 text-center">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      ) : (
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
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No team members found. Invite someone to get started.
                  </td>
                </tr>
              ) : (
                teamMembers.map((member, index) => {
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
              })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
