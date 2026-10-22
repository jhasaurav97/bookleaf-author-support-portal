import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import LoadingScreen from "../components/LoadingScreen";
import {
  GuestRoute,
  HomeRedirect,
  ProtectedRoute,
} from "../components/RouteGuards";
import AuthorBooksPage from "../pages/AuthorBooksPage";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const AuthorDashboard = lazy(() => import("../pages/AuthorDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
// const FeaturePlaceholder = lazy(() => import("../pages/FeaturePlaceholder"));
const CreateTicketPage = lazy(() => import("../pages/CreateTicketPage"));
const AuthorTicketsPage = lazy(() => import("../pages/AuthorTicketsPage"));
const AdminTicketsPage = lazy(() => import("../pages/AdminTicketsPage"));
const AdminTicketDetailsPage = lazy(
  () => import("../pages/AdminTicketDetailsPage"),
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route element={<ProtectedRoute allowedRoles={["AUTHOR"]} />}>
            <Route path="/author" element={<DashboardLayout />}>
              <Route index element={<AuthorDashboard />} />

              <Route path="books" element={<AuthorBooksPage />} />

              <Route path="tickets" element={<AuthorTicketsPage />} />

              <Route path="tickets/:ticketId" element={<AuthorTicketsPage />} />

              <Route path="tickets/new" element={<CreateTicketPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />

              <Route path="tickets" element={<AdminTicketsPage />} />

              <Route
                path="tickets/:ticketId"
                element={<AdminTicketDetailsPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
