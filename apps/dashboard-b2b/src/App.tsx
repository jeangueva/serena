import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";
import { Patients } from "@/pages/Patients";
import { PatientDetail } from "@/pages/PatientDetail";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/:id" element={<PatientDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/pacientes" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
