import { AppLayout } from "@/components/layout/AppLayout";
import { RFQWizard } from "@/components/rfq/RFQWizard";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RFQBuilder = () => {
  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Create RFQ</h1>
            <p className="text-muted-foreground mt-1">
              Request for Quotation from your supplier network
            </p>
          </div>
        </div>

        {/* RFQ Wizard */}
        <RFQWizard />
      </div>
    </AppLayout>
  );
};

export default RFQBuilder;
