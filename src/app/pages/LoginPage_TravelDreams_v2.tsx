import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.243 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.277 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.145 0 9.815-1.977 13.357-5.192l-6.167-5.222C29.115 35.091 26.715 36 24 36c-5.222 0-9.619-3.327-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.113 5.586l.003-.002 6.167 5.222C36.923 39.204 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.094 10.125 24v-8.438H7.078v-3.49h3.047V9.413c0-3.017 1.792-4.686 4.533-4.686 1.313 0 2.686.235 2.686.235v2.963H15.83c-1.491 0-1.956.93-1.956 1.885v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.099 24 12.073z"
      />
    </svg>
  );
}

export default function TravelLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthLoading, currentUser } = useApp();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (currentUser.role === "host") {
      navigate("/host-dashboard", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter username/email and password.");
      return;
    }

    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.error || "Login failed.");
      return;
    }

    if (result.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (result.role === "host") {
      navigate("/host-dashboard", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe7] p-2 md:p-4">
      <div className="mx-auto grid h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(29,35,52,0.12)] lg:grid-cols-[1.02fr_1fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80"
            alt="Luxury travel destination"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,36,0.10)_0%,rgba(7,18,36,0.30)_55%,rgba(7,18,36,0.72)_100%)]" />

          <div className="absolute left-7 top-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#1f2937] shadow-lg backdrop-blur-md transition hover:scale-105"
              aria-label="Go home"
            >
              ←
            </button>

            <div className="flex items-center gap-3 rounded-full bg-white/88 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a18_0%,#ffd200_100%)] text-lg shadow-sm">
                ✈
              </div>
              <p className="text-[1.7rem] font-black tracking-[-0.04em] text-[#1f2937]">
                TravelDreams
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 right-8">
            <div className="max-w-[560px]">
              <p className="mb-3 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/90 backdrop-blur-md">
                luxury escapes
              </p>

              <h1 className="text-[3.15rem] font-black leading-[0.95] tracking-[-0.05em] text-white xl:text-[4.2rem]">
                Discover your
                <br />
                next dream
                <br />
                escape
              </h1>

              <p className="mt-4 max-w-[500px] text-[1.02rem] leading-7 text-white/82">
                Manage bookings, save favorite destinations and unlock premium
                travel experiences crafted for unforgettable journeys.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex h-full items-center justify-center bg-[linear-gradient(180deg,#fffdfa_0%,#f7f2ea_100%)] px-5 py-6 sm:px-8 md:px-12 lg:px-14">
          <div className="w-full max-w-[520px]">
            <div className="mb-7">
              <div className="mb-4 flex items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-[#1f2937] shadow-md transition hover:scale-105"
                  aria-label="Go home"
                >
                  ←
                </button>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a18_0%,#ffd200_100%)] text-lg shadow-sm">
                  ✈
                </div>
                <p className="text-[1.9rem] font-black tracking-[-0.04em] text-[#1f2937]">
                  TravelDreams
                </p>
              </div>

              <h2 className="text-[2.25rem] font-black tracking-[-0.04em] text-[#1e275c] sm:text-[2.8rem]">
                Welcome back to
                <br />
                TravelDreams
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or email"
                className="h-14 w-full rounded-[14px] border border-[#cfd6e3] bg-white px-4"
              />

              <div className="flex h-14 items-center rounded-[14px] border border-[#cfd6e3] bg-white px-4">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-full w-full bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-3 text-sm font-semibold text-[#8a90a0]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label className="flex items-center gap-3 text-[#545c6d]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="font-medium">Remember me</span>
              </label>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="h-14 w-full rounded-[14px] bg-[linear-gradient(90deg,#111827_0%,#1f2937_100%)] text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAuthLoading ? "Signing in..." : "Login"}
              </button>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <div className="rounded-xl border border-[#d8dde8] bg-white/80 px-4 py-3 text-sm text-[#374151]">
                <p className="font-semibold">Demo login credentials:</p>
                <p className="mt-1">
                  Admin: <span className="font-semibold">admin</span> / <span className="font-semibold">admin2026!</span>
                </p>
                <p>
                  Host: <span className="font-semibold">host</span> / <span className="font-semibold">host2026!</span>
                </p>
              </div>

              <p className="text-center text-sm text-[#7d8494]">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#1e4ed8] underline underline-offset-4"
                >
                  Register
                </Link>
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-3 rounded-[14px] border border-[#d8dde8] bg-white text-sm font-semibold text-[#4d5565]"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-3 rounded-[14px] border border-[#d8dde8] bg-white text-sm font-semibold text-[#4d5565]"
                >
                  <FacebookIcon />
                  <span>Continue with Facebook</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
