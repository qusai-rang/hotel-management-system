/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */

export interface HousekeepingTaskDTO {
  id: string;
  roomId: string;
  room: { number: string; floor: number; roomTypeCode: string; roomTypeName: string } | null;
  context: string;
  type: string;
  status: string;
  assignee: { id: string; name: string; role: string } | null;
  progressPercent: number;
  estimateCompletionAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  ticket: {
    title: string | null;
    reportedAt: string | null;
    assignedTeamLabel: string | null;
    estimatedFixAt: string | null;
  } | null;
  priorityNote: string | null;
}

export interface StaffScheduleEntryDTO {
  staff: { id: string; name: string; role: string };
  floors: number[];
  assignedTaskCount: number;
  completedTaskCount: number;
  completionRate: number;
  inProgressTaskCount: number;
  overdueTaskCount: number;
}

export interface HousekeepingStatsDTO {
  totalTasks: number;
  dirtyRooms: number;
  cleaningTasks: number;
  needsInspectionRooms: number;
  maintenanceRooms: number;
  cleanRooms: number;
  completedToday: number;
  openTasks: number;
  byContext: Record<string, number>;
  byFloor: Record<string, number>;
}

export function serializeHousekeepingTask(doc: any, roomDoc: any = null, assigneeDoc: any = null): HousekeepingTaskDTO {
  const obj = doc.toObject ? doc.toObject() : doc;
  const room = roomDoc ? (roomDoc.toObject ? roomDoc.toObject() : roomDoc) : null;
  const assignee = assigneeDoc ? (assigneeDoc.toObject ? assigneeDoc.toObject() : assigneeDoc) : null;
  const rt = room?.roomTypeId;

  return {
    id: obj._id.toString(),
    roomId: obj.roomId?._id?.toString?.() ?? obj.roomId?.toString?.() ?? '',
    room: room ? {
      number: room.number,
      floor: room.floor,
      roomTypeCode: rt?.code ?? '',
      roomTypeName: rt?.name ?? '',
    } : null,
    context: obj.context,
    type: obj.type,
    status: obj.status,
    assignee: assignee ? {
      id: assignee._id.toString(),
      name: assignee.name,
      role: assignee.role,
    } : null,
    progressPercent: obj.progressPercent ?? 0,
    estimateCompletionAt: obj.estimateCompletionAt?.toISOString?.() ?? null,
    lastActivityAt: obj.lastActivityAt?.toISOString?.() ?? obj.lastActivityAt ?? '',
    createdAt: obj.createdAt?.toISOString?.() ?? '',
    ticket: obj.ticket ? {
      title: obj.ticket.title ?? null,
      reportedAt: obj.ticket.reportedAt?.toISOString?.() ?? null,
      assignedTeamLabel: obj.ticket.assignedTeamLabel ?? null,
      estimatedFixAt: obj.ticket.estimatedFixAt?.toISOString?.() ?? null,
    } : null,
    priorityNote: room?.priorityNote ?? null,
  };
}

export function serializeStaffScheduleEntry(staff: any, floors: number[], taskCount: number, completedCount: number, overdueCount: number): StaffScheduleEntryDTO {
  return {
    staff: { id: staff._id.toString(), name: staff.name, role: staff.role },
    floors,
    assignedTaskCount: taskCount,
    completedTaskCount: completedCount,
    completionRate: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
    inProgressTaskCount: taskCount - completedCount,
    overdueTaskCount: overdueCount,
  };
}

export function serializeHousekeepingStats(data: {
  totalTasks: number;
  dirtyRooms: number;
  cleaningTasks: number;
  needsInspectionRooms: number;
  maintenanceRooms: number;
  cleanRooms: number;
  completedToday: number;
  openTasks: number;
  byContext: Record<string, number>;
  byFloor: Record<string, number>;
}): HousekeepingStatsDTO {
  return { ...data };
}
