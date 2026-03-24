import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, CheckCircle } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const companyId = user?.companyId;
  const [step, setStep] = useState(1);

  const [name, setName] = useState(user?.companyName || "");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState<"SA" | "EG">("SA");
  const [companyType, setCompanyType] = useState<"CONTRACTOR" | "SUPPLIER">(
    user?.companyType === "SUPPLIER" ? "SUPPLIER" : "CONTRACTOR",
  );
  const [categories, setCategories] = useState("");

  const [crFile, setCrFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [vatFile, setVatFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!companyId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No company linked. Contact support.
      </div>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch(`/companies/${companyId}`, {
        name,
        address,
        country,
        type: companyType,
        ...(companyType === "SUPPLIER" && categories.trim()
          ? { supplier_categories: categories.trim() }
          : { supplier_categories: null }),
      });
      toast({ title: "Profile saved" });
      setStep(2);
    } catch {
      toast({
        variant: "destructive",
        title: "Could not save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (file: File, docType: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    await api.post(`/companies/${companyId}/documents`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const submitDocuments = async () => {
    if (!crFile || !taxFile || !logoFile) {
      toast({
        variant: "destructive",
        title: "Missing files",
        description: "CR, Tax ID, and company logo are required.",
      });
      return;
    }
    if (companyType === "SUPPLIER" && !vatFile) {
      toast({
        variant: "destructive",
        title: "Missing VAT certificate",
        description: "Suppliers must upload a VAT certificate.",
      });
      return;
    }
    setSaving(true);
    try {
      await uploadDoc(crFile, "CR");
      await uploadDoc(taxFile, "TAX_ID");
      await uploadDoc(logoFile, "COMPANY_LOGO");
      if (companyType === "SUPPLIER" && vatFile) {
        await uploadDoc(vatFile, "VAT_CERT");
      }
      toast({ title: "Documents uploaded" });
      setStep(3);
    } catch {
      toast({
        variant: "destructive",
        title: "Upload failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYB onboarding</h1>
        <p className="text-muted-foreground text-sm">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>Legal details for verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="co-name">Company name</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr">Address</Label>
              <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={(v) => setCountry(v as "SA" | "EG")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SA">Saudi Arabia</SelectItem>
                    <SelectItem value="EG">Egypt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={companyType}
                  onValueChange={(v) => setCompanyType(v as "CONTRACTOR" | "SUPPLIER")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="SUPPLIER">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {companyType === "SUPPLIER" && (
              <div className="space-y-2">
                <Label>Categories (comma-separated)</Label>
                <Input
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="e.g. Cement, Steel, Electrical"
                />
              </div>
            )}
            <Button onClick={saveProfile} disabled={saving || !name.trim() || !address.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Contractors: CR, Tax ID, logo. Suppliers also need VAT certificate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Commercial registration (CR)", file: crFile, set: setCrFile, id: "f-cr" },
              { label: "Tax ID", file: taxFile, set: setTaxFile, id: "f-tax" },
              { label: "Company logo", file: logoFile, set: setLogoFile, id: "f-logo" },
            ].map((row) => (
              <div key={row.id} className="border border-dashed rounded-lg p-4">
                <Label htmlFor={row.id}>{row.label}</Label>
                <input
                  id={row.id}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="mt-2 block text-sm"
                  onChange={(e) => row.set(e.target.files?.[0] ?? null)}
                />
                {row.file && <p className="text-xs text-muted-foreground mt-1">{row.file.name}</p>}
              </div>
            ))}
            {companyType === "SUPPLIER" && (
              <div className="border border-dashed rounded-lg p-4">
                <Label htmlFor="f-vat">VAT certificate</Label>
                <input
                  id="f-vat"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="mt-2 block text-sm"
                  onChange={(e) => setVatFile(e.target.files?.[0] ?? null)}
                />
                {vatFile && <p className="text-xs text-muted-foreground mt-1">{vatFile.name}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={submitDocuments} disabled={saving}>
                <Upload className="w-4 h-4 me-2" />
                Upload & finish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Under review
            </CardTitle>
            <CardDescription>
              Thank you. Our team will verify your documents. You can use the app meanwhile where
              allowed; full marketplace features unlock after KYB approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Go to dashboard</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
