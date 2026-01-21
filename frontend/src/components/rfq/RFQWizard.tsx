import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const lineItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  specifications: z.string().optional(),
  brand: z.string().optional(),
});

const rfqSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  category: z.string().min(1, "Category is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  quoteValidity: z.string().min(1, "Quote validity is required"),
  priority: z.string().optional(),
  siteContactName: z.string().min(1, "Site contact name is required"),
  siteContactPhone: z.string().min(1, "Site contact phone is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional(),
  allowPartialBids: z.boolean().optional(),
});

type RFQFormData = z.infer<typeof rfqSchema>;

type ApiProject = {
  id: string;
  name: string;
};

const categories = [
  "Building Materials",
  "Steel & Metal",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Finishing Materials",
  "Safety Equipment",
];

const units = ["Pieces", "Tons", "Kg", "Meters", "Sq. Meters", "Cu. Meters", "Bags", "Pallets", "Liters", "Rolls"];

const paymentTermsOptions = [
  { value: "cash", label: "Cash on Delivery", description: "Payment upon delivery" },
  { value: "credit_30", label: "Credit 30 Days", description: "Net 30 payment terms" },
  { value: "credit_60", label: "Credit 60 Days", description: "Net 60 payment terms" },
  { value: "credit_90", label: "Credit 90 Days", description: "Net 90 payment terms" },
  { value: "cheque", label: "Post-Dated Cheque", description: "Payment via cheque" },
  { value: "lc", label: "Letter of Credit", description: "LC payment" },
];

const quoteValidityOptions = [
  { value: "24h", label: "24 Hours" },
  { value: "48h", label: "48 Hours" },
  { value: "72h", label: "72 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "14 Days" },
  { value: "30d", label: "30 Days" },
];

const priorityOptions = [
  { value: "urgent", label: "Urgent", color: "text-danger" },
  { value: "high", label: "High Priority", color: "text-warning" },
  { value: "normal", label: "Normal", color: "text-foreground" },
  { value: "low", label: "Low Priority", color: "text-muted-foreground" },
];

const steps = [
  { id: 1, titleKey: "rfq_builder.steps.project.title", descriptionKey: "rfq_builder.steps.project.desc" },
  { id: 2, titleKey: "rfq_builder.steps.items.title", descriptionKey: "rfq_builder.steps.items.desc" },
  { id: 3, titleKey: "rfq_builder.steps.terms.title", descriptionKey: "rfq_builder.steps.terms.desc" },
  { id: 4, titleKey: "rfq_builder.steps.review.title", descriptionKey: "rfq_builder.steps.review.desc" },
];

export function RFQWizard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const { data: projectsData, isLoading: projectsLoading, isError: projectsError } = useQuery<ApiProject[]>({
    queryKey: ["projects", "for-rfq"],
    queryFn: async () => {
      const response = await api.get("/projects");
      return response.data;
    },
  });

  const projects = useMemo(() => projectsData || [], [projectsData]);

  const form = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      projectId: "",
      category: "",
      deliveryDate: "",
      deliveryLocation: "",
      paymentTerms: "",
      quoteValidity: "48h",
      priority: "normal",
      siteContactName: "",
      siteContactPhone: "",
      lineItems: [{ productName: "", quantity: 1, unit: "", specifications: "", brand: "" }],
      notes: "",
      allowPartialBids: true,
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
      isValid = await form.trigger(["projectId", "category", "deliveryDate", "deliveryLocation", "siteContactName", "siteContactPhone"]);
    } else if (currentStep === 2) {
      isValid = await form.trigger("lineItems");
    } else if (currentStep === 3) {
      isValid = await form.trigger(["paymentTerms", "quoteValidity"]);
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please log in again to submit an RFQ.",
      });
      return;
    }

    try {
      const values = form.getValues();

      const paymentTermValue = (() => {
        if (values.paymentTerms.startsWith("credit")) return "CREDIT";
        if (values.paymentTerms === "cash") return "CASH";
        if (values.paymentTerms === "cheque" || values.paymentTerms === "lc") return "CHEQUE";
        return null;
      })();

      await api.post("/rfqs", {
        project: { connect: { id: values.projectId } },
        created_user: { connect: { id: user.id } },
        deadline: values.deliveryDate ? new Date(values.deliveryDate) : null,
        payment_terms: paymentTermValue,
        delivery_date_required: values.deliveryDate ? new Date(values.deliveryDate) : null,
        items: {
          create: values.lineItems.map((item) => ({
            product_name: item.productName,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      });

      toast({
        title: t("rfq_builder.toast.submitted"),
        description: t("rfq_builder.toast.submitted_desc"),
      });
      form.reset();
      setUploadedFiles([]);
      setCurrentStep(1);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to submit RFQ",
        description: error?.response?.data?.message || "Please try again later.",
      });
    }
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
                    {t(step.titleKey)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(step.descriptionKey)}</p>
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
          {/* Step 1: Project & Delivery */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.sections.project_category")}</h3>
                <p className="text-sm text-muted-foreground">{t("rfq_builder.sections.project_category_desc")}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project">{t("rfq_builder.form.project_label")}</Label>
                  {projectsLoading ? (
                    <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
                  ) : projectsError ? (
                    <div className="text-sm text-danger">Failed to load projects</div>
                  ) : (
                    <Select
                      value={watchedValues.projectId}
                      onValueChange={(value) => form.setValue("projectId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("rfq_builder.form.project_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {form.formState.errors.projectId && (
                    <p className="text-sm text-danger">{form.formState.errors.projectId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t("rfq_builder.form.category_label")}</Label>
                  <Select
                    value={watchedValues.category}
                    onValueChange={(value) => form.setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rfq_builder.form.category_placeholder")} />
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
                  <Label htmlFor="priority">{t("rfq_builder.form.priority_label")}</Label>
                  <Select
                    value={watchedValues.priority}
                    onValueChange={(value) => form.setValue("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rfq_builder.form.priority_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className={option.color}>{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">{t("rfq_builder.form.delivery_date_label")}</Label>
                  <Input
                    type="date"
                    {...form.register("deliveryDate")}
                    className="tabular-nums"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {form.formState.errors.deliveryDate && (
                    <p className="text-sm text-danger">{form.formState.errors.deliveryDate.message}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.sections.delivery_contact")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("rfq_builder.sections.delivery_contact_desc")}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="deliveryLocation">{t("rfq_builder.form.delivery_location_label")}</Label>
                    <Input
                      placeholder={t("rfq_builder.form.delivery_location_placeholder")}
                      {...form.register("deliveryLocation")}
                    />
                    {form.formState.errors.deliveryLocation && (
                      <p className="text-sm text-danger">{form.formState.errors.deliveryLocation.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{t("rfq_builder.form.delivery_location_help")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteContactName">{t("rfq_builder.form.contact_name_label")}</Label>
                    <Input
                      placeholder={t("rfq_builder.form.contact_name_placeholder")}
                      {...form.register("siteContactName")}
                    />
                    {form.formState.errors.siteContactName && (
                      <p className="text-sm text-danger">{form.formState.errors.siteContactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteContactPhone">{t("rfq_builder.form.contact_phone_label")}</Label>
                    <Input
                      placeholder={t("rfq_builder.form.contact_phone_placeholder")}
                      {...form.register("siteContactPhone")}
                    />
                    {form.formState.errors.siteContactPhone && (
                      <p className="text-sm text-danger">{form.formState.errors.siteContactPhone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Line Items */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.sections.line_items")}</h3>
                <p className="text-sm text-muted-foreground">{t("rfq_builder.sections.line_items_desc")}</p>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-muted/30 rounded-lg border border-border space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{t("rfq_builder.items.item_number", { number: index + 1 })}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length === 1}
                        className="text-muted-foreground hover:text-danger h-8"
                      >
                        <Trash2 className="w-4 h-4 me-1" />
                        {t("rfq_builder.items.remove")}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 md:col-span-5 space-y-1">
                        <Label className="text-xs">{t("rfq_builder.items.product_name")}</Label>
                        <Input
                          placeholder={t("rfq_builder.items.product_placeholder")}
                          {...form.register(`lineItems.${index}.productName`)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-1">
                        <Label className="text-xs">{t("rfq_builder.items.brand")}</Label>
                        <Input
                          placeholder={t("rfq_builder.items.brand_placeholder")}
                          {...form.register(`lineItems.${index}.brand`)}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <Label className="text-xs">{t("rfq_builder.items.quantity")}</Label>
                        <Input
                          type="number"
                          min="1"
                          className="tabular-nums"
                          {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <Label className="text-xs">{t("rfq_builder.items.unit")}</Label>
                        <Select
                          value={watchedValues.lineItems[index]?.unit}
                          onValueChange={(value) => form.setValue(`lineItems.${index}.unit`, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("rfq_builder.items.unit_placeholder")} />
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
                      <div className="col-span-12 space-y-1">
                        <Label className="text-xs">{t("rfq_builder.items.specs")}</Label>
                        <Input
                          placeholder={t("rfq_builder.items.specs_placeholder")}
                          {...form.register(`lineItems.${index}.specifications`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ productName: "", quantity: 1, unit: "", specifications: "", brand: "" })}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 me-2" />
                {t("rfq_builder.items.add_item")}
              </Button>

              {form.formState.errors.lineItems && (
                <p className="text-sm text-danger">{form.formState.errors.lineItems.message}</p>
              )}
            </div>
          )}

          {/* Step 3: Terms & Documents */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              {/* Payment Terms Section - FR-C03 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.sections.terms_docs")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("rfq_builder.sections.terms_docs_desc")}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t("rfq_builder.form.payment_terms_label")}</Label>
                  <Select
                    value={watchedValues.paymentTerms}
                    onValueChange={(value) => form.setValue("paymentTerms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rfq_builder.form.payment_terms_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.paymentTerms && (
                    <p className="text-sm text-danger">{form.formState.errors.paymentTerms.message}</p>
                  )}
                  {watchedValues.paymentTerms && (
                    <p className="text-xs text-muted-foreground">
                      {paymentTermsOptions.find(o => o.value === watchedValues.paymentTerms)?.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("rfq_builder.form.quote_validity_label")}</Label>
                  <Select
                    value={watchedValues.quoteValidity}
                    onValueChange={(value) => form.setValue("quoteValidity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rfq_builder.form.quote_validity_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteValidityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.quoteValidity && (
                    <p className="text-sm text-danger">{form.formState.errors.quoteValidity.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t("rfq_builder.form.quote_validity_help")}</p>
                </div>
              </div>

              {/* Partial Bids Option - FR-C06 */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <Label className="text-sm font-medium">{t("rfq_builder.form.partial_bids_label")}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("rfq_builder.form.partial_bids_desc")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={watchedValues.allowPartialBids}
                  onChange={(e) => form.setValue("allowPartialBids", e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
              </div>

              {/* Document Upload Section - FR-C02 */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.form.upload_title")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("rfq_builder.form.upload_desc")}
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
                  accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium text-foreground">{t("rfq_builder.form.drop_files")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("rfq_builder.form.file_types")}</p>
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
                <Label>{t("rfq_builder.form.notes_label")}</Label>
                <Textarea
                  placeholder={t("rfq_builder.form.notes_placeholder")}
                  rows={4}
                  {...form.register("notes")}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("rfq_builder.sections.review")}</h3>
                <p className="text-sm text-muted-foreground">{t("rfq_builder.sections.review_desc")}</p>
              </div>

              {/* Project & Delivery Info */}
              <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
                  {t("rfq_builder.steps.project.title")}
                </h4>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.project")}</p>
                    <p className="font-medium">{selectedProject?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.category")}</p>
                    <p className="font-medium">{watchedValues.category || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.priority")}</p>
                    <p className={cn(
                      "font-medium",
                      priorityOptions.find(p => p.value === watchedValues.priority)?.color
                    )}>
                      {priorityOptions.find(p => p.value === watchedValues.priority)?.label || "Normal"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.delivery_date")}</p>
                    <p className="font-medium tabular-nums">{watchedValues.deliveryDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.location")}</p>
                    <p className="font-medium">{watchedValues.deliveryLocation || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.site_contact")}</p>
                    <p className="font-medium">{watchedValues.siteContactName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{watchedValues.siteContactPhone || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
                  <h4 className="font-medium text-sm">{t("rfq_builder.review.line_items")} ({watchedValues.lineItems.length})</h4>
                </div>
                <div className="divide-y divide-border">
                  {watchedValues.lineItems.map((item, index) => (
                    <div key={index} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.productName || "-"}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {item.brand && <span>Brand: {item.brand}</span>}
                          {item.specifications && <span>• {item.specifications}</span>}
                        </div>
                      </div>
                      <p className="text-sm tabular-nums font-medium">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">3</span>
                  {t("rfq_builder.steps.terms.title")}
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.payment_terms")}</p>
                    <p className="font-medium">
                      {paymentTermsOptions.find(p => p.value === watchedValues.paymentTerms)?.label || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.quote_validity")}</p>
                    <p className="font-medium">
                      {quoteValidityOptions.find(q => q.value === watchedValues.quoteValidity)?.label || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("rfq_builder.review.partial_bids")}</p>
                    <p className="font-medium">{watchedValues.allowPartialBids ? t("rfq_builder.review.allowed") : t("rfq_builder.review.not_allowed")}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {uploadedFiles.length > 0 && (
                <div className="bg-muted/30 rounded-lg border border-border p-4">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">4</span>
                    {t("rfq_builder.review.documents")} ({uploadedFiles.length})
                  </h4>
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

              {/* Notes */}
              {watchedValues.notes && (
                <div className="bg-muted/30 rounded-lg border border-border p-4">
                  <h4 className="font-medium text-sm mb-2">{t("rfq_builder.review.additional_notes")}</h4>
                  <p className="text-sm text-muted-foreground">{watchedValues.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Sidebar - Desktop only */}
        <div className="hidden lg:block w-80 border-s border-border bg-muted/30 p-4">
          <h4 className="font-semibold text-sm mb-4">{t("rfq_builder.review.summary_title")}</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.card.items")}</span>
              <span className="font-medium">{watchedValues.lineItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.review.documents")}</span>
              <span className="font-medium">{uploadedFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.review.category")}</span>
              <span className="font-medium truncate max-w-28">{watchedValues.category || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.review.payment")}</span>
              <span className="font-medium truncate max-w-28">
                {paymentTermsOptions.find(p => p.value === watchedValues.paymentTerms)?.label || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.review.quote_validity")}</span>
              <span className="font-medium">
                {quoteValidityOptions.find(q => q.value === watchedValues.quoteValidity)?.label || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("rfq_builder.review.partial_bids")}</span>
              <span className="font-medium">{watchedValues.allowPartialBids ? t("rfq_builder.review.allowed") : t("rfq_builder.review.not_allowed")}</span>
            </div>
          </div>

          {/* Priority Badge */}
          {watchedValues.priority && watchedValues.priority !== "normal" && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className={cn(
                "text-sm font-medium",
                priorityOptions.find(p => p.value === watchedValues.priority)?.color
              )}>
                {priorityOptions.find(p => p.value === watchedValues.priority)?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("rfq_builder.review.priority_highlight")}</p>
            </div>
          )}
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
          {t("rfq_builder.actions.previous")}
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            {t("rfq_builder.actions.next")}
            <ChevronRight className="w-4 h-4 ms-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-success hover:bg-success/90 text-success-foreground">
            <Check className="w-4 h-4 me-2" />
            {t("rfq_builder.actions.submit")}
          </Button>
        )}
      </div>
    </div>
  );
}
