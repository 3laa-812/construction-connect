import { useState } from "react";
import { Star, Truck, Package, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface SupplierRatingProps {
  orderId: string;
  supplier: string;
  supplierNameAr?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: RatingData) => void;
}

interface RatingData {
  orderId: string;
  supplier: string;
  deliveryRating: number;
  qualityRating: number;
  communicationRating: number;
  overallRating: number;
  review: string;
  timestamp: string;
}

const ratingCategories = [
  {
    key: "delivery",
    label: "Delivery Time",
    labelAr: "وقت التسليم",
    icon: Truck,
    description: "Was the delivery on time?",
  },
  {
    key: "quality",
    label: "Product Quality",
    labelAr: "جودة المنتج",
    icon: Package,
    description: "Did the products meet specifications?",
  },
  {
    key: "communication",
    label: "Communication",
    labelAr: "التواصل",
    icon: MessageSquare,
    description: "How responsive was the supplier?",
  },
];

function StarRating({
  value,
  onChange,
  size = "default",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "default" | "large";
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={cn(
            "transition-transform hover:scale-110",
            size === "large" ? "p-1" : "p-0.5"
          )}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              "transition-colors",
              size === "large" ? "w-8 h-8" : "w-6 h-6",
              (hovered || value) >= star
                ? "text-warning fill-warning"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
      <span
        className={cn(
          "text-muted-foreground ms-2 tabular-nums",
          size === "large" ? "text-lg" : "text-sm"
        )}
      >
        {value > 0 ? `${value}/5` : ""}
      </span>
    </div>
  );
}

export function SupplierRating({
  orderId,
  supplier,
  supplierNameAr,
  open,
  onOpenChange,
  onSubmit,
}: SupplierRatingProps) {
  const [ratings, setRatings] = useState({
    delivery: 0,
    quality: 0,
    communication: 0,
  });
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallRating =
    ratings.delivery > 0 && ratings.quality > 0 && ratings.communication > 0
      ? Math.round(
          ((ratings.delivery + ratings.quality + ratings.communication) / 3) *
            10
        ) / 10
      : 0;

  const canSubmit =
    ratings.delivery > 0 && ratings.quality > 0 && ratings.communication > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const ratingData: RatingData = {
        orderId,
        supplier,
        deliveryRating: ratings.delivery,
        qualityRating: ratings.quality,
        communicationRating: ratings.communication,
        overallRating,
        review,
        timestamp: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Rating Submitted",
        description: `Thank you for rating ${supplier}`,
      });

      onSubmit?.(ratingData);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRatings({ delivery: 0, quality: 0, communication: 0 });
    setReview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" />
            Rate Supplier
          </DialogTitle>
          <DialogDescription>
            Share your experience with this supplier to help other buyers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Supplier Info */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-primary font-bold">
                {supplier.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{supplier}</h4>
              {supplierNameAr && (
                <p className="text-sm text-muted-foreground" dir="rtl">
                  {supplierNameAr}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Order: {orderId}
              </p>
            </div>
          </div>

          {/* Rating Categories - FR-D05 */}
          <div className="space-y-4">
            {ratingCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label className="font-medium">{category.label}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                  <StarRating
                    value={ratings[category.key as keyof typeof ratings]}
                    onChange={(value) =>
                      setRatings((prev) => ({
                        ...prev,
                        [category.key]: value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Overall Rating Display */}
          {canSubmit && (
            <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Overall Rating</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-8 h-8 text-warning fill-warning" />
                <span className="text-3xl font-bold text-primary tabular-nums">
                  {overallRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-lg">/ 5</span>
              </div>
            </div>
          )}

          {/* Written Review */}
          <div className="space-y-2">
            <Label>Written Review (Optional)</Label>
            <Textarea
              placeholder="Share more details about your experience with this supplier..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Your review helps other buyers make informed decisions
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleReset} className="sm:me-auto">
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            <Send className="w-4 h-4 me-2" />
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
