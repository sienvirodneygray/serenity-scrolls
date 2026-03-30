import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PresaleJournal from "./pages/PresaleJournal";
import Contact from "./pages/Contact";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Servant from "./pages/Servant";
import ServantAccess from "./pages/ServantAccess";
import ServantLanding from "./pages/ServantLanding";
import ServantTest from "./pages/ServantTest";
import Unlock from "./pages/Unlock";
import ServantExpired from "./pages/ServantExpired";
import ServantTestFlow from "./pages/ServantTestFlow";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataProtectionPolicy from "./pages/DataProtectionPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <AnalyticsProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/presale-journal" element={<PresaleJournal />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/servant" element={<Servant />} />
            <Route path="/servant-access" element={<ServantAccess />} />
            <Route path="/servant-landing" element={<ServantLanding />} />
            <Route path="/unlock" element={<Unlock />} />
            <Route path="/servant-expired" element={<ServantExpired />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/servant-test" element={<ServantTest />} />
            <Route path="/servant-test-flow" element={<ServantTestFlow />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/data-protection-policy" element={<DataProtectionPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnalyticsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
