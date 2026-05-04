import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { BrandIcon } from "../components/BrandIcon";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthLoading, currentUser, authError } = useApp();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
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

  React.useEffect(() => {
    document.body.classList.add("auth-page-active");
    return () => {
      document.body.classList.remove("auth-page-active");
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = await register({
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role: "user",
    });

    if (!result.success) {
      setError(result.error || "Registration failed.");
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
    <div className="travel-register-fixed h-screen overflow-hidden bg-[#f4efe7] p-2 md:p-4">
      <div className="travel-register-card mx-auto grid h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(29,35,52,0.12)] lg:grid-cols-[1.02fr_1fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
            alt="Travel"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,36,0.2)_0%,rgba(7,18,36,0.6)_100%)]" />

          <div className="absolute left-7 top-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#1f2937] shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Go to login"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                ←
              </span>
            </button>

            <div className="flex items-center gap-3 rounded-full bg-white/88 px-4 py-3 shadow-lg">
              <BrandIcon className="h-10 w-10 shrink-0" />
              <p className="text-xl font-black text-[#1f2937]">
                TravelDreams
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h1 className="text-[3rem] font-black leading-tight">
              Start your
              <br />
              next adventure
            </h1>

            <p className="mt-4 text-white/80">
              Create an account and unlock premium travel experiences.
            </p>
          </div>
        </section>

        <section className="travel-register-form-pane flex items-center justify-center bg-[#fdfaf6] px-6 md:px-12">
          <div className="w-full max-w-[500px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="group flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110"
                aria-label="Go to login"
              >
                <span className="group-hover:-translate-x-1 transition">
                  ←
                </span>
              </button>

              <BrandIcon className="h-11 w-11 shrink-0" />

              <p className="text-xl font-black text-[#1f2937]">
                TravelDreams
              </p>
            </div>

            <h2 className="travel-register-title text-[2.3rem] font-black text-[#1e275c]">
              Create your account
            </h2>

            <p className="travel-register-subtitle mt-2 text-gray-500">
              Join TravelDreams and start exploring.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                id="register-full-name"
                name="fullName"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="travel-register-input h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="travel-register-input h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <input
                id="register-phone"
                name="phone"
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="travel-register-input h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="travel-register-input-shell flex h-12 items-center rounded-xl border border-gray-300 px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="travel-register-input travel-register-input-transparent w-full bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="travel-register-show-btn text-sm font-medium text-gray-500 transition hover:text-[#1e275c]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="travel-register-input-shell flex h-12 items-center rounded-xl border border-gray-300 px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="travel-register-input travel-register-input-transparent w-full bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="travel-register-show-btn text-sm font-medium text-gray-500 transition hover:text-[#1e275c]"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthLoading ? "Creating account..." : "Create Account"}
              </button>

              {(error || authError) && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error || authError}
                </p>
              )}

              <p className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 underline"
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

