import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Plus, Trash2, Upload, FileText, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const lineItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  specifications: z.string().optional(),
});

const rfqSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  category: z.string().min(1, "Category is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional(),
});

type RFQFormData = z.infer<typeof rfqSchema>;

const projects = [
  { id: "proj-001", name: "Al-Faisaliah Tower Renovation" },
  { id: "proj-002", name: "King Abdullah Financial District - Phase 3" },
  { id: "proj-003", name: "Riyadh Metro Station Finishing" },
  { id: "proj-004", name: "Jeddah Waterfront Development" },
];

const categories = [
  "Building Materials",
  "Steel & Metal",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Finishing Materials",
  "Safety Equipment",
];

const units = ["Pieces", "Tons", "Kg", "Meters", "Sq. Meters", "Cu. Meters", "Bags", "Pallets"];

const steps = [
  { id: 1, title: "Project & Category", description: "Select project and category" },
  { id: 2, title: "Line Items", description: "Add products and quantities" },
  { id: 3, title: "Documents", description: "Upload BOQ and specifications" },
  { id: 4, title: "Review", description: "Review and submit" },
];

export function RFQWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      projectId: "",
      category: "",
      deliveryDate: "",
      deliveryLocation: "",
      lineItems: [{ productName: "", quantity: 1, unit: "", specifications: "" }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedValues = form.watch();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 1) {
      isValid = await form.trigger(["projectId", "category", "deliveryDate", "deliveryLocation"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger("lineItems");
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "RFQ Submitted",
      description: "Your request for quotation has been sent to suppliers.",
    });
  };

  const selectedProject = projects.find((p) => p.id === watchedValues.projectId);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header with Steps */}
      <div className="bg-muted/50 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    currentStep > step.id
                      ? "bg-success text-success-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border-2 border-border"
                  )}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div className="hidden md:block">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 md:w-16 h-0.5 mx-2 md:mx-4",
                  currentStep > step.id ? "bg-success" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Main Form Area */}
        <div className="flex-1 p-6">
          {/* Step 1: Project & Category */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={watchedValues.projectId}
                    onValueChange={(value) => form.setValue("projectId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.projectId && (
                    <p className="text-sm text-danger">{form.formState.errors.projectId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={watchedValues.category}
                    onValueChange={(value) => form.setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-danger">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Required Delivery Date *</Label>
                  <Input
                    type="date"
                    {...form.register("deliveryDate")}
                    className="tabular-nums"
                  />
                  {form.formState.errors.deliveryDate && (
                    <p className="text-sm text-danger">{form.formState.errors.deliveryDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Delivery Location *</Label>
                  <Input
                    placeholder="e.g., Site B, King Fahd Road"
                    {...form.register("deliveryLocation")}
                  />
                  {form.formState.errors.deliveryLocation && (
                    <p className="text-sm text-danger">{form.formState.errors.deliveryLocation.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Line Items */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="col-span-12 md:col-span-4 space-y-1">
                      <Label className="text-xs">Product Name *</Label>
                      <Input
                        placeholder="e.g., Portland Cement Type I"
                        {...form.register(`lineItems.${index}.productName`)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        className="tabular-nums"
                        {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">Unit *</Label>
                      <Select
                        value={watchedValues.lineItems[index]?.unit}
                        onValueChange={(value) => form.setValue(`lineItems.${index}.unit`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 md:col-span-3 space-y-1">
                      <Label className="text-xs">Specifications</Label>
                      <Input
                        placeholder="Optional specs"
                        {...form.register(`lineItems.${index}.specifications`)}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length === 1}
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ productName: "", quantity: 1, unit: "", specifications: "" })}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 me-2" />
                Add Line Item
              </Button>

              {form.formState.errors.lineItems && (
                <p className="text-sm text-danger">{form.formState.errors.lineItems.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-base font-medium">Upload BOQ / Specifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload PDF or Excel files containing Bill of Quantities or detailed specifications
                </p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  "hover:border-primary hover:bg-primary/5 cursor-pointer"
                )}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium text-foreground">Drop files here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, Excel (max 25MB each)</p>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any special requirements or notes for suppliers..."
                  rows={4}
                  {...form.register("notes")}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-4">
                <h3 className="font-semibold text-foreground">RFQ Summary</h3>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Project</p>
                    <p className="font-medium">{selectedProject?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{watchedValues.category || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivery Date</p>
                    <p className="font-medium tabular-nums">{watchedValues.deliveryDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{watchedValues.deliveryLocation || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/50">
                  <h4 className="font-medium text-sm">Line Items ({watchedValues.lineItems.length})</h4>
                </div>
                <div className="divide-y divide-border">
                  {watchedValues.lineItems.map((item, index) => (
                    <div key={index} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.productName || "-"}</p>
                        {item.specifications && (
                          <p className="text-xs text-muted-foreground">{item.specifications}</p>
                        )}
                      </div>
                      <p className="text-sm tabular-nums font-medium">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-muted/30 rounded-lg border border-border p-4">
                  <h4 className="font-medium text-sm mb-2">Attached Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Sidebar - Desktop only */}
        <div className="hidden lg:block w-72 border-s border-border bg-muted/30 p-4">
          <h4 className="font-semibold text-sm mb-4">Quick Summary</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{watchedValues.lineItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documents</span>
              <span className="font-medium">{uploadedFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium truncate max-w-24">{watchedValues.category || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border px-6 py-4 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 me-2" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ms-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-success hover:bg-success/90 text-success-foreground">
            <Check className="w-4 h-4 me-2" />
            Submit RFQ
          </Button>
        )}
      </div>
    </div>
  );
}
