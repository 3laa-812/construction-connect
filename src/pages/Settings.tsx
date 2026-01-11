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
import { TeamManagement } from "@/components/admin/TeamManagement";
import { CatalogManagement } from "@/components/admin/CatalogManagement";

export default function Settings() {
  const [commissionRate, setCommissionRate] = useState("2.5");

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and platform preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 me-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 className="w-4 h-4 me-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 me-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 me-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Package className="w-4 h-4 me-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 me-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Ahmed" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Al-Rashid" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="ahmed@buildpro.sa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+966 50 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Procurement Manager" disabled />
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                Save Changes
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">Select your preferred language</p>
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
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">Choose light or dark mode</p>
                    </div>
                  </div>
                  <Select defaultValue="light">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Company Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name (English)</Label>
                  <Input defaultValue="BuildPro Construction LLC" />
                </div>
                <div className="space-y-2">
                  <Label>Company Name (Arabic)</Label>
                  <Input defaultValue="بيلد برو للمقاولات" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>Commercial Registration (CR)</Label>
                  <Input defaultValue="1010123456" className="tabular-nums" />
                </div>
                <div className="space-y-2">
                  <Label>VAT Number</Label>
                  <Input defaultValue="300012345600003" className="tabular-nums" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input defaultValue="King Fahd Road, Olaya District, Riyadh 12211" />
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Bids</p>
                    <p className="text-sm text-muted-foreground">Receive notifications when suppliers submit bids</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delivery Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications when orders are out for delivery</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">RFQ Expiry Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders before your RFQs close</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for pending payments</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">SMS Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delivery Confirmations</p>
                    <p className="text-sm text-muted-foreground">SMS when orders are delivered</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Urgent Alerts</p>
                    <p className="text-sm text-muted-foreground">Critical updates requiring immediate attention</p>
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
                  <h3 className="font-semibold text-foreground">Commission Configuration</h3>
                  <p className="text-sm text-muted-foreground">Set the platform commission fee per successful order</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
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
                    Applied to total order value upon completion
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Commission (SAR)</Label>
                  <Input type="number" defaultValue="50" className="tabular-nums" />
                  <p className="text-xs text-muted-foreground">
                    Minimum commission per transaction
                  </p>
                </div>
              </div>
              <Button className="mt-6" onClick={handleSave}>
                <Save className="w-4 h-4 me-2" />
                Save Configuration
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Payment Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure payment terms and methods</p>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Cash Payments</p>
                    <p className="text-sm text-muted-foreground">Enable cash on delivery option</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Credit Terms</p>
                    <p className="text-sm text-muted-foreground">Enable credit/deferred payment options</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Accept Bank Transfers</p>
                    <p className="text-sm text-muted-foreground">Manual bank transfer verification</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Accept Cheques</p>
                    <p className="text-sm text-muted-foreground">Post-dated cheque payments</p>
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
