import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";

export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 sm:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
