import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RFQBuilder from "./pages/RFQBuilder";
import RFQs from "./pages/RFQs";
import Bids from "./pages/Bids";
import Orders from "./pages/Orders";
import Projects from "./pages/Projects";
import Suppliers from "./pages/Suppliers";
import Approvals from "./pages/Approvals";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rfqs" element={<RFQs />} />
          <Route path="/rfqs/new" element={<RFQBuilder />} />
          <Route path="/bids" element={<Bids />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
