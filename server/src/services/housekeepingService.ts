/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose lean/populate returns untyped shapes */
import mongoose from 'mongoose';
import { HousekeepingTask } from '../models/HousekeepingTask';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import type { HousekeepingTaskCreateInput, HousekeepingTaskUpdateInput, HousekeepingTaskQuery } from '../validation/housekeepingSchemas';
import { serializeHousekeepingTask, serializeStaffScheduleEntry, serializeHousekeepingStats } from '../serializers/housekeepingSerializer';
import type { HkTaskStatus } from '../models/enums';

/* ------------------------------------------------------------------ */
/*  Status transition map                                              */
/* ------------------------------------------------------------------ */

const VALID_TRANSITIONS: Record<HkTaskStatus, HkTaskStatus[]> = {
  dirty:             ['cleaning', 'needs_inspection', 'done'],
  cleaning:          ['dirty', 'needs_inspection', 'done'],
  needs_inspection:  ['dirty', 'cleaning', 'done'],
  done:              ['dirty', 'cleaning', 'needs_inspection'],
};

const TASK_TO_ROOM_STATUS: Record<HkTaskStatus, string> = {
  dirty: 'dirty',
  cleaning: 'cleaning',
  needs_inspection: 'needs_inspection',
  done: 'clean',
};

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

async function loadTask(taskId: string, session?: mongoose.ClientSession) {
  const q = HousekeepingTask.findById(taskId).populate('roomId').populate('assigneeId');
  if (session) q.session(session);
  const task = await q;
  if (!task) throw ApiError.notFound('Housekeeping task not found');
  return task;
}

function validateTransition(current: string, next: string) {
  const allowed = VALID_TRANSITIONS[current as HkTaskStatus];
  if (!allowed || !allowed.includes(next as HkTaskStatus)) {
    throw ApiError.badRequest(`Invalid status transition: ${current} → ${next}`);
  }
}

async function applyTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/* ------------------------------------------------------------------ */
/*  List tasks                                                         */
/* ------------------------------------------------------------------ */

export async function listTasks(query: HousekeepingTaskQuery) {
  const { floor, q, page, pageSize, ...filters } = query;

  const filter: Record<string, any> = {};
  if (filters.status) filter.status = filters.status;
  if (filters.context) filter.context = filters.context;
  if (filters.roomId) filter.roomId = new mongoose.Types.ObjectId(filters.roomId);

  if (filters.assigneeId) {
    filter.assigneeId = new mongoose.Types.ObjectId(filters.assigneeId);
  } else if (filters.assigneeId === undefined) {
    // no-op: include all
  }

  // Floor filter requires a room lookup first
  if (floor) {
    const roomIds = await Room.distinct('_id', { floor });
    filter.roomId = { $in: roomIds };
  }

  const [docs, total] = await Promise.all([
    HousekeepingTask.find(filter)
      .populate('roomId')
      .populate('assigneeId')
      .sort({ lastActivityAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    HousekeepingTask.countDocuments(filter),
  ]);

  // Batch-fetch RoomTypes for all rooms
  const roomTypeIds = [...new Set(
    docs
      .map((d: any) => d.roomId?.roomTypeId)
      .filter(Boolean)
      .map((id: any) => id.toString()),
  )];
  const roomTypes = roomTypeIds.length > 0
    ? await RoomType.find({ _id: { $in: roomTypeIds } }).lean()
    : [];
  const rtMap = new Map(roomTypes.map((rt: any) => [rt._id.toString(), rt]));

  // Enrich docs with roomType info
  const enriched = docs.map((d: any) => {
    const rtObj = d.roomId?.roomTypeId;
    if (rtObj && !rtObj.name && rtObj.toString) {
      const rt = rtMap.get(rtObj.toString());
      if (rt) d.roomId.roomTypeId = rt;
    }
    return d;
  });

  // Optional text search on room number, ticket title, assignee name
  let filtered = enriched;
  if (q) {
    const ql = q.toLowerCase();
    filtered = enriched.filter((d: any) => {
      const roomNum = d.roomId?.number ?? '';
      const ticketTitle = d.ticket?.title ?? '';
      const assignee = d.assigneeId?.name ?? '';
      return roomNum.toLowerCase().includes(ql)
        || ticketTitle.toLowerCase().includes(ql)
        || assignee.toLowerCase().includes(ql);
    });
  }

  const items = filtered.map((d: any) => serializeHousekeepingTask(d, d.roomId, d.assigneeId));
  return { items, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/*  Get tasks for a specific room                                      */
/* ------------------------------------------------------------------ */

export async function getTasksForRoom(roomId: string) {
  const room = await Room.findById(roomId).populate('roomTypeId');
  if (!room) throw ApiError.notFound('Room not found');

  const tasks = await HousekeepingTask.find({ roomId: new mongoose.Types.ObjectId(roomId) })
    .populate('assigneeId')
    .sort({ lastActivityAt: -1 })
    .lean();

  return tasks.map(t => serializeHousekeepingTask(t, room, t.assigneeId));
}

/* ------------------------------------------------------------------ */
/*  Create task                                                        */
/* ------------------------------------------------------------------ */

export async function createTask(data: HousekeepingTaskCreateInput, actorId: string, session?: mongoose.ClientSession) {
  const room = await (session ? Room.findById(data.roomId).session(session) : Room.findById(data.roomId));
  if (!room) throw ApiError.badRequest('Invalid roomId');

  if (data.assigneeId) {
    const assignee = await (session ? User.findById(data.assigneeId).session(session) : User.findById(data.assigneeId));
    if (!assignee) throw ApiError.badRequest('Invalid assigneeId');
    if (assignee.role !== 'housekeeping' && assignee.role !== 'manager' && assignee.role !== 'admin') {
      throw ApiError.badRequest('Only housekeeping, manager, or admin users can be assigned');
    }
  }

  const run = async (s: mongoose.ClientSession) => {
    const [task] = await HousekeepingTask.create([{
      roomId: new mongoose.Types.ObjectId(data.roomId),
      context: data.context,
      type: data.type,
      status: data.status ?? 'dirty',
      assigneeId: data.assigneeId ? new mongoose.Types.ObjectId(data.assigneeId) : undefined,
      progressPercent: data.progressPercent ?? 0,
      estimateCompletionAt: data.estimateCompletionAt ?? undefined,
      ticket: data.ticket,
      lastActivityAt: new Date(),
    }], { session: s });

    // Update room.housekeepingStatus
    const newHkStatus = TASK_TO_ROOM_STATUS[data.status ?? 'dirty'];
    await Room.findByIdAndUpdate(data.roomId, { $set: { housekeepingStatus: newHkStatus } }, { session: s });

    // ActivityLog
    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'task',
      entityId: task._id,
      action: 'created',
      title: `Housekeeping task created`,
      description: `${data.context} ${data.type} task for Room ${room.number}`,
      meta: { roomId: data.roomId, context: data.context, type: data.type, status: data.status ?? 'dirty' },
    }], { session: s });

    // Room activity log if status changed
    if (newHkStatus !== room.housekeepingStatus) {
      await ActivityLog.create([{
        actorId: new mongoose.Types.ObjectId(actorId),
        entityType: 'room',
        entityId: new mongoose.Types.ObjectId(data.roomId),
        action: 'housekeeping_status_changed',
        title: `Room ${room.number} → ${newHkStatus}`,
        description: `Housekeeping status changed from ${room.housekeepingStatus} to ${newHkStatus}`,
        meta: { from: room.housekeepingStatus, to: newHkStatus },
      }], { session: s });
    }

    // Re-fetch with populated refs
    const populated = await HousekeepingTask.findById(task._id)
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } })
      .populate('assigneeId')
      .session(s);

    return serializeHousekeepingTask(populated, populated?.roomId, populated?.assigneeId);
  };

  if (session) return run(session);
  return applyTransaction(run);
}

/* ------------------------------------------------------------------ */
/*  Update task                                                        */
/* ------------------------------------------------------------------ */

export async function updateTask(taskId: string, data: HousekeepingTaskUpdateInput, actorId: string) {
  return applyTransaction(async (s) => {
    const task = await loadTask(taskId, s);
    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId?.toString();
    const room = task.roomId as any;

    // Validate assignee if provided
    if (data.assigneeId !== undefined && data.assigneeId !== null) {
      const assignee = await User.findById(data.assigneeId).session(s);
      if (!assignee) throw ApiError.badRequest('Invalid assigneeId');
      if (assignee.role !== 'housekeeping' && assignee.role !== 'manager' && assignee.role !== 'admin') {
        throw ApiError.badRequest('Only housekeeping, manager, or admin users can be assigned');
      }
    }

    const updates: Record<string, any> = {};

    // Status transition
    if (data.status && data.status !== oldStatus) {
      validateTransition(oldStatus, data.status);
      updates.status = data.status;
    }

    // Progress
    if (data.progressPercent !== undefined) {
      updates.progressPercent = data.progressPercent;
    }

    // ETA
    if (data.estimateCompletionAt !== undefined) {
      updates.estimateCompletionAt = data.estimateCompletionAt;
    }

    // Assignment
    if (data.assigneeId !== undefined) {
      updates.assigneeId = data.assigneeId
        ? new mongoose.Types.ObjectId(data.assigneeId)
        : null;
    }

    // Ticket
    if (data.ticket) {
      for (const [k, v] of Object.entries(data.ticket)) {
        updates[`ticket.${k}`] = v;
      }
    }

    updates.lastActivityAt = new Date();

    await HousekeepingTask.findByIdAndUpdate(taskId, { $set: updates }, { session: s });

    // Update room.housekeepingStatus if task status changed
    if (updates.status && updates.status !== oldStatus) {
      const newHkStatus = TASK_TO_ROOM_STATUS[updates.status as HkTaskStatus];
      await Room.findByIdAndUpdate(room._id, { $set: { housekeepingStatus: newHkStatus } }, { session: s });

      // Room activity log
      await ActivityLog.create([{
        actorId: new mongoose.Types.ObjectId(actorId),
        entityType: 'room',
        entityId: room._id,
        action: 'housekeeping_status_changed',
        title: `Room ${room.number} → ${newHkStatus}`,
        description: `Task status changed from ${oldStatus} to ${updates.status}`,
        meta: { from: oldStatus, to: updates.status, taskId },
      }], { session: s });
    }

    // Task activity logs
    const activityLogs: any[] = [];

    if (updates.status && updates.status !== oldStatus) {
      activityLogs.push({
        actorId: new mongoose.Types.ObjectId(actorId),
        entityType: 'task',
        entityId: new mongoose.Types.ObjectId(taskId),
        action: updates.status === 'done' ? 'completed' : 'status_changed',
        title: updates.status === 'done' ? 'Task completed' : `Task status: ${updates.status}`,
        description: `Status changed from ${oldStatus} to ${updates.status}`,
        meta: { from: oldStatus, to: updates.status },
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== oldAssigneeId) {
      const newAssigneeName = data.assigneeId
        ? (await User.findById(data.assigneeId).session(s))?.name ?? 'Unknown'
        : 'Unassigned';
      activityLogs.push({
        actorId: new mongoose.Types.ObjectId(actorId),
        entityType: 'task',
        entityId: new mongoose.Types.ObjectId(taskId),
        action: data.assigneeId && oldAssigneeId ? 'reassigned' : data.assigneeId ? 'assigned' : 'unassigned',
        title: data.assigneeId ? `Assigned to ${newAssigneeName}` : 'Task unassigned',
        description: oldAssigneeId
          ? `Reassigned from ${(await User.findById(oldAssigneeId).session(s))?.name ?? 'Unknown'} to ${newAssigneeName}`
          : `Assigned to ${newAssigneeName}`,
        meta: { oldAssigneeId, newAssigneeId: data.assigneeId },
      });
    }

    if (activityLogs.length > 0) {
      await ActivityLog.create(activityLogs, { session: s });
    }

    const populated = await HousekeepingTask.findById(taskId)
      .populate({ path: 'roomId', populate: { path: 'roomTypeId' } })
      .populate('assigneeId')
      .session(s);

    return serializeHousekeepingTask(populated, populated?.roomId, populated?.assigneeId);
  });
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

export async function getStats() {
  const [roomStats, taskStats, completedToday] = await Promise.all([
    // Room housekeeping breakdown
    Room.aggregate([
      { $group: { _id: '$housekeepingStatus', count: { $sum: 1 } } },
    ]),
    // Task counts by status
    HousekeepingTask.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Completed tasks today
    HousekeepingTask.countDocuments({
      status: 'done',
      lastActivityAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  const roomMap: Record<string, number> = {};
  for (const r of roomStats) roomMap[r._id] = r.count;

  const taskMap: Record<string, number> = {};
  for (const t of taskStats) taskMap[t._id] = t.count;

  return serializeHousekeepingStats({
    totalTasks: taskStats.reduce((sum, t) => sum + t.count, 0),
    dirtyRooms: roomMap.dirty ?? 0,
    cleaningTasks: taskMap.cleaning ?? 0,
    needsInspectionRooms: roomMap.needs_inspection ?? 0,
    maintenanceRooms: roomMap.out_of_order ?? 0,
    cleanRooms: roomMap.clean ?? 0,
    completedToday,
    openTasks: (taskMap.dirty ?? 0) + (taskMap.cleaning ?? 0) + (taskMap.needs_inspection ?? 0),
    byContext: await HousekeepingTask.aggregate([
      { $group: { _id: '$context', count: { $sum: 1 } } },
    ]).then(rows => Object.fromEntries(rows.map(r => [r._id, r.count]))),
    byFloor: await HousekeepingTask.aggregate([
      { $lookup: { from: 'rooms', localField: 'roomId', foreignField: '_id', as: 'room' } },
      { $unwind: '$room' },
      { $group: { _id: '$room.floor', count: { $sum: 1 } } },
    ]).then(rows => Object.fromEntries(rows.map(r => [String(r._id), r.count]))),
  });
}

/* ------------------------------------------------------------------ */
/*  Staff schedule                                                     */
/* ------------------------------------------------------------------ */

export async function getStaffSchedule(floor?: number) {
  const staff = await User.find({ role: 'housekeeping', active: true }).lean();
  if (staff.length === 0) return [];

  const staffIds = staff.map(s => s._id);
  const taskFilter: Record<string, any> = { assigneeId: { $in: staffIds } };

  if (floor) {
    const roomIds = await Room.distinct('_id', { floor });
    taskFilter.roomId = { $in: roomIds };
  }

  const tasks = await HousekeepingTask.find(taskFilter).populate('roomId').lean();

  // Group by staff
  const staffTasks = new Map<string, any[]>();
  for (const s of staff) staffTasks.set(s._id.toString(), []);
  for (const t of tasks) {
    const sid = t.assigneeId?.toString();
    if (sid && staffTasks.has(sid)) staffTasks.get(sid)!.push(t);
  }

  const result = staff.map(s => {
    const myTasks = staffTasks.get(s._id.toString()) ?? [];
    const completed = myTasks.filter(t => t.status === 'done');
    const overdue = myTasks.filter(t =>
      t.estimateCompletionAt && new Date(t.estimateCompletionAt) < new Date() && t.status !== 'done',
    );
    const floors = [...new Set(myTasks.map((t: any) => t.roomId?.floor).filter(Boolean))].sort((a: number, b: number) => a - b);

    return serializeStaffScheduleEntry(s, floors, myTasks.length, completed.length, overdue.length);
  });

  return result;
}

/* ------------------------------------------------------------------ */
/*  Checkout hook preparation                                          */
/* ------------------------------------------------------------------ */

export async function createCheckoutHousekeepingTask(roomId: string, actorId: string, session?: mongoose.ClientSession) {
  const run = async (s: mongoose.ClientSession) => {
    const room = await Room.findById(roomId).populate('roomTypeId').session(s);
    if (!room) throw ApiError.badRequest('Invalid roomId');

    const [task] = await HousekeepingTask.create([{
      roomId: new mongoose.Types.ObjectId(roomId),
      context: 'checkout',
      type: 'cleaning',
      status: 'dirty',
      progressPercent: 0,
      lastActivityAt: new Date(),
    }], { session: s });

    await Room.findByIdAndUpdate(roomId, { $set: { housekeepingStatus: 'dirty' } }, { session: s });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'task',
      entityId: task._id,
      action: 'created',
      title: `Checkout housekeeping task created`,
      description: `Checkout cleaning task for Room ${room.number}`,
      meta: { roomId, context: 'checkout', type: 'cleaning', status: 'dirty', autoCreated: true },
    }], { session: s });

    await ActivityLog.create([{
      actorId: new mongoose.Types.ObjectId(actorId),
      entityType: 'room',
      entityId: new mongoose.Types.ObjectId(roomId),
      action: 'housekeeping_status_changed',
      title: `Room ${room.number} → dirty`,
      description: 'Checkout completed — room marked dirty',
      meta: { from: room.housekeepingStatus, to: 'dirty', trigger: 'checkout' },
    }], { session: s });

    return task;
  };

  if (session) return run(session);
  return applyTransaction(run);
}
