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
import ShowcasePage from '@/pages/ShowcasePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/showcase" element={<ShowcasePage />} />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Reservation details uses its own shell variant (search pill, centered title, Reservations tab active) */}
        <Route element={<AppLayout shellVariant="details" />}>
          <Route path="/reservations/:reservationId" element={<ReservationDetailsPage />} />
        </Route>
        {/* New Reservation is a focused transactional flow — source suppresses the nav shells entirely */}
        <Route path="/reservations/new" element={<CreateReservationPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        {/* Rooms uses its own shell variant (gold brand chip, pill search + Check In) */}
        <Route element={<AppLayout shellVariant="rooms" />}>
          <Route path="/rooms" element={<RoomsPage />} />
        </Route>
        {/* Room Management uses its own shell variant (text brand + manager portrait, left-bar nav) */}
        <Route element={<AppLayout shellVariant="mgmt" />}>
          <Route path="/rooms/manage" element={<RoomManagementPage />} />
        </Route>
        {/* Room Details shares the management sidebar family with its own topbar treatment */}
        <Route element={<AppLayout shellVariant="roomDetails" />}>
          <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
        </Route>
        {/* Add/Edit Room is a focused task screen — shells suppressed like Create Reservation.
            Static segments rank above /rooms/:roomId, so ordering here is safe. */}
        <Route path="/rooms/new" element={<AddEditRoomPage />} />
        <Route path="/rooms/:roomId/edit" element={<AddEditRoomPage />} />
        {/* Property Configuration — the Settings destination in the management sidebar family */}
        <Route element={<AppLayout shellVariant="config" />}>
          <Route path="/settings" element={<RoomConfigurationPage />} />
        </Route>
        {/* Guest Profile uses its own shell variant (diamond brand, Guests tab active, help button) */}
        <Route element={<AppLayout shellVariant="guest" />}>
          <Route path="/guests/:guestId" element={<GuestProfilePage />} />
        </Route>
        {/* Housekeeping uses its own shell variant (hotel-icon brand, manager identity topbar) */}
        <Route element={<AppLayout shellVariant="housekeeping" />}>
          <Route path="/housekeeping" element={<HousekeepingPage />} />
        </Route>
        {/* Billing uses the dashboard sidebar family with a footer-divider Settings link */}
        <Route element={<AppLayout shellVariant="billing" />}>
          <Route path="/billing" element={<BillingPage />} />
        </Route>
        {/* Invoice gets its own shell (nav chrome wrapped in #nav-shell for the print
            stylesheet) and is parameterized by the invoice identifier */}
        <Route element={<AppLayout shellVariant="invoice" />}>
          <Route path="/billing/invoices/:invoiceId" element={<InvoicePage />} />
        </Route>
        {/* Check-out is a transactional flow — shells suppressed like Create Reservation */}
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* Reservations uses the "Reservations Desk" shell variant (square brand chip, bottom CTA) */}
        <Route element={<AppLayout shellVariant="desk" />}>
          <Route path="/reservations" element={<ReservationsPage />} />
          {/* Unimplemented sections bounce back to reservations until their screens land */}
          <Route path="*" element={<Navigate to="/reservations" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
