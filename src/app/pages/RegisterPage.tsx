import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log({
      fullName,
      email,
      password,
    });

    alert("Account created successfully!");
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe7] p-2 md:p-4">
      <div className="mx-auto grid h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-[0_25px_80px_rgba(29,35,52,0.12)] lg:grid-cols-[1.02fr_1fr]">
        {/* LEFT */}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-yellow-300">
                ✈
              </div>
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

        {/* RIGHT */}
        <section className="flex items-center justify-center bg-[#fdfaf6] px-6 md:px-12">
          <div className="w-full max-w-[500px]">
            {/* MOBILE TOP */}
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

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-yellow-300">
                ✈
              </div>

              <p className="text-xl font-black text-[#1f2937]">
                TravelDreams
              </p>
            </div>

            <h2 className="text-[2.3rem] font-black text-[#1e275c]">
              Create your account
            </h2>

            <p className="mt-2 text-gray-500">
              Join TravelDreams and start exploring.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="flex h-12 items-center rounded-xl border border-gray-300 px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm font-medium text-gray-500 transition hover:text-[#1e275c]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex h-12 items-center rounded-xl border border-gray-300 px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="text-sm font-medium text-gray-500 transition hover:text-[#1e275c]"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-black text-white font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] active:scale-[0.98]"
              >
                Create Account
              </button>

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