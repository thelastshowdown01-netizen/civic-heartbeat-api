import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoProvider } from "@/hooks/useDemo";
import DemoBar from "@/components/demo/DemoBar";
import { toast } from "sonner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ReportIssue from "./pages/ReportIssue";
import ExploreIssues from "./pages/ExploreIssues";
import IssueDetails from "./pages/IssueDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import AdminIssueReview from "./pages/AdminIssueReview";
import UserDashboard from "./pages/UserDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
    mutations: {
      onError: (error: Error) => {
        toast.error("Something went wrong", { description: error.message });
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoProvider>
          <DemoBar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/issues" element={<ExploreIssues />} />
            <Route path="/issues/:id" element={<IssueDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/authority" element={<AuthorityDashboard />} />
            <Route path="/admin/issues/:id" element={<AdminIssueReview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </DemoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
