import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import { ProtectedRoute } from "./components/ProtectedRoute"

import { LoginPage } from "./pages/LoginPage/LoginPage"

import { PatientDashboard } from "./pages/PatientDashboard"

import { ProfessionalDashboard } from "./pages/ProfessionalDashboard"

import { ProfessionalInsightsPage } from "./pages/ProfessionalInsightsPage"

import { ProfessionalPatientsPage } from "./pages/ProfessionalPatientsPage"

import { ProfessionalReportsPage } from "./pages/ProfessionalReportsPage"

import { PatientDetailsPage } from "./pages/PatientDetailsPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="PACIENTE">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional"
          element={
            <ProtectedRoute allowedRole="NUTRICIONISTA">
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional/patients"
          element={
            <ProtectedRoute allowedRole="NUTRICIONISTA">
              <ProfessionalPatientsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional/reports"
          element={
            <ProtectedRoute allowedRole="NUTRICIONISTA">
              <ProfessionalReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional/insights"
          element={
            <ProtectedRoute allowedRole="NUTRICIONISTA">
              <ProfessionalInsightsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional/patients/:clienteId"
          element={
            <ProtectedRoute allowedRole="NUTRICIONISTA">
              <PatientDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
