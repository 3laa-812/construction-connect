import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Construction, Upload, CheckCircle } from "lucide-react";

export default function Register() {
  const { register, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [kybCrFile, setKybCrFile] = useState<File | null>(null);
  const [kybTaxFile, setKybTaxFile] = useState<File | null>(null);
  const [kybVatFile, setKybVatFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "contractor",
    companyName: "",
    crNumber: "",
    taxId: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register(formData);
    if (!result?.access_token) {
      return;
    }
    const companyId = result.user?.company_id ?? result.user?.company?.id;
    const token = result?.access_token;
    const uploads: { file: File; docType: string }[] = [];
    if (kybCrFile) uploads.push({ file: kybCrFile, docType: "CR" });
    if (kybTaxFile) uploads.push({ file: kybTaxFile, docType: "TAX_ID" });
    if (formData.role === "supplier" && kybVatFile) {
      uploads.push({ file: kybVatFile, docType: "VAT_CERT" });
    }

    if (token && companyId && uploads.length > 0) {
      const prevToken = localStorage.getItem("access_token");
      localStorage.setItem("access_token", token);
      try {
        for (const { file, docType } of uploads) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("doc_type", docType);
          await api.post(`/companies/${companyId}/documents`, fd);
        }
      } catch (err: unknown) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Document upload failed",
          description: "Account was created but KYB files could not be uploaded. You can retry from company settings later.",
        });
      } finally {
        if (prevToken) localStorage.setItem("access_token", prevToken);
        else localStorage.removeItem("access_token");
      }
    }

    navigate("/login");
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
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <CardTitle>
              {step === 1 ? t("auth.register.step1_title") : step === 2 ? t("auth.register.step2_title") : t("auth.register.step3_title")}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? t("auth.register.step1_desc")
                : step === 2
                ? t("auth.register.step2_desc")
                : t("auth.register.step3_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-4">
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
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                      <input
                        id="kyb-cr"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setKybCrFile(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="kyb-cr" className="cursor-pointer block">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">{t("auth.register.upload_cr")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("auth.register.upload_cr_desc")}</p>
                        {kybCrFile && (
                          <p className="text-xs text-primary mt-2 truncate px-2">{kybCrFile.name}</p>
                        )}
                      </label>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                      <input
                        id="kyb-tax"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setKybTaxFile(e.target.files?.[0] ?? null)}
                      />
                      <label htmlFor="kyb-tax" className="cursor-pointer block">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Tax ID</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF or image</p>
                        {kybTaxFile && (
                          <p className="text-xs text-primary mt-2 truncate px-2">{kybTaxFile.name}</p>
                        )}
                      </label>
                    </div>
                    {formData.role === "supplier" && (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                        <input
                          id="kyb-vat"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => setKybVatFile(e.target.files?.[0] ?? null)}
                        />
                        <label htmlFor="kyb-vat" className="cursor-pointer block">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">VAT certificate</p>
                          <p className="text-xs text-muted-foreground mt-1">Required for suppliers</p>
                          {kybVatFile && (
                            <p className="text-xs text-primary mt-2 truncate px-2">{kybVatFile.name}</p>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-fade-in text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.register.otp_sent")} <strong>{formData.phone}</strong>
                    </p>
                    <Input
                      id="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className="text-center text-2xl tracking-widest h-14"
                      maxLength={6}
                      placeholder={t("auth.register.otp_placeholder")}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("auth.register.otp_tip")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep((p) => p - 1)} className="flex-1">
                    {t("auth.register.back")}
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {step === 3
                    ? isLoading
                      ? t("auth.register.verifying")
                      : t("auth.register.verify")
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
