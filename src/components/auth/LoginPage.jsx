import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Layers3, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const { isAuthenticated, requestOtp, verifyOtp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await requestOtp(email.trim().toLowerCase());
      setStep(2);
      setResendTimer(60);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpPaste = (index, e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const nextOtp = [...otp];
    const startIdx = pasted.length >= 6 ? 0 : index;
    for (let i = 0; i < pasted.length && startIdx + i < 6; i++) {
      nextOtp[startIdx + i] = pasted[i];
    }
    setOtp(nextOtp);

    const nextFocus = Math.min(startIdx + pasted.length, 5);
    otpInputsRef.current[nextFocus]?.focus();
  };

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    if (cleanVal.length > 2) {
      const nextOtp = [...otp];
      const startIdx = cleanVal.length >= 6 ? 0 : index;
      for (let i = 0; i < cleanVal.length && startIdx + i < 6; i++) {
        nextOtp[startIdx + i] = cleanVal[i];
      }
      setOtp(nextOtp);
      const nextFocus = Math.min(startIdx + cleanVal.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const newDigit = cleanVal.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = newDigit;
    setOtp(nextOtp);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) return;

    try {
      setLoading(true);
      setError("");
      const result = await verifyOtp(email.trim().toLowerCase(), fullOtp);
      const loggedUser = result?.user;
      if (loggedUser?.tenants && loggedUser.tenants.length > 1) {
        navigate("/select-tenant");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Invalid or expired verification code");
      setTimeout(() => {
        otpInputsRef.current[5]?.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-badge" aria-hidden="true">
            <Layers3 />
          </div>
          <span className="brand-title">Tally ERP Portal</span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-7 shadow-xs">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-md border border-[var(--critical)]/20 bg-[var(--critical-soft)] p-3 text-xs text-[var(--critical)]">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              /* Step 1: Work Email */
              <div>
                <div className="mb-5">
                  <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    Sign in
                  </h1>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Enter your work email to receive a sign-in code.
                  </p>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 w-full rounded-md border border-[var(--input)] bg-[var(--card)] pl-9 pr-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 font-medium text-xs cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-3.5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              /* Step 2: Passcode */
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="inline-flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
                  >
                    <ArrowLeft className="mr-1 size-3" />
                    Back
                  </button>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Step 2 of 2</span>
                </div>

                <div className="mb-5">
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    Enter passcode
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Sent to <strong className="text-[var(--foreground)]">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-5">
                  <div>
                    <div className="flex justify-between gap-1.5">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={(e) => handleOtpPaste(idx, e)}
                          onFocus={(e) => e.target.select()}
                          className="size-11 rounded-md border border-[var(--input)] bg-[var(--card)] text-center font-mono text-lg font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="w-full h-9 font-medium text-xs cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="text-center text-xs text-[var(--muted-foreground)]">
                    {resendTimer > 0 ? (
                      <span>Resend code in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        className="font-medium text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
