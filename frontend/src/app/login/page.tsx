"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const MOCK_USERS: Record<string, { email: string; full_name: string; role: string }> = {
    "admin@bsd.com": { email: "admin@bsd.com", full_name: "Admin User", role: "management" },
    "warehouse@bsd.com": { email: "warehouse@bsd.com", full_name: "Warehouse Staff", role: "warehouse_staff" },
    "accounts@bsd.com": { email: "accounts@bsd.com", full_name: "Accounts Team", role: "accounts_team" },
  };

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      // 1. Authenticate and get token
      const response = await api.post("/api/auth/login", { email: data.email, password: data.password });
      const token = response.data.access_token;
      
      // 2. Fetch user profile
      const userResponse = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 3. Save to store and redirect
      login(userResponse.data, token);
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      // Network error — backend is offline, try mock login
      if (!err.response) {
        const mockUser = MOCK_USERS[data.email.toLowerCase()];
        if (mockUser && data.password.length >= 4) {
          login({ id: 1, ...mockUser } as any, "mock-token-demo");
          router.push("/");
          return;
        }
        setError("Backend is offline. Use a demo account: admin@bsd.com / any password (4+ chars)");
        return;
      }
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid email or password.");
      } else {
        setError("An error occurred during login. Please try again.");
      }
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/forgot-password");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative z-10">
        
        {/* Mobile Logo (Hidden on Desktop) */}
        <div className="lg:hidden mb-12 flex justify-center">
          <img src="/images/bsd-logo.webp" alt="BSD Steel" className="h-12 w-auto object-contain" />
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl text-text-primary font-display font-bold mb-3 tracking-wide">
              Sign In
            </h1>
            <p className="text-text-muted text-sm uppercase tracking-widest font-medium">
              Welcome back to the BSD Management Portal
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-critical/10 border-l-4 border-critical text-critical text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-panel border border-border rounded-lg px-4 py-3.5 text-text-primary text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm placeholder:text-text-muted/40"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-critical text-[10px] mt-1.5 uppercase tracking-wider font-bold">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-accent hover:text-accent/80 transition-colors uppercase tracking-widest font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full bg-panel border border-border rounded-lg px-4 py-3.5 text-text-primary text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm placeholder:text-text-muted/40"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-critical text-[10px] mt-1.5 uppercase tracking-wider font-bold">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center pt-2 pb-6">
               <label className="flex items-center gap-3 cursor-pointer group">
                 <div className="relative w-4 h-4 rounded bg-panel border border-border group-hover:border-accent transition-colors flex items-center justify-center">
                   <input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                   <div className="w-2 h-2 bg-accent rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                 </div>
                 <span className="text-[10px] text-text-muted group-hover:text-text-primary transition-colors uppercase tracking-widest font-bold">
                   Remember Me
                 </span>
               </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : "Sign In"}
            </button>
          </form>
          
          <p className="mt-10 text-center text-[10px] text-text-muted uppercase tracking-widest font-medium">
            &copy; {new Date().getFullYear()} BSD Steel. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column: Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#101216] relative overflow-hidden flex-col items-center justify-center border-l border-white/5">
        
        {/* Dynamic Abstract Gradient Overlay */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
          <div className="absolute top-0 right-0 w-full h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/40 via-accent/5 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute bottom-0 left-0 w-full h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3D7A6B]/30 via-transparent to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '15s' }} />
        </div>

        {/* Large Logo Watermark Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-150 transform rotate-12">
          <img src="/images/bsd-logo.webp" alt="BSD Watermark" className="w-[120%] h-auto object-cover grayscale mix-blend-overlay" />
        </div>

        {/* Brand Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-xl">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl mb-10 transform transition-transform hover:scale-105 duration-500">
            <img src="/images/bsd-logo.webp" alt="BSD Steel" className="h-14 w-auto object-contain drop-shadow-lg" />
          </div>
          
          <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 leading-tight">
            Inventory &<br/>Receivables Engine
          </h2>
          <div className="w-12 h-1 bg-accent mx-auto mb-6 rounded-full" />
          <p className="text-text-muted text-sm tracking-wide leading-relaxed">
            Enterprise-grade management system designed to streamline your operations, monitor stock ledgers in real-time, and aggressively collect accounts receivable.
          </p>
        </div>
        
        {/* Premium Grid overlay for texture */}
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
