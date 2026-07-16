import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(
        apiErrors?.[0]?.msg || err.response?.data?.error || "ลงทะเบียนไม่สำเร็จ"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-brand-teal flex items-center justify-center text-3xl shadow-sm">
            👋
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center mb-6 text-brand-ink">
          ลงทะเบียน
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">ชื่อ</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-ink/70 mb-1 ml-1">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-black/10 bg-brand-cream/60 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>
          {error && <p className="text-sm text-red-600 ml-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-yellow text-brand-ink rounded-full py-3 font-semibold hover:bg-brand-yellow-dark transition-colors disabled:opacity-50"
          >
            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </button>
        </form>
        <p className="text-sm text-center text-brand-ink/60 mt-5">
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="text-brand-teal-dark font-semibold">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
