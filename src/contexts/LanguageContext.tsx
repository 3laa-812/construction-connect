import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.rfqs": "RFQs",
    "nav.bids": "Bids",
    "nav.orders": "Orders",
    "nav.suppliers": "Suppliers",
    "nav.projects": "Projects",
    "nav.approvals": "Approvals",
    "nav.financials": "Financials",
    "nav.supplier_portal": "Supplier Portal",
    "nav.settings": "Settings",
    "nav.more": "More",
    
    // Common
    "common.search": "Search",
    "common.search_placeholder": "Search RFQs, Orders, Suppliers...",
    "common.notifications": "Notifications",
    "common.profile": "Profile",
    "common.sign_out": "Sign out",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.view": "View",
    "common.download": "Download",
    "common.upload": "Upload",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.date": "Date",
    "common.amount": "Amount",
    "common.total": "Total",
    "common.items": "Items",
    "common.notes": "Notes",
    "common.back": "Back",
    "common.next": "Next",
    "common.finish": "Finish",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
    "common.no_data": "No data available",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.active_rfqs": "Active RFQs",
    "dashboard.pending_orders": "Pending Orders",
    "dashboard.total_suppliers": "Total Suppliers",
    "dashboard.monthly_spend": "Monthly Spend",
    "dashboard.recent_activity": "Recent Activity",
    "dashboard.pending_approvals": "Pending Approvals",
    "dashboard.vs_last_month": "vs last month",
    
    // RFQs
    "rfq.title": "RFQ Management",
    "rfq.create_new": "Create New RFQ",
    "rfq.rfq_number": "RFQ Number",
    "rfq.project": "Project",
    "rfq.deadline": "Deadline",
    "rfq.bids_received": "Bids Received",
    "rfq.closing_soon": "Closing Soon",
    "rfq.wizard.header": "Header Information",
    "rfq.wizard.line_items": "Line Items",
    "rfq.wizard.delivery": "Delivery",
    "rfq.wizard.review": "Review & Submit",
    
    // Bids
    "bids.title": "Bid Management",
    "bids.compare": "Compare Bids",
    "bids.award": "Award",
    "bids.reject": "Reject",
    "bids.supplier": "Supplier",
    "bids.unit_price": "Unit Price",
    "bids.delivery_days": "Delivery Days",
    "bids.score": "Score",
    
    // Orders
    "orders.title": "Order Management",
    "orders.order_number": "Order Number",
    "orders.supplier": "Supplier",
    "orders.delivery_date": "Delivery Date",
    "orders.grn": "Goods Received Note",
    "orders.rate_supplier": "Rate Supplier",
    "orders.track": "Track",
    
    // Suppliers
    "suppliers.title": "Supplier Management",
    "suppliers.add_new": "Add New Supplier",
    "suppliers.company_name": "Company Name",
    "suppliers.contact": "Contact",
    "suppliers.rating": "Rating",
    "suppliers.categories": "Categories",
    
    // Financials
    "financials.title": "Financial Management",
    "financials.invoices": "Invoices",
    "financials.payments": "Payments",
    "financials.wallet": "Wallet Ledger",
    "financials.total_spent": "Total Spent",
    "financials.outstanding": "Outstanding",
    "financials.this_month": "This Month",
    
    // Settings
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.notifications": "Notifications",
    "settings.team": "Team",
    "settings.catalog": "Catalog",
    "settings.integrations": "Integrations",
    
    // Status
    "status.pending": "Pending",
    "status.approved": "Approved",
    "status.rejected": "Rejected",
    "status.active": "Active",
    "status.closed": "Closed",
    "status.completed": "Completed",
    "status.in_progress": "In Progress",
    "status.delivered": "Delivered",
    "status.cancelled": "Cancelled",
    
    // Notifications
    "notification.new_bid": "New Bid",
    "notification.order_confirmed": "Order Confirmed",
    "notification.out_for_delivery": "Out for Delivery",
    "notification.delivered": "Delivered",
    
    // Language
    "language.english": "English",
    "language.arabic": "العربية",
  },
  ar: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.rfqs": "طلبات عروض الأسعار",
    "nav.bids": "العروض",
    "nav.orders": "الطلبات",
    "nav.suppliers": "الموردين",
    "nav.projects": "المشاريع",
    "nav.approvals": "الموافقات",
    "nav.financials": "المالية",
    "nav.supplier_portal": "بوابة الموردين",
    "nav.settings": "الإعدادات",
    "nav.more": "المزيد",
    
    // Common
    "common.search": "بحث",
    "common.search_placeholder": "البحث في طلبات الأسعار، الطلبات، الموردين...",
    "common.notifications": "الإشعارات",
    "common.profile": "الملف الشخصي",
    "common.sign_out": "تسجيل الخروج",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.submit": "إرسال",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.view": "عرض",
    "common.download": "تنزيل",
    "common.upload": "رفع",
    "common.actions": "الإجراءات",
    "common.status": "الحالة",
    "common.date": "التاريخ",
    "common.amount": "المبلغ",
    "common.total": "الإجمالي",
    "common.items": "العناصر",
    "common.notes": "ملاحظات",
    "common.back": "السابق",
    "common.next": "التالي",
    "common.finish": "إنهاء",
    "common.close": "إغلاق",
    "common.confirm": "تأكيد",
    "common.loading": "جاري التحميل...",
    "common.no_data": "لا توجد بيانات",
    
    // Dashboard
    "dashboard.title": "لوحة التحكم",
    "dashboard.active_rfqs": "طلبات الأسعار النشطة",
    "dashboard.pending_orders": "الطلبات المعلقة",
    "dashboard.total_suppliers": "إجمالي الموردين",
    "dashboard.monthly_spend": "الإنفاق الشهري",
    "dashboard.recent_activity": "النشاط الأخير",
    "dashboard.pending_approvals": "الموافقات المعلقة",
    "dashboard.vs_last_month": "مقارنة بالشهر الماضي",
    
    // RFQs
    "rfq.title": "إدارة طلبات عروض الأسعار",
    "rfq.create_new": "إنشاء طلب جديد",
    "rfq.rfq_number": "رقم الطلب",
    "rfq.project": "المشروع",
    "rfq.deadline": "الموعد النهائي",
    "rfq.bids_received": "العروض المستلمة",
    "rfq.closing_soon": "يغلق قريباً",
    "rfq.wizard.header": "معلومات الرأس",
    "rfq.wizard.line_items": "بنود الطلب",
    "rfq.wizard.delivery": "التسليم",
    "rfq.wizard.review": "المراجعة والإرسال",
    
    // Bids
    "bids.title": "إدارة العروض",
    "bids.compare": "مقارنة العروض",
    "bids.award": "ترسية",
    "bids.reject": "رفض",
    "bids.supplier": "المورد",
    "bids.unit_price": "سعر الوحدة",
    "bids.delivery_days": "أيام التسليم",
    "bids.score": "النتيجة",
    
    // Orders
    "orders.title": "إدارة الطلبات",
    "orders.order_number": "رقم الطلب",
    "orders.supplier": "المورد",
    "orders.delivery_date": "تاريخ التسليم",
    "orders.grn": "إشعار استلام البضائع",
    "orders.rate_supplier": "تقييم المورد",
    "orders.track": "تتبع",
    
    // Suppliers
    "suppliers.title": "إدارة الموردين",
    "suppliers.add_new": "إضافة مورد جديد",
    "suppliers.company_name": "اسم الشركة",
    "suppliers.contact": "جهة الاتصال",
    "suppliers.rating": "التقييم",
    "suppliers.categories": "الفئات",
    
    // Financials
    "financials.title": "الإدارة المالية",
    "financials.invoices": "الفواتير",
    "financials.payments": "المدفوعات",
    "financials.wallet": "سجل المحفظة",
    "financials.total_spent": "إجمالي الإنفاق",
    "financials.outstanding": "المستحقات",
    "financials.this_month": "هذا الشهر",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.general": "عام",
    "settings.notifications": "الإشعارات",
    "settings.team": "الفريق",
    "settings.catalog": "الكتالوج",
    "settings.integrations": "التكاملات",
    
    // Status
    "status.pending": "قيد الانتظار",
    "status.approved": "موافق عليه",
    "status.rejected": "مرفوض",
    "status.active": "نشط",
    "status.closed": "مغلق",
    "status.completed": "مكتمل",
    "status.in_progress": "قيد التنفيذ",
    "status.delivered": "تم التسليم",
    "status.cancelled": "ملغي",
    
    // Notifications
    "notification.new_bid": "عرض جديد",
    "notification.order_confirmed": "تم تأكيد الطلب",
    "notification.out_for_delivery": "خرج للتسليم",
    "notification.delivered": "تم التسليم",
    
    // Language
    "language.english": "English",
    "language.arabic": "العربية",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved === "ar" || saved === "en") ? saved : "en";
  });

  const isRTL = language === "ar";

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", language);
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
