import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileImage, CreditCard, Building2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const paymentSchema = z.object({
  paymentMethod: z.enum(["bank_transfer", "cheque"]),
  referenceNumber: z.string().min(1, "Reference number is required"),
  notes: z.string().optional(),
  receipt: z.any().refine((val) => val instanceof File, "Payment proof is required"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentUploadProps {
  invoiceId: string;
  orderId: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { payment_proof_url: string }) => void;
}

export function PaymentUpload({
  invoiceId,
  orderId,
  invoiceNumber,
  amount,
  currency = "SAR",
  open,
  onOpenChange,
  onSubmit,
}: PaymentUploadProps) {
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "bank_transfer",
      referenceNumber: "",
      notes: "",
      receipt: undefined,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    form.setValue("receipt", file, { shouldValidate: true });
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const clearReceipt = () => {
    form.setValue("receipt", undefined as any, { shouldValidate: true });
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
  };

  const onSubmitForm = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", data.receipt);
      fd.append("referenceNumber", data.referenceNumber);
      if (data.notes) fd.append("notes", data.notes);

      const res = await api.post<{ payment_proof_url: string }>(
        `/invoices/${invoiceId}/payment-proof`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast({
        title: "Payment Submitted",
        description: "Your payment proof has been uploaded.",
      });

      onSubmit?.(res.data);
      clearReceipt();
      form.reset();
      onOpenChange(false);
    } catch {
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        form.reset();
        clearReceipt();
      }
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Upload Payment Proof
          </DialogTitle>
          <DialogDescription>
            Submit your payment receipt for verification (FR-E03)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium">Amount Due</span>
                <span className="font-bold text-primary tabular-nums">
                  {currency} {amount.toLocaleString()}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          field.value === "bank_transfer"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="bank_transfer" />
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Bank Transfer</span>
                      </label>
                      <label
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          field.value === "cheque"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="cheque" />
                        <FileImage className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Cheque</span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch("paymentMethod") === "bank_transfer"
                      ? "Transaction Reference"
                      : "Cheque Number"}{" "}
                    *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        form.watch("paymentMethod") === "bank_transfer"
                          ? "e.g., TXN123456789"
                          : "e.g., CHQ-00123"
                      }
                      className="tabular-nums"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt"
              render={() => (
                <FormItem>
                  <FormLabel>Upload Receipt / Cheque Image *</FormLabel>
                  <FormControl>
                    {receiptPreview ? (
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Payment receipt"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={clearReceipt}
                          className="absolute top-2 end-2 w-8 h-8 bg-danger text-danger-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="font-medium text-foreground">Click to upload</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, or PDF up to 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <CheckCircle className="w-4 h-4 me-2" />
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
