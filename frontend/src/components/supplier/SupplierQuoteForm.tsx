import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Building2, Calendar, MapPin, AlertCircle, FileText, FileUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SupplierQuoteFormProps {
  rfqId: string;
  rfqTitle: string;
  buyerCompany: string;
  deliveryLocation: string;
  requiredDeliveryDate: string;
  allowPartialBids: boolean;
  lineItems: {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface QuoteFormValues {
  items: {
    id: string;
    unitPrice: number | "";
    leadTimeDays: number | "";
    notes: string;
    isQuoting: boolean;
  }[];
  paymentTerms: string;
  validUntil: string;
  generalNotes: string;
}

export function SupplierQuoteForm({
  rfqId,
  rfqTitle,
  buyerCompany,
  deliveryLocation,
  requiredDeliveryDate,
  allowPartialBids,
  lineItems,
  onSubmit,
  onCancel,
}: SupplierQuoteFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, register, formState: { errors } } = useForm<QuoteFormValues>({
    defaultValues: {
      items: lineItems.map((item) => ({
        id: item.id,
        unitPrice: "",
        leadTimeDays: "",
        notes: "",
        isQuoting: true,
      })),
      paymentTerms: "Net 30",
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      generalNotes: "",
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const calculateTotal = () => {
    return watchItems.reduce((acc, item, index) => {
      if (!item.isQuoting) return acc;
      const price = Number(item.unitPrice) || 0;
      const q = lineItems[index].quantity;
      return acc + price * q;
    }, 0);
  };

  const handleFormSubmit = async (data: QuoteFormValues) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await Promise.resolve(onSubmit(data));
      }
      toast({
        title: "Quote Submitted Successfully",
        description: `Formal quote for ${rfqTitle} has been transmitted to ${buyerCompany}.`,
      });
      onSubmit(data);
    } catch (error) {
       toast({
        title: "Transmission Failed",
        description: "An error occurred while submitting your quote.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-ground">
      {/* Target RFQ Context Bar */}
      <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-text-3" />
          <div className="flex flex-col">
             <span className="text-[10px] text-text-3 tracking-widest uppercase font-medium">Buyer Organization</span>
             <span className="text-[13px] text-text-1 font-semibold truncate leading-tight mt-0.5">{buyerCompany}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-text-3" />
          <div className="flex flex-col">
             <span className="text-[10px] text-text-3 tracking-widest uppercase font-medium">Delivery Location</span>
             <span className="text-[13px] text-text-1 font-semibold truncate leading-tight mt-0.5">{deliveryLocation}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-text-3" />
          <div className="flex flex-col">
             <span className="text-[10px] text-text-3 tracking-widest uppercase font-medium">Req. Delivery</span>
             <span className="text-[13px] text-text-1 font-mono leading-tight mt-0.5">{requiredDeliveryDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-text-3" />
          <div className="flex flex-col">
             <span className="text-[10px] text-text-3 tracking-widest uppercase font-medium">Partial Supply</span>
             <StatusBadge variant={allowPartialBids ? "success" : "warning"} size="sm" className="font-mono text-[10px] mt-1 w-fit">
                {allowPartialBids ? "ALLOWED" : "NOT ALLOWED"}
             </StatusBadge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
        <div className="p-6 space-y-8">
            
          {/* Pricing Matrix */}
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-display text-[16px] text-text-1">Line Item Matrix</h3>
                <span className="font-mono text-[11px] text-text-3 uppercase tracking-widest">Pricing & Lead Times</span>
             </div>
            
            <div className="bg-surface border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-2 border-b border-border font-mono text-[11px] text-text-3 uppercase tracking-widest">
                  <tr>
                    {allowPartialBids && <th className="p-3 w-10 text-center">Quote</th>}
                    <th className="p-3">Material Designation</th>
                    <th className="p-3">Required QTY</th>
                    <th className="p-3 min-w-[140px]">Unit Price (SAR)</th>
                    <th className="p-3 min-w-[120px]">Lead Time (Days)</th>
                    <th className="p-3 text-right">Ext. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((field, index) => {
                    const item = lineItems[index];
                    const isQuoting = watchItems[index].isQuoting;
                    const price = Number(watchItems[index].unitPrice) || 0;
                    const total = price * item.quantity;

                    return (
                      <tr key={item.id} className={!isQuoting ? "opacity-40 bg-ground/50" : ""}>
                        {allowPartialBids && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              {...register(`items.${index}.isQuoting`)}
                              className="accent-amber w-4 h-4 rounded border-border-2"
                            />
                          </td>
                        )}
                        <td className="p-3 font-medium text-text-1">
                          {item.productName}
                          {item.specifications && (
                            <p className="text-[11px] text-text-3 font-normal mt-1">{item.specifications}</p>
                          )}
                        </td>
                        <td className="p-3 font-mono tabular-nums text-text-2">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={!isQuoting}
                            {...register(`items.${index}.unitPrice`, {
                              required: isQuoting ? "Required" : false,
                            })}
                            className="h-9 bg-surface-2 border-border font-mono max-w-[120px]"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Days"
                            disabled={!isQuoting}
                            {...register(`items.${index}.leadTimeDays`, {
                              required: isQuoting ? "Required" : false,
                            })}
                            className="h-9 bg-surface-2 border-border font-mono max-w-[100px]"
                          />
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums font-semibold text-text-1">
                          SAR {total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="bg-surface-2 border-t border-border p-4 flex justify-end items-center gap-6">
                 <span className="font-mono text-[11px] text-text-3 uppercase tracking-widest">Total Valuation</span>
                 <span className="font-mono text-[20px] text-amber font-semibold tracking-tight">SAR {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            {errors.items && (
              <p className="text-[13px] text-danger font-medium flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> Please complete pricing for all selected items.
              </p>
            )}
          </div>

          {/* Terms & Conditions Block */}
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-display text-[16px] text-text-1">Commercial Terms</h3>
                <span className="font-mono text-[11px] text-text-3 uppercase tracking-widest">Constraints & Validity</span>
             </div>
             
             <div className="grid sm:grid-cols-2 gap-6 bg-surface border border-border rounded-lg p-5">
                 <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Requested Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      {...register("paymentTerms", { required: true })}
                      className="bg-surface-2 border-border font-mono text-[13px]"
                      placeholder="e.g. Net 30, 50% Adv"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <Label htmlFor="validUntil" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Quote Validity Expiration</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      {...register("validUntil", { required: true })}
                      className="bg-surface-2 border-border font-mono text-[13px]"
                    />
                 </div>
                 
                 <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="generalNotes" className="text-[11px] font-medium tracking-wide uppercase text-text-3">Operational Notes / Caveats</Label>
                    <Textarea
                      id="generalNotes"
                      {...register("generalNotes")}
                      className="bg-surface-2 border-border min-h-[80px] font-mono text-[13px] resize-none"
                      placeholder="Include any shipping constraints, sub-contracting details, or material substitution notices..."
                    />
                 </div>
             </div>
          </div>
          
          {/* Attachments Placeholder */}
          <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-display text-[16px] text-text-1">Supporting Documents</h3>
                <span className="font-mono text-[11px] text-text-3 uppercase tracking-widest">Optional</span>
             </div>
             <div className="border border-dashed border-border-2 rounded-lg p-8 flex flex-col items-center justify-center text-center bg-surface-2/30 hover:bg-surface-2/80 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center mb-3 group-hover:border-amber/50 transition-colors">
                      <FileUp className="w-5 h-5 text-text-3 group-hover:text-amber transition-colors" />
                  </div>
                  <span className="text-[13px] font-medium text-text-1">Upload Commercial Documents</span>
                  <span className="text-[11px] font-mono text-text-3 mt-1">PDF, XLS up to 10MB</span>
             </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-surface p-4 flex gap-3 justify-end sticky bottom-0 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-border text-text-2 hover:bg-surface-2 hover:text-text-1 min-w-[120px]"
          >
            Cancel Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || calculateTotal() === 0}
            className="bg-amber hover:bg-amber-hover text-black shadow-lg shadow-amber/20 font-bold min-w-[200px]"
          >
            {isSubmitting ? (
               "Transmitting..."
            ) : (
              <span className="flex items-center">
                 <CheckCircle2 className="w-4 h-4 mr-2" />
                 Transmit Formal Quote
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
