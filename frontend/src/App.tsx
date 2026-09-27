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