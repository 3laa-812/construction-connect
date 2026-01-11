import { useState } from "react";
import { Settings as SettingsIcon, User, Building2, Bell, Shield, Palette, Globe, CreditCard, Percent, Save, Users, Package } from "lucide-react";
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
import { TeamManagement } from "@/components/admin/TeamManagement";import { CatalogManagement } from "@/components/admin/CatalogManagement";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { t } = useLanguage();
  const [commissionRate, setCommissionRate] = useState("2.5");

  const handleSave = () => {
    toast({
      title: t("settings_page.toast.saved_title"),
      description: t("settings_page.toast.saved_desc"),
    });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("settings_page.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("settings_page.subtitle")}
          </p>
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
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">{t("settings_page.profile.personal_info")}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("settings_page.profile.first_name")}</Label>
                  <Input id="firstName" defaultValue="Ahmed" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("settings_page.profile.last_name")}</Label>
                  <Input id="lastName" defaultValue="Al-Rashid" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings_page.profile.email")}</Label>
                  <Input id="email" type="email" defaultValue="ahmed@buildpro.sa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("settings_page.profile.phone")}</Label>
                  <Input id="phone" defaultValue="+966 50 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t("settings_page.profile.role")}</Label>
                  <Input id="role" defaultValue="Procurement Manager" disabled />
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                {t("settings_page.profile.save_changes")}
              </Button>
            </div>

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
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">{t("settings_page.company.info")}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t("settings_page.company.name_en")}</Label>
                  <Input defaultValue="BuildPro Construction LLC" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings_page.company.name_ar")}</Label>
                  <Input defaultValue="بيلد برو للمقاولات" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings_page.company.cr")}</Label>
                  <Input defaultValue="1010123456" className="tabular-nums" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings_page.company.vat")}</Label>
                  <Input defaultValue="300012345600003" className="tabular-nums" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>{t("settings_page.company.address")}</Label>
                  <Input defaultValue="King Fahd Road, Olaya District, Riyadh 12211" />
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                {t("settings_page.profile.save_changes")}
              </Button>
            </div>
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
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.order_updates")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.order_updates_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.delivery_alerts")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.delivery_alerts_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.rfq_expiry")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.rfq_expiry_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.notifications.payment_reminders")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.notifications.payment_reminders_desc")}</p>
                  </div>
                  <Switch />
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
                  <Input type="number" defaultValue="50" className="tabular-nums" />
                  <p className="text-xs text-muted-foreground">
                    {t("settings_page.admin.min_commission_help")}
                  </p>
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                {t("settings_page.admin.save_config")}
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
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.credit")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.credit_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.bank")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.bank_desc")}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings_page.admin.cheques")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings_page.admin.cheques_desc")}</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
