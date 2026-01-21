import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, Truck, Clock, FileText, Send, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// FR-C05: Quote submission schema
const quoteSchema = z.object({
  lineItems: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number().min(0.01, "Unit price must be greater than 0"),
    brand: z.string().optional(),
    bidOnItem: z.boolean().default(true),
  })),
  deliveryCost: z.number().min(0, "Delivery cost cannot be negative"),
  deliveryDays: z.number().min(1, "Delivery days must be at least 1"),
  quoteValidity: z.enum(["24h", "48h", "72h", "7d", "14d", "30d"]),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms to submit a quote",
  }),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface RFQLineItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

interface SupplierQuoteFormProps {
  rfqId: string;
  rfqTitle: string;
  lineItems: RFQLineItem[];
  buyerCompany: string;
  deliveryLocation: string;
  requiredDeliveryDate: string;
  allowPartialBids: boolean;
  onSubmit?: (data: QuoteFormData) => void;
  onCancel?: () => void;
}

const validityOptions = [
  { value: "24h", label: "24 Hours" },
  { value: "48h", label: "48 Hours" },
  { value: "72h", label: "72 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "14 Days" },
  { value: "30d", label: "30 Days" },
];

export function SupplierQuoteForm({
  rfqId,
  rfqTitle,
  lineItems,
  buyerCompany,
  deliveryLocation,
  requiredDeliveryDate,
  allowPartialBids,
  onSubmit,
  onCancel,
}: SupplierQuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      lineItems: lineItems.map((item) => ({
        productId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: 0,
        brand: "",
        bidOnItem: true,
      })),
      deliveryCost: 0,
      deliveryDays: 7,
      quoteValidity: "48h",
      notes: "",
      termsAccepted: false,
    },
  });

  const watchedLineItems = form.watch("lineItems");
  const watchedDeliveryCost = form.watch("deliveryCost");

  // Calculate totals
  const itemsTotal = watchedLineItems.reduce((sum, item) => {
    if (item.bidOnItem) {
      return sum + (item.unitPrice * item.quantity);
    }
    return sum;
  }, 0);

  const grandTotal = itemsTotal + (watchedDeliveryCost || 0);
  const biddingItemsCount = watchedLineItems.filter((item) => item.bidOnItem).length;

  const handleSubmit = async (data: QuoteFormData) => {
    if (!user?.companyId) {
      toast({
        variant: "destructive",
        title: "Missing company info",
        description: "Your account is not linked to a company. Please contact support.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const validityMap: Record<QuoteFormData["quoteValidity"], number> = {
        "24h": 1,
        "48h": 2,
        "72h": 3,
        "7d": 7,
        "14d": 14,
        "30d": 30,
      };
      const daysToAdd = validityMap[data.quoteValidity] || 2;
      const validUntil = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await api.post(`/rfqs/${rfqId}/bids`, {
        rfq: { connect: { id: rfqId } },
        supplier: { connect: { id: user.companyId } },
        total_price: grandTotal,
        valid_until: validUntil,
        items: {
          create: data.lineItems
            .filter((li) => li.bidOnItem)
            .map((li) => ({
              rfq_item: { connect: { id: li.productId } },
              unit_price: li.unitPrice,
              note: li.brand || undefined,
            })),
        },
      });

      toast({
        title: "Quote Submitted Successfully",
        description: `Your quote for ${rfqId} has been sent to ${buyerCompany}`,
      });
      
      onSubmit?.(data);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* RFQ Summary Header */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{rfqId}</h3>
              <p className="text-sm text-muted-foreground">{rfqTitle}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">
                  Buyer: <span className="text-foreground font-medium">{buyerCompany}</span>
                </span>
                <span className="text-muted-foreground">
                  Delivery: <span className="text-foreground font-medium">{deliveryLocation}</span>
                </span>
                <span className="text-muted-foreground">
                  Required by: <span className="text-foreground font-medium tabular-nums">{requiredDeliveryDate}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Pricing - FR-C05 & FR-C06 */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Line Items Pricing</h4>
            {allowPartialBids && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Partial bids allowed
              </span>
            )}
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-muted/50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {allowPartialBids && (
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.bidOnItem`}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      )}
                      <h5 className="font-medium text-foreground">{item.productName}</h5>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantity: <span className="font-medium tabular-nums">{item.quantity} {item.unit}</span>
                      {item.specifications && ` · ${item.specifications}`}
                    </p>
                  </div>
                </div>

                {watchedLineItems[index]?.bidOnItem && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (SAR)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-10 tabular-nums"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.brand`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Ezz Steel" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <div className="bg-primary/10 rounded-lg px-4 py-2 w-full text-center">
                        <p className="text-xs text-muted-foreground">Line Total</p>
                        <p className="font-bold text-primary tabular-nums">
                          SAR {((watchedLineItems[index]?.unitPrice || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Validity */}
        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="deliveryCost"
            render={({ field }) => (
              <FormItem className="bg-card rounded-xl border border-border p-4">
                <FormLabel className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery Cost (SAR)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="tabular-nums"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Enter 0 for free delivery</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryDays"
            render={({ field }) => (
              <FormItem className="bg-card rounded-xl border border-border p-4">
                <FormLabel className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Delivery Days
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    className="tabular-nums"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>Days from order confirmation</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quoteValidity"
            render={({ field }) => (
              <FormItem className="bg-card rounded-xl border border-border p-4">
                <FormLabel className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Quote Validity
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select validity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="bg-card rounded-xl border border-border p-4">
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional information about your quote (e.g., 'Brand is Ezz Steel', 'Price includes installation')"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include brand names, quality certifications, or special terms
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Quote Summary */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Quote Summary</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Bidding On</span>
              <span className="font-medium">{biddingItemsCount} of {lineItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Subtotal</span>
              <span className="font-medium tabular-nums">SAR {itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Cost</span>
              <span className="font-medium tabular-nums">SAR {watchedDeliveryCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-primary/20">
              <span className="font-semibold text-foreground">Grand Total</span>
              <span className="font-bold text-primary text-lg tabular-nums">
                SAR {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <FormField
          control={form.control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  I confirm that this quote is accurate and I accept the platform terms and conditions
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="w-4 h-4 me-2" />
            {isSubmitting ? "Submitting..." : "Submit Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
