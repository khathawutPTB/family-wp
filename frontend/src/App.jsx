import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TransactionForm from "./pages/TransactionForm";
import History from "./pages/History";
import FamilyMembers from "./pages/FamilyMembers";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions/new" element={<TransactionForm />} />
        <Route path="/transactions/:id/edit" element={<TransactionForm />} />
        <Route path="/history" element={<History />} />
        <Route path="/family" element={<FamilyMembers />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
