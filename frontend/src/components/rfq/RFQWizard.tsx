import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const STEPS = [
  { id: 1, name: "Materials" },
  { id: 2, name: "Delivery" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Review" },
];

export function RFQWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_name: "Steel Rebar 16mm",
    quantity: "100",
    unit: "Ton",
    project_id: "",
    delivery_date_required: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    payment_terms: "CREDIT",
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get("/projects");
      return data;
    },
  });

  useEffect(() => {
    if (projects?.length && !formData.project_id) {
      setFormData(prev => ({ ...prev, project_id: projects[0].id }));
    }
  }, [projects, formData.project_id]);

  const createRfq = useMutation({
    mutationFn: async (rfqData: typeof formData) => {
      const payload = {
        project: { connect: { id: rfqData.project_id } },
        status: "OPEN",
        payment_terms: rfqData.payment_terms,
        delivery_date_required: new Date(rfqData.delivery_date_required).toISOString(),
        items: {
          create: [
            {
              product_name: rfqData.product_name,
              quantity: Number(rfqData.quantity),
              unit: rfqData.unit,
            },
          ]
        },
      };
      const { data } = await api.post("/rfqs", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast({ title: "RFQ Created successfully" });
      navigate("/rfqs");
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-8 bg-surface border border-border rounded-md p-6">
        <div className="md:w-[200px] shrink-0 sticky top-24 h-max">
          <div className="pr-4 flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-8 relative">
            <div className="hidden md:block absolute left-[11px] top-[14px] bottom-[14px] w-[2px] bg-border-2" />
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              return (
                <div key={step.id} className="flex flex-col md:flex-row items-center gap-3 relative z-10 bg-surface">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-colors ${
                      isCompleted ? "bg-amber border-amber text-ground" : isActive ? "border-amber text-amber bg-surface" : "border-border-2 text-text-3 bg-surface"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 text-ground stroke-[3px]" /> : step.id}
                  </div>
                  <span className={`text-[13px] font-medium hidden md:block ${isActive || isCompleted ? "text-text-1" : "text-text-3"}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col pt-2 min-h-[400px]">
          <h2 className="text-[18px] font-display text-text-1 mb-6">
            Step {currentStep}: {STEPS[currentStep - 1].name}
          </h2>

          <div className="flex-1">
            {currentStep === 1 && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs text-text-2">Product Name</label>
                  <Input value={formData.product_name} onChange={e => setFormData({ ...formData, product_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-2">Quantity</label>
                    <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-text-2">Unit</label>
                    <Input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs text-text-2">Project</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={formData.project_id} 
                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  >
                    {projects?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-2">Delivery Date</label>
                  <Input type="date" value={formData.delivery_date_required} onChange={e => setFormData({ ...formData, delivery_date_required: e.target.value })} />
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4 max-w-md">
                 <div>
                  <label className="text-xs text-text-2">Payment Terms</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={formData.payment_terms} 
                    onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                  >
                    <option value="CREDIT">Credit</option>
                    <option value="CASH">Cash on Delivery</option>
                  </select>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="bg-surface-2 p-6 rounded border border-border text-[13px] text-text-2 group relative">
                <span className="absolute top-4 right-4 text-amber opacity-0 group-hover:opacity-100 cursor-pointer font-medium transition-opacity">
                  Edit
                </span>
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-text-3 text-[10px] uppercase tracking-wider mb-1">Materials</p>
                    <p className="text-text-1 font-medium">{formData.product_name} ({formData.quantity} {formData.unit})</p>
                  </div>
                  <div>
                    <p className="text-text-3 text-[10px] uppercase tracking-wider mb-1">Project</p>
                    <p className="text-text-1 font-medium">{projects?.find((p: any) => p.id === formData.project_id)?.name}</p>
                  </div>
                  <div>
                    <p className="text-text-3 text-[10px] uppercase tracking-wider mb-1">Delivery Date</p>
                    <p className="text-text-1 font-medium">{formData.delivery_date_required}</p>
                  </div>
                  <div>
                    <p className="text-text-3 text-[10px] uppercase tracking-wider mb-1">Payment</p>
                    <p className="text-text-1 font-medium">{formData.payment_terms}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
            <Button variant="outline" onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))} disabled={currentStep === 1 || createRfq.isPending}>
              Back
            </Button>
            <Button
              onClick={() => {
                if (currentStep === 4) {
                  createRfq.mutate(formData);
                } else {
                  setCurrentStep((prev) => Math.min(4, prev + 1));
                }
              }}
              disabled={createRfq.isPending}
            >
              {currentStep === 4 ? (createRfq.isPending ? 'Submitting...' : 'Submit RFQ') : "Continue →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
