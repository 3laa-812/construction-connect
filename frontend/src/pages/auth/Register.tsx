import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Construction, CheckCircle } from "lucide-react";

export default function Register() {
  const { registerInit, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "contractor",
    companyName: "",
    crNumber: "",
    taxId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { userId } = await registerInit({
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        fullName: formData.fullName,
        role: formData.role,
        companyName: formData.companyName,
        crNumber: formData.crNumber,
        taxId: formData.taxId,
      });
      toast({
        title: t("auth.register.otp_sent_title") || "Verification code sent",
        description:
          t("auth.register.otp_sent_desc") ||
          "Check your email or phone for a 6-digit code.",
      });
      navigate(`/auth/verify-otp?userId=${encodeURIComponent(userId)}`);
    } catch {
      /* registerInit toasts on error */
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Construction className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("auth.register.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.register.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`w-12 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <CardTitle>
              {step === 1 ? t("auth.register.step1_title") : t("auth.register.step2_title")}
            </CardTitle>
            <CardDescription>
              {step === 1 ? t("auth.register.step1_desc") : t("auth.register.step2_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 1 ? handleNext : handleFinish} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t("auth.register.full_name")}</Label>
                      <Input id="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("auth.register.phone")}</Label>
                      <Input id="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.register.email")}</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.register.password")}</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.register.iam")}</Label>
                    <Tabs
                      value={formData.role}
                      onValueChange={(v) => setFormData({ ...formData, role: v })}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="contractor">{t("auth.register.contractor")}</TabsTrigger>
                        <TabsTrigger value="supplier">{t("auth.register.supplier")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="contractor" />
                      <TabsContent value="supplier" />
                    </Tabs>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("auth.register.company_name")}</Label>
                    <Input id="companyName" value={formData.companyName} onChange={handleChange} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crNumber">{t("auth.register.cr_number")}</Label>
                      <Input id="crNumber" value={formData.crNumber} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">{t("auth.register.tax_id")}</Label>
                      <Input id="taxId" value={formData.taxId} onChange={handleChange} required />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Document uploads are on the next screen after you verify your email or phone.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    {t("auth.register.back")}
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {step === 2
                    ? isLoading
                      ? t("auth.register.sending") || "Sending code..."
                      : t("auth.register.send_code") || "Send verification code"
                    : t("auth.register.next")}
                </Button>
              </div>
            </form>
          </CardContent>
          {step === 1 && (
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                {t("auth.register.has_account")}{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  {t("auth.register.sign_in")}
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
