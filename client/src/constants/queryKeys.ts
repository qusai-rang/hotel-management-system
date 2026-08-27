/* ================================================================== */
/*  Centralized Query Key Factory                                      */
/* ================================================================== */

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const roomTypeKeys = {
  all: ['roomTypes'] as const,
  list: (filters?: Record<string, unknown>) => [...roomTypeKeys.all, 'list', filters] as const,
  detail: (id: string) => [...roomTypeKeys.all, 'detail', id] as const,
};

export const roomKeys = {
  all: ['rooms'] as const,
  list: (filters?: Record<string, unknown>) => [...roomKeys.all, 'list', filters] as const,
  detail: (id: string) => [...roomKeys.all, 'detail', id] as const,
  activity: (id: string) => [...roomKeys.all, 'activity', id] as const,
};

export const guestKeys = {
  all: ['guests'] as const,
  list: (filters?: Record<string, unknown>) => [...guestKeys.all, 'list', filters] as const,
  detail: (id: string) => [...guestKeys.all, 'detail', id] as const,
};

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (filters?: Record<string, unknown>) => [...reservationKeys.all, 'list', filters] as const,
  detail: (id: string) => [...reservationKeys.all, 'detail', id] as const,
  folio: (id: string) => [...reservationKeys.all, 'folio', id] as const,
};

export const availabilityKeys = {
  all: ['availability'] as const,
  search: (params: Record<string, unknown>) => [...availabilityKeys.all, 'search', params] as const,
};

export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  tasks: (filters?: Record<string, unknown>) => [...housekeepingKeys.all, 'tasks', filters] as const,
  task: (id: string) => [...housekeepingKeys.all, 'task', id] as const,
  stats: () => [...housekeepingKeys.all, 'stats'] as const,
  schedule: (date?: string) => [...housekeepingKeys.all, 'schedule', date] as const,
};

export const folioKeys = {
  all: ['folios'] as const,
  detail: (id: string) => [...folioKeys.all, 'detail', id] as const,
};

export const billingKeys = {
  all: ['billing'] as const,
  transactions: (filters?: Record<string, unknown>) => [...billingKeys.all, 'transactions', filters] as const,
  metrics: () => [...billingKeys.all, 'metrics'] as const,
};

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (filters?: Record<string, unknown>) => [...invoiceKeys.all, 'list', filters] as const,
  detail: (number: string) => [...invoiceKeys.all, 'detail', number] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

export const checkoutKeys = {
  all: ['checkout'] as const,
  session: (reservationId: string) => [...checkoutKeys.all, 'session', reservationId] as const,
};
