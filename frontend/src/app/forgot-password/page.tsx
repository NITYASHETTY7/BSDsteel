"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setSubmittedEmail(data.email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-10 group text-sm font-medium uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>

          {!submitted ? (
            <>
              <div className="mb-10">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h1 className="text-4xl text-text-primary font-display font-bold mb-3 tracking-wide">
                  Forgot Password
                </h1>
                <p className="text-text-muted text-sm leading-relaxed">
                  Enter the email address associated with your BSD Steel account. We'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full bg-panel border border-border rounded-lg px-4 py-3.5 text-text-primary text-sm font-medium focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted/40"
                    placeholder="you@example.com"
                    autoFocus
                  />
                  {errors.email && (
                    <p className="text-critical text-[10px] uppercase tracking-wider font-bold">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : "Send Reset Link"}
                </button>

                <p className="text-center text-[10px] text-text-muted uppercase tracking-widest">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-accent hover:text-accent/80 font-bold transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#3D7A6B]/10 border border-[#3D7A6B]/30 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-8 h-8 text-[#3D7A6B]" />
              </div>
              <h1 className="text-3xl text-text-primary font-display font-bold mb-4 tracking-wide">
                Check Your Email
              </h1>
              <p className="text-text-muted text-sm leading-relaxed mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-text-primary font-bold text-sm mb-8 bg-panel border border-border rounded-lg px-4 py-3 inline-block">
                {submittedEmail}
              </p>
              <p className="text-text-muted text-xs mb-8 leading-relaxed">
                Didn't receive the email? Check your spam folder, or{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-accent hover:text-accent/80 font-bold transition-colors"
                >
                  try again
                </button>
                .
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-panel border border-border text-text-primary font-display font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-white/5 transition-all text-sm"
              >
                Return to Login
              </button>
            </div>
          )}

          <p className="mt-12 text-center text-[10px] text-text-muted uppercase tracking-widest font-medium">
            &copy; {new Date().getFullYear()} BSD Steel. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column: Branding (same as login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#101216] relative overflow-hidden flex-col items-center justify-center border-l border-white/5">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/40 via-accent/5 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute bottom-0 left-0 w-full h-[80%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3D7A6B]/30 via-transparent to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '15s' }} />
        </div>
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-150 transform rotate-12">
          <img src="/images/bsd-logo.webp" alt="" className="w-[120%] h-auto object-cover grayscale" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-xl">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl mb-10">
            <img src="/images/bsd-logo.webp" alt="BSD Steel" className="h-14 w-auto object-contain drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 leading-tight">
            Account Recovery
          </h2>
          <div className="w-12 h-1 bg-accent mx-auto mb-6 rounded-full" />
          <p className="text-[#94A3B8] text-sm tracking-wide leading-relaxed">
            Your security is our priority. Reset your password securely and regain access to the BSD Steel Management Portal.
          </p>
        </div>
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
