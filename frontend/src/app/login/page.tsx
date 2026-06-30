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
  const { login, mfaEnabled } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [pendingAuth, setPendingAuth] = useState<{user: any, token: string} | null>(null);

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
      if (mfaEnabled) {
        setPendingAuth({ user: userResponse.data, token });
        setShowMfa(true);
        return;
      }
      login(userResponse.data, token);
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      // Network error — backend is offline, try mock login
      if (!err.response) {
        const mockUser = MOCK_USERS[data.email.toLowerCase()];
        if (mockUser && data.password.length >= 4) {
          if (mfaEnabled) {
            setPendingAuth({ user: { id: 1, ...mockUser }, token: "mock-token-demo" });
            setShowMfa(true);
            return;
          }
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
    <div className="min-h-screen flex w-full bg-[#FAFAFA] overflow-hidden">
      {/* Abstract Background for left side */}
      <div className="absolute top-0 left-0 w-1/2 h-full z-0 overflow-hidden pointer-events-none lg:block hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-accent/5 blur-[120px]" />
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 relative z-10">
        
        {/* Mobile Logo */}
        <div className="lg:hidden mb-10 flex justify-center">
          <img src="/images/bsd-logo.webp" alt="BSD Steel" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Glassmorphic Card Container */}
          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] relative overflow-hidden">
            
            {/* Inner subtle glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-50" />
            
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl text-gray-900 font-display font-bold mb-3 tracking-wide flex items-center gap-3">
                Sign In
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </h1>
              <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-medium leading-relaxed">
                Secure Portal Access
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-critical/10 border border-critical/20 rounded-xl text-critical text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-critical/5">
                <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse shrink-0" />
                {error}
              </div>
            )}

          {!showMfa && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2 group/input">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-focus-within/input:text-accent transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm placeholder:text-gray-400"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-critical text-[10px] mt-1.5 uppercase tracking-wider font-bold">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2 relative group/input">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold group-focus-within/input:text-accent transition-colors">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm placeholder:text-gray-400 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
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
                 <div className="relative w-4 h-4 rounded bg-gray-50 border border-gray-300 group-hover:border-accent transition-colors flex items-center justify-center">
                   <input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                   <div className="w-2 h-2 bg-accent rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                 </div>
                 <span className="text-[10px] text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-widest font-bold">
                   Remember Me
                 </span>
               </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden bg-[#B81D2D] text-white font-display font-bold uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_4px_14px_rgba(184,29,45,0.4)] hover:shadow-[0_6px_20px_rgba(184,29,45,0.6)] hover:bg-[#9B1825] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-3 group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Authenticate
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse group-hover:scale-150 transition-transform" />
                </>
              )}
            </button>
          </form>
          )}

          {showMfa && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (mfaCode.length >= 6 && pendingAuth) {
                login(pendingAuth.user, pendingAuth.token);
                router.push("/");
              } else {
                setError("Invalid MFA Code.");
              }
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-panel border border-border rounded-lg px-4 py-3.5 text-text-primary text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Verify Code
              </button>
            </form>
          )}
          </div> {/* End Glass Card */}

          <div className="mt-8 flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[9px] text-gray-500 uppercase tracking-[0.3em] font-medium">
              Enterprise Secure Login
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Visual / Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#7A0C1A] relative overflow-hidden flex-col items-center justify-center border-l border-white/[0.02]">
        
        {/* Dynamic Deep Mesh Gradient */}
        <div className="absolute inset-0 z-0 opacity-60 mix-blend-screen">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF3344]/30 via-transparent to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D02936]/40 via-transparent to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '18s' }} />
        </div>

        {/* Abstract Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#7A0C1A] via-transparent to-[#7A0C1A]" />
        </div>

        {/* Floating Glassmorphic Badges */}
        <div className="absolute right-12 bottom-40 z-20 animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] text-white uppercase tracking-widest font-bold">Systems Online</span>
          </div>
        </div>



        <div className="absolute left-6 xl:left-10 top-16 z-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-white/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div>
              <p className="text-[9px] text-white/70 uppercase tracking-wider font-bold mb-0.5">Live Collections</p>
              <p className="text-xs text-white font-mono font-bold">+ ₹2.4M Today</p>
            </div>
          </div>
        </div>

        {/* Brand Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-16 max-w-2xl mt-12">
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full group-hover:bg-white/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-all group-hover:scale-105 duration-500 relative z-10 mx-auto">
              <img src="/images/bsd-logo.webp" alt="BSD Steel" className="h-16 w-auto object-contain" />
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70 uppercase tracking-[0.1em] mb-6 leading-tight">
            Inventory &<br/>Receivables Engine
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-white to-white/30 mx-auto mb-8 rounded-full" />
          <p className="text-white/90 text-sm tracking-widest leading-relaxed max-w-md font-bold drop-shadow-sm mb-12">
            AI-POWERED SUPPLY CHAIN OPERATIONS • REAL-TIME ASSET TRACKING • AUTOMATED COLLECTIONS
          </p>
        </div>
        
        {/* Premium Grid overlay for texture */}
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
