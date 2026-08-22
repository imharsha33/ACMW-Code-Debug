import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentQuestions } from "./pages/student/StudentQuestions";
import { AssessmentIntro } from "./pages/student/AssessmentIntro";
import { AssessmentRunner } from "./pages/student/AssessmentRunner";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminQuestions } from "./pages/admin/AdminQuestions";
import { QuestionForm } from "./pages/admin/QuestionForm";
import { AssessmentSettingsPage } from "./pages/admin/AssessmentSettingsPage";
import { AdminResults } from "./pages/admin/AdminResults";
import { AdminAssessments } from "./pages/admin/AdminAssessments";
import { ProfilePage } from "./pages/ProfilePage";
import { LandingPage } from "./pages/LandingPage";

const RequireRole: React.FC<{ role: "admin" | "student"; children: React.ReactNode }> = ({
  role,
  children,
}) => {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }
  return <Layout>{children}</Layout>;
};

const RequireStudentBare: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "student") return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={session.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/student/dashboard"
        element={
          <RequireRole role="student">
            <StudentDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/student/questions"
        element={<Navigate to="/student/dashboard" replace />}
      />
      <Route
        path="/student/assessment"
        element={
          <RequireRole role="student">
            <AssessmentIntro />
          </RequireRole>
        }
      />
      <Route
        path="/student/assessment/run"
        element={
          <RequireStudentBare>
            <AssessmentRunner />
          </RequireStudentBare>
        }
      />
      <Route
        path="/student/profile"
        element={
          <RequireRole role="student">
            <ProfilePage />
          </RequireRole>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <RequireRole role="admin">
            <AdminQuestions />
          </RequireRole>
        }
      />
      <Route
        path="/admin/questions/new"
        element={
          <RequireRole role="admin">
            <QuestionForm />
          </RequireRole>
        }
      />
      <Route
        path="/admin/questions/:id/edit"
        element={
          <RequireRole role="admin">
            <QuestionForm />
          </RequireRole>
        }
      />
      <Route
        path="/admin/assessment-settings"
        element={
          <RequireRole role="admin">
            <AssessmentSettingsPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/results"
        element={
          <RequireRole role="admin">
            <AdminResults />
          </RequireRole>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <RequireRole role="admin">
            <ProfilePage />
          </RequireRole>
        }
      />

      <Route
        path="/admin/assessments"
        element={
          <RequireRole role="admin">
            <AdminAssessments />
          </RequireRole>
        }
      />
      <Route
        path="/admin/assessments/new"
        element={
          <RequireRole role="admin">
            <AdminAssessments />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
