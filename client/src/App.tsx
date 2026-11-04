import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import ReservationsPage from '@/features/reservations/pages/ReservationsPage';
import CreateReservationPage from '@/features/reservations/pages/CreateReservationPage';
import ReservationDetailsPage from '@/features/reservations/pages/ReservationDetailsPage';
import RoomsPage from '@/features/rooms/pages/RoomsPage';
import RoomManagementPage from '@/features/rooms/pages/RoomManagementPage';
import RoomDetailsPage from '@/features/rooms/pages/RoomDetailsPage';
import AddEditRoomPage from '@/features/rooms/pages/AddEditRoomPage';
import RoomConfigurationPage from '@/features/rooms/pages/RoomConfigurationPage';
import GuestProfilePage from '@/features/guests/pages/GuestProfilePage';
import HousekeepingPage from '@/features/housekeeping/pages/HousekeepingPage';
import BillingPage from '@/features/billing/pages/BillingPage';
import CheckoutPage from '@/features/billing/pages/CheckoutPage';
import InvoicePage from '@/features/billing/pages/InvoicePage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout shellVariant="details" />}>
          {/* Reservation details - its own shell */}
          <Route path="/reservations/:reservationId" element={<ReservationDetailsPage />} />
        </Route>

        {/* New Reservation - focused flow */}
        <Route path="/reservations/new" element={<CreateReservationPage />} />

        {/* Dashboard - with summary FIRST */}
        <Route element={<AppLayout shellVariant="dashboard" />}>
          {/* Summary MUST come before dashboard */}
          <Route path="/dashboard/summary" element={<DashboardPage />} />

          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Rooms - works already */}
        <Route element={<AppLayout shellVariant="rooms" />}>
          <Route path="/rooms" element={<RoomsPage />} />
        </Route>

        {/* Room Management */}
        <Route element={<AppLayout shellVariant="mgmt" />}>
          <Route path="/rooms/manage" element={<RoomManagementPage />} />
        </Route>

        {/* Room Details */}
        <Route element={<AppLayout shellVariant="roomDetails" />}>
          <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
        </Route>

        {/* Add/Edit Room */}
        <Route path="/rooms/new" element={<AddEditRoomPage />} />
        <Route path="/rooms/:roomId/edit" element={<AddEditRoomPage />} />

        {/* Settings */}
        <Route element={<AppLayout shellVariant="config" />}>
          <Route path="/settings" element={<RoomConfigurationPage />} />
        </Route>

        {/* Guest Profile */}
        <Route element={<AppLayout shellVariant="guest" />}>
          <Route path="/guests/:guestId" element={<GuestProfilePage />} />
        </Route>

        {/* Housekeeping */}
        <Route element={<AppLayout shellVariant="housekeeping" />}>
          <Route path="/housekeeping" element={<HousekeepingPage />} />
        </Route>

        {/* Billing */}
        <Route element={<AppLayout shellVariant="billing" />}>
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/invoices/:invoiceId" element={<InvoicePage />} />
        </Route>

        {/* Check-out */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Reservations Desk */}
        <Route element={<AppLayout shellVariant="desk" />}>
          <Route path="/reservations" element={<ReservationsPage />} />
        </Route>

        {/* 404 for unknown protected routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 404 for unknown public routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
