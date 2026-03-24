import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const userId = params.get("userId") || "";
  const { verifyOtp, isLoading } = useAuth();
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    await verifyOtp(userId, otp.trim());
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Construction className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            {t("auth.verify.title") || "Verify your account"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.verify.enter_code") || "Enter 6-digit code"}</CardTitle>
            <CardDescription>
              {!userId
                ? t("auth.verify.missing_session") || "Start again from registration."
                : t("auth.verify.hint") || "We sent a code to your email or phone."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">{t("auth.verify.otp_label") || "Verification code"}</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest h-14"
                  maxLength={6}
                  placeholder="••••••"
                  disabled={!userId}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!userId || otp.length !== 6 || isLoading}>
                {isLoading ? t("auth.verify.working") || "Verifying…" : t("auth.verify.submit") || "Continue"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/register" className="text-sm text-primary hover:underline">
              {t("auth.verify.back_register") || "Back to registration"}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
