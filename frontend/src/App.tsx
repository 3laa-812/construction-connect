import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { database } from "@/model/database";

const App = () => (
  <DatabaseProvider database={database}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/rfqs" element={<RFQs />} />
                  <Route path="/rfqs/new" element={<RFQBuilder />} />
                  <Route path="/bids" element={<Bids />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/approvals" element={<Approvals />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/supplier/rfq-feed" element={<SupplierRFQFeed />} />
                  <Route path="/financials" element={<Financials />} />
                </Route>
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </DatabaseProvider>
);

export default App;
