import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SyncProvider } from "@/contexts/SyncContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Onboarding from "./pages/Onboarding";

import Index from "./pages/Index";
import RFQBuilder from "./pages/RFQBuilder";
import RFQs from "./pages/RFQs";
import Bids from "./pages/Bids";
import Orders from "./pages/Orders";
import Projects from "./pages/Projects";
import Suppliers from "./pages/Suppliers";
import Approvals from "./pages/Approvals";
import Settings from "./pages/Settings";
import SupplierRFQFeed from "./pages/SupplierRFQFeed";
import Financials from "./pages/Financials";
import AuditLogsPage from "./pages/admin/AuditLogs";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { database } from "@/model/database";

const App = () => (
  <DatabaseProvider database={database}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SyncProvider>
          <AuthProvider>
            <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/verify-otp" element={<VerifyOtp />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />
                  <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                  <Route path="/rfqs" element={<ErrorBoundary><RFQs /></ErrorBoundary>} />
                  <Route path="/rfqs/new" element={<ErrorBoundary><RFQBuilder /></ErrorBoundary>} />
                  <Route path="/bids" element={<ErrorBoundary><Bids /></ErrorBoundary>} />
                  <Route path="/orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
                  <Route path="/projects" element={<ErrorBoundary><Projects /></ErrorBoundary>} />
                  <Route path="/suppliers" element={<ErrorBoundary><Suppliers /></ErrorBoundary>} />
                  <Route path="/approvals" element={<ErrorBoundary><Approvals /></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                  <Route
                    path="/supplier/rfq-feed"
                    element={<ErrorBoundary><SupplierRFQFeed /></ErrorBoundary>}
                  />
                  <Route path="/financials" element={<ErrorBoundary><Financials /></ErrorBoundary>} />
                  <Route path="/admin/audit-logs" element={<ErrorBoundary><AuditLogsPage /></ErrorBoundary>} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
            </LanguageProvider>
          </AuthProvider>
        </SyncProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </DatabaseProvider>
);

export default App;
