import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Building2, Bell, Shield, Palette, Globe, CreditCard, Percent, Save, Users, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { CatalogManagement } from "@/components/admin/CatalogManagement";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type ApiUser = {
  id: string;
  email: string;
  phone?: string;
  role?: string;
  company?: {
    id: string;
    name: string;
    commercial_reg_no?: string;
    tax_id?: string;
  };
};

type ApiCompany = {
  id: string;
  name: string;
  commercial_reg_no?: string;
  tax_id?: string;
};

type CompanySettings = {
  id: string;
  company_id: string;
  notifications?: any;
  catalog?: any;
  admin?: any;
};

export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commissionRate, setCommissionRate] = useState("2.5");
  const [minCommission, setMinCommission] = useState("50");
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    credit: true,
    bank: true,
    cheques: false,
  });
  const [notificationsForm, setNotificationsForm] = useState({
    newBids: true,
    orderUpdates: true,
    deliveryAlerts: true,
    rfqExpiry: true,
    paymentReminders: false,
  });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    nameAr: "",
    cr: "",
    vat: "",
    address: "",
  });

  // Fetch current user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<ApiUser>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/auth/profile");
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch company data
  const { data: companyData, isLoading: isLoadingCompany } = useQuery<ApiCompany>({
    queryKey: ["company", user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null;
      const response = await api.get(`/companies/${user.companyId}`);
      return response.data;
    },
    enabled: !!user?.companyId,
  });

  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["company-settings", user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null as any;
      const response = await api.get(`/settings/company/${user.companyId}`);
      return response.data;
    },
    enabled: !!user?.companyId,
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (userProfile) {
      const nameParts = (userProfile.email?.split("@")[0] || "").split(".");
      setProfileForm({
        firstName: nameParts[0] || "",
        lastName: nameParts[1] || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  // Update company form when company data loads
  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        name: companyData.name || "",
        nameAr: companyData.name || "", // Backend doesn't have nameAr yet
        cr: companyData.commercial_reg_no || "",
        vat: companyData.tax_id || "",
        address: "", // Backend doesn't have address yet
      });
    }
  }, [companyData]);

  // Initialize admin + notifications from settings
  useEffect(() => {
    if (companySettings?.admin) {
      setCommissionRate(
        companySettings.admin.commissionRate !== undefined
          ? String(companySettings.admin.commissionRate)
          : "2.5"
      );
      setMinCommission(
        companySettings.admin.minCommission !== undefined
          ? String(companySettings.admin.minCommission)
          : "50"
      );
      setPaymentMethods({
        cash: companySettings.admin.paymentMethods?.cash ?? true,
        credit: companySettings.admin.paymentMethods?.credit ?? true,
        bank: companySettings.admin.paymentMethods?.bank ?? true,
        cheques: companySettings.admin.paymentMethods?.cheques ?? false,
      });
    }
    if (companySettings?.notifications) {
      setNotificationsForm({
        newBids: companySettings.notifications.newBids ?? true,
        orderUpdates: companySettings.notifications.orderUpdates ?? true,
        deliveryAlerts: companySettings.notifications.deliveryAlerts ?? true,
        rfqExpiry: companySettings.notifications.rfqExpiry ?? true,
        paymentReminders: companySettings.notifications.paymentReminders ?? false,
      });
    }
  }, [companySettings]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
      if (!user?.id) {
        throw new Error("User ID not found. Please log out and log back in.");
      }
      try {
        // Note: Backend User model doesn't have firstName/lastName fields yet
        // We'll update phone for now
        const response = await api.patch(`/users/${user.id}`, {
          phone: data.phone,
          // When backend adds firstName/lastName, uncomment:
          // firstName: data.firstName,
          // lastName: data.lastName,
        });
        return response;
      } catch (error: any) {
        console.error("User update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: t("settings_page.toast.saved_title"),
        description: t("settings_page.toast.saved_desc"),
      });
    },
    onError: (error: any) => {
      console.error("User mutation error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || error.response?.data?.message || "Could not update profile",
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name?: string; commercial_reg_no?: string; tax_id?: string }) => {
      if (!user?.companyId) {
        throw new Error("Company ID not found. Please log out and log back in.");
      }
      try {
        const response = await api.patch(`/companies/${user.companyId}`, data);
        return response;
      } catch (error: any) {
        console.error("Company update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", user?.companyId] });
      toast({
        title: t("settings_page.toast.saved_title"),
        description: t("settings_page.toast.saved_desc"),
      });
    },
    onError: (error: any) => {
      console.error("Company mutation error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || error.response?.data?.message || "Could not update company",
      });
    },
  });

  const handleSaveProfile = () => {
    console.log("handleSaveProfile called, user:", user, "user.id:", user?.id);
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log out and log back in.",
      });
      return;
    }
    updateUserMutation.mutate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
    });
  };

  const handleSaveCompany = () => {
    console.log("handleSaveCompany called, user:", user, "companyId:", user?.companyId);
    if (!user?.companyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company ID not found. Please log out and log back in.",
      });
      return;
    }
    updateCompanyMutation.mutate({
      name: companyForm.name,
      commercial_reg_no: companyForm.cr || undefined,
      tax_id: companyForm.vat || undefined,
    });
  };

  // Save admin config into settings
  const updateSettingsAdminMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) {
        throw new Error("Company ID not found. Please log out and log back in.");
      }
      try {
        const response = await api.patch(`/settings/company/${user.companyId}`, {
          admin: {
            commissionRate: Number(commissionRate || 0),
            minCommission: Number(minCommission || 0),
            paymentMethods,
          },
        });
        return response;
      } catch (error: any) {
        console.error("Admin settings update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings", user?.companyId] });
      toast({
        title: t("settings_page.toast.saved_title"),
        description: t("settings_page.toast.saved_desc"),
      });
    },
    onError: (error: any) => {
      console.error("Admin settings mutation error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || error.response?.data?.message || "Could not update admin settings",
      });
    },
  });

  // Save notifications into settings
  const updateSettingsNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) {
        throw new Error("Company ID not found. Please log out and log back in.");
      }
      try {
        const response = await api.patch(`/settings/company/${user.companyId}`, {
          notifications: notificationsForm,
        });
        return response;
      } catch (error: any) {
        console.error("Notifications settings update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings", user?.companyId] });
      toast({
        title: t("settings_page.toast.saved_title"),
        description: t("settings_page.toast.saved_desc"),
      });
    },
    onError: (error: any) => {
      console.error("Notifications settings mutation error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || error.response?.data?.message || "Could not update notification settings",
      });
    },
  });

  // Debug: Log user info on mount and when it changes
  useEffect(() => {
    console.log("Settings page - User object:", user);
    console.log("Settings page - User companyId:", user?.companyId);
    console.log("Settings page - User id:", user?.id);
  }, [user]);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("settings_page.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("settings_page.subtitle")}
          </p>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <strong>Debug:</strong> User ID: {user?.id || 'N/A'}, Company ID: {user?.companyId || 'N/A'}
            </div>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 me-2" />
              {t("settings_page.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 className="w-4 h-4 me-2" />
              {t("settings_page.tabs.company")}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 me-2" />
              {t("settings_page.tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 me-2" />
              {t("settings_page.tabs.team")}
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Package className="w-4 h-4 me-2" />
              {t("settings_page.tabs.catalog")}
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 me-2" />
              {t("settings_page.tabs.admin")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {isLoadingProfile ? (
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <p className="text-muted-foreground">Loading profile...</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">{t("settings_page.profile.personal_info")}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("settings_page.profile.first_name")}</Label>
                    <Input 
                      id="firstName" 
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("settings_page.profile.last_name")}</Label>
                    <Input 
                      id="lastName" 
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("settings_page.profile.email")}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileForm.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("settings_page.profile.phone")}</Label>
                    <Input 
                      id="phone" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+966 50 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("settings_page.profile.role")}</Label>
                    <Input 
                      id="role" 
                      value={userProfile?.role || "N/A"} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>
                <Button 
                  className="mt-6" 
                  onClick={handleSaveProfile}
                  disabled={updateUserMutation.isPending}
                >
                  <Save className="w-4 h-4 me-2" />
                  {updateUserMutation.isPending ? "Saving..." : t("settings_page.profile.save_changes")}
                </Button>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">{t("settings_page.profile.preferences")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("settings_page.profile.language")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_page.profile.language_desc")}</p>
                    </div>
                  </div>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("settings_page.profile.theme")}</p>
                      <p className="text-sm text-muted-foreground">{t("settings_page.profile.theme_desc")}</p>
                    </div>
                  </div>
                  <Select defaultValue="light">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("settings_page.profile.theme_options.light")}</SelectItem>
                      <SelectItem value="dark">{t("settings_page.profile.theme_options.dark")}</SelectItem>
                      <SelectItem value="system">{t("settings_page.profile.theme_options.system")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            {isLoadingCompany ? (
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <p className="text-muted-foreground">Loading company information...</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">{t("settings_page.company.info")}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("settings_page.company.name_en")}</Label>
                    <Input 
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      placeholder="Company Name (English)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings_page.company.name_ar")}</Label>
                    <Input 
                      value={companyForm.nameAr}
                      onChange={(e) => setCompanyForm({ ...companyForm, nameAr: e.target.value })}
                      placeholder="اسم الشركة"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings_page.company.cr")}</Label>
                    <Input 
                      value={companyForm.cr}
                      onChange={(e) => setCompanyForm({ ...companyForm, cr: e.target.value })}
                      placeholder="Commercial Registration Number"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings_page.company.vat")}</Label>
                    <Input 
                      value={companyForm.vat}
                      onChange={(e) => setCompanyForm({ ...companyForm, vat: e.target.value })}
                      placeholder="VAT/Tax ID"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>{t("settings_page.company.address")}</Label>
                    <Input 
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      placeholder="Company Address"
                    />
                  </div>
                </div>
                <Button 
                  className="mt-6" 
                  onClick={handleSaveCompany}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="w-4 h-4 me-2" />
                  {updateCompanyMutation.isPending ? "Saving..." : t("settings_page.profile.save_changes")}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">{t("settings_page.notifications.email")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.new_bids")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.new_bids_desc")}</p>
                  </div>
                  <Switch
                    checked={notificationsForm.newBids}
                    onCheckedChange={(checked) =>
                      setNotificationsForm((prev) => ({ ...prev, newBids: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.order_updates")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.order_updates_desc")}</p>
                  </div>
                  <Switch
                    checked={notificationsForm.orderUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationsForm((prev) => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.delivery_alerts")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.delivery_alerts_desc")}</p>
                  </div>
                  <Switch
                    checked={notificationsForm.deliveryAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationsForm((prev) => ({ ...prev, deliveryAlerts: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.rfq_expiry")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.rfq_expiry_desc")}</p>
                  </div>
                  <Switch
                    checked={notificationsForm.rfqExpiry}
                    onCheckedChange={(checked) =>
                      setNotificationsForm((prev) => ({ ...prev, rfqExpiry: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.payment_reminders")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.payment_reminders_desc")}</p>
                  </div>
                  <Switch
                    checked={notificationsForm.paymentReminders}
                    onCheckedChange={(checked) =>
                      setNotificationsForm((prev) => ({ ...prev, paymentReminders: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">{t("settings_page.notifications.sms")}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.delivery_confirmations")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.delivery_confirmations_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.urgent_alerts")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.urgent_alerts_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <Button
              className="mt-2"
              onClick={() => {
                console.log("Notifications save clicked, user:", user, "companyId:", user?.companyId);
                if (!user?.companyId) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Company ID not found. Please log out and log back in.",
                  });
                  return;
                }
                updateSettingsNotificationsMutation.mutate();
              }}
              disabled={updateSettingsNotificationsMutation.isPending || !user?.companyId}
            >
              <Save className="w-4 h-4 me-2" />
              {updateSettingsNotificationsMutation.isPending
                ? "Saving..."
                : t("settings_page.profile.save_changes")}
            </Button>
          </TabsContent>

          {/* Team Tab - FR-A04 */}
          <TabsContent value="team" className="space-y-6">
            <TeamManagement />
          </TabsContent>

          {/* Catalog Tab - FR-F02 */}
          <TabsContent value="catalog" className="space-y-6">
            <CatalogManagement />
          </TabsContent>

          {/* Admin Tab - FR-F03 Commission Config */}
          <TabsContent value="admin" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("settings_page.admin.commission")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings_page.admin.commission_desc")}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label>{t("settings_page.admin.rate")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="tabular-nums"
                      />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settings_page.admin.rate_help")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings_page.admin.min_commission")}</Label>
                    <Input
                      type="number"
                      value={minCommission}
                      onChange={(e) => setMinCommission(e.target.value)}
                      className="tabular-nums"
                    />
                  <p className="text-xs text-muted-foreground">
                    {t("settings_page.admin.min_commission_help")}
                  </p>
                </div>
              </div>
              <Button
                className="mt-6"
                onClick={() => {
                  console.log("Admin save clicked, user:", user, "companyId:", user?.companyId);
                  if (!user?.companyId) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Company ID not found. Please log out and log back in.",
                    });
                    return;
                  }
                  updateSettingsAdminMutation.mutate();
                }}
                disabled={updateSettingsAdminMutation.isPending || !user?.companyId}
              >
                <Save className="w-4 h-4 me-2" />
                {updateSettingsAdminMutation.isPending
                  ? "Saving..."
                  : t("settings_page.admin.save_config")}
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("settings_page.admin.payment_settings")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings_page.admin.payment_settings_desc")}</p>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.cash")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.cash_desc")}</p>
                  </div>
                  <Switch
                    checked={paymentMethods.cash}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => ({ ...prev, cash: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.credit")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.credit_desc")}</p>
                  </div>
                  <Switch
                    checked={paymentMethods.credit}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => ({ ...prev, credit: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.bank")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.bank_desc")}</p>
                  </div>
                  <Switch
                    checked={paymentMethods.bank}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => ({ ...prev, bank: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.cheques")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.cheques_desc")}</p>
                  </div>
                  <Switch
                    checked={paymentMethods.cheques}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => ({ ...prev, cheques: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
