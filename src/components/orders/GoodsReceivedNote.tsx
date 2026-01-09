import { useState } from "react";
import { Camera, Upload, CheckCircle, AlertTriangle, Pen, Package, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LineItemCheck {
  id: string;
  productName: string;
  orderedQuantity: number;
  unit: string;
  receivedQuantity: number;
  qualityOk: boolean;
  notes: string;
}

interface GoodsReceivedNoteProps {
  orderId: string;
  supplier: string;
  deliveryNote?: string;
  lineItems: {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (data: GRNData) => void;
}

interface GRNData {
  orderId: string;
  lineItems: LineItemCheck[];
  photos: string[];
  signature: string;
  receiverName: string;
  receiverPhone: string;
  overallNotes: string;
  timestamp: string;
}

export function GoodsReceivedNote({
  orderId,
  supplier,
  deliveryNote,
  lineItems,
  open,
  onOpenChange,
  onConfirm,
}: GoodsReceivedNoteProps) {
  const [step, setStep] = useState<"verify" | "photo" | "sign">("verify");
  const [itemChecks, setItemChecks] = useState<LineItemCheck[]>(
    lineItems.map((item) => ({
      id: item.id,
      productName: item.productName,
      orderedQuantity: item.quantity,
      unit: item.unit,
      receivedQuantity: item.quantity,
      qualityOk: true,
      notes: "",
    }))
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [overallNotes, setOverallNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allItemsVerified = itemChecks.every(
    (item) => item.receivedQuantity > 0 && item.qualityOk
  );
  const hasDiscrepancies = itemChecks.some(
    (item) =>
      item.receivedQuantity !== item.orderedQuantity || !item.qualityOk
  );

  const updateItemCheck = (id: string, updates: Partial<LineItemCheck>) => {
    setItemChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Simulate photo upload - in production would upload to storage
      const newPhotos = Array.from(files).map(
        (file) => URL.createObjectURL(file)
      );
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!receiverName || !receiverPhone) {
      toast({
        title: "Missing Information",
        description: "Please enter receiver name and phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const grnData: GRNData = {
        orderId,
        lineItems: itemChecks,
        photos,
        signature,
        receiverName,
        receiverPhone,
        overallNotes,
        timestamp: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Delivery Confirmed",
        description: `GRN for ${orderId} has been recorded successfully`,
      });

      onConfirm?.(grnData);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Confirmation Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Goods Received Note (GRN)
          </DialogTitle>
          <DialogDescription>
            Confirm delivery for {orderId} from {supplier}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {["verify", "photo", "sign"].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : index < ["verify", "photo", "sign"].indexOf(step)
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < ["verify", "photo", "sign"].indexOf(step) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2",
                    index < ["verify", "photo", "sign"].indexOf(step)
                      ? "bg-success"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Verify Items */}
        {step === "verify" && (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Verify Received Items
            </h4>

            {deliveryNote && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">Delivery Note: </span>
                <span className="font-medium">{deliveryNote}</span>
              </div>
            )}

            <div className="space-y-3">
              {itemChecks.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card rounded-lg border p-4 space-y-3",
                    item.receivedQuantity !== item.orderedQuantity || !item.qualityOk
                      ? "border-warning"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-foreground">{item.productName}</h5>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {item.orderedQuantity} {item.unit}
                      </p>
                    </div>
                    {item.receivedQuantity === item.orderedQuantity && item.qualityOk ? (
                      <StatusBadge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3" />
                        OK
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="warning" size="sm">
                        <AlertTriangle className="w-3 h-3" />
                        Check
                      </StatusBadge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Received Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          updateItemCheck(item.id, {
                            receivedQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="tabular-nums"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quality Check</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Checkbox
                          checked={item.qualityOk}
                          onCheckedChange={(checked) =>
                            updateItemCheck(item.id, { qualityOk: !!checked })
                          }
                        />
                        <span className="text-sm">Quality Acceptable</span>
                      </div>
                    </div>
                  </div>

                  {(item.receivedQuantity !== item.orderedQuantity || !item.qualityOk) && (
                    <div className="space-y-2">
                      <Label>Notes (required for discrepancies)</Label>
                      <Textarea
                        placeholder="Describe the issue..."
                        value={item.notes}
                        onChange={(e) =>
                          updateItemCheck(item.id, { notes: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {hasDiscrepancies && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Discrepancies Detected</p>
                  <p className="text-muted-foreground">
                    Some items have quantity or quality issues. Please add notes for each discrepancy.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Photo Evidence */}
        {step === "photo" && (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo Evidence (FR-D03)
            </h4>
            <p className="text-sm text-muted-foreground">
              Take photos of the delivered materials for your records
            </p>

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={photo}
                    alt={`Delivery photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 end-1 w-6 h-6 bg-danger text-danger-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                <Camera className="w-8 h-8" />
                <span className="text-xs text-center">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label>Overall Notes</Label>
              <Textarea
                placeholder="Any additional notes about the delivery..."
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Digital Signature */}
        {step === "sign" && (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Pen className="w-4 h-4" />
              Digital Signature
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receiver Name *</Label>
                <Input
                  placeholder="Full name"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  placeholder="+966 5X XXX XXXX"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signature</Label>
              <div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <Pen className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Sign here on mobile device</p>
                  <p className="text-xs">Touch and draw your signature</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By signing, you confirm receipt of the goods as documented above.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h5 className="font-medium text-sm">Delivery Summary</h5>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Received</span>
                  <span className="font-medium">{itemChecks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photos Attached</span>
                  <span className="font-medium">{photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discrepancies</span>
                  <span className={cn("font-medium", hasDiscrepancies ? "text-warning" : "text-success")}>
                    {hasDiscrepancies ? "Yes" : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step !== "verify" && (
            <Button
              variant="outline"
              onClick={() =>
                setStep(step === "sign" ? "photo" : "verify")
              }
            >
              Back
            </Button>
          )}

          {step === "verify" && (
            <Button onClick={() => setStep("photo")}>
              Next: Add Photos
            </Button>
          )}

          {step === "photo" && (
            <Button onClick={() => setStep("sign")}>
              Next: Sign & Confirm
            </Button>
          )}

          {step === "sign" && (
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !receiverName || !receiverPhone}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="w-4 h-4 me-2" />
              {isSubmitting ? "Confirming..." : "Confirm Delivery"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
