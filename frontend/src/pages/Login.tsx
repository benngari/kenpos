import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { errorMessage } from "../lib/api";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@kenpos.co.ke");
  const [password, setPassword] = useState("password123");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">KenPOS</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your store</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-5">
          Demo accounts (password: password123): admin@kenpos.co.ke · manager@kenpos.co.ke · cashier@kenpos.co.ke
        </p>
      </div>
    </div>
  );
}
