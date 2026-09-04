export type Priority = 'Low' | 'Normal' | 'High' | 'Critical';
export type TaskType = 'Task' | 'Milestone';
export type TrackerTask = {
  id: number;
  projectId: number;
  name: string;
  type: TaskType;
  owner: string;
  startDate: string | null;
  dueDate: string | null;
  percentComplete: number;
  priority: Priority;
  manualStatusOverride: 'On Hold' | 'Cancelled' | null;
  notes: string;
  sortOrder: number;
  archived: boolean;
  predecessor?: number | null;
};
export type TrackerProject = {
  id: number;
  name: string;
  description: string;
  priority: Priority;
  startDate: string;
  targetEndDate: string;
  notes: string;
  archived: boolean;
  tasks: TrackerTask[];
};
const t = (
  id: number,
  projectId: number,
  name: string,
  startDate: string | null,
  dueDate: string | null,
  percentComplete: number,
  extra: Partial<TrackerTask> = {},
): TrackerTask => ({
  id,
  projectId,
  name,
  type: 'Task',
  owner: 'Project owner',
  startDate,
  dueDate,
  percentComplete,
  priority: 'Normal',
  manualStatusOverride: null,
  notes: '',
  sortOrder: id,
  archived: percentComplete === 100,
  ...extra,
});
export const seedProjects: TrackerProject[] = [
  {
    id: 1,
    name: 'Product Website Refresh',
    description:
      'Modernize the marketing site, content system and analytics foundation.',
    priority: 'High',
    startDate: '2026-08-03',
    targetEndDate: '2026-10-16',
    notes: 'Design review is scheduled this week.',
    archived: false,
    tasks: [
      t(101, 1, 'Content inventory', '2026-08-03', '2026-08-14', 100),
      t(102, 1, 'Approve page templates', '2026-08-17', '2026-09-04', 75, {
        priority: 'High',
        notes: 'Final stakeholder comments are in review.',
        archived: false,
      }),
      t(103, 1, 'Build responsive templates', '2026-09-07', '2026-09-25', 20, {
        priority: 'High',
        archived: false,
      }),
      t(
        104,
        1,
        'Accessibility and performance testing',
        '2026-09-28',
        '2026-10-09',
        0,
        { archived: false },
      ),
      t(105, 1, 'Public launch', '2026-10-16', '2026-10-16', 0, {
        type: 'Milestone',
        priority: 'Critical',
        archived: false,
      }),
    ],
  },
  {
    id: 2,
    name: 'Customer Onboarding Automation',
    description:
      'Reduce manual handoffs across sales, support and customer success.',
    priority: 'Critical',
    startDate: '2026-07-20',
    targetEndDate: '2026-09-30',
    notes: 'Integration testing needs attention.',
    archived: false,
    tasks: [
      t(
        201,
        2,
        'Map current onboarding workflow',
        '2026-07-20',
        '2026-07-31',
        100,
      ),
      t(202, 2, 'Configure CRM triggers', '2026-08-03', '2026-08-21', 80, {
        priority: 'High',
        archived: false,
      }),
      t(203, 2, 'Connect help desk workflow', '2026-08-24', '2026-09-02', 60, {
        priority: 'Critical',
        notes: 'Waiting for vendor response.',
        archived: false,
      }),
      t(
        204,
        2,
        'Run pilot with five customers',
        '2026-09-07',
        '2026-09-18',
        0,
        { priority: 'High', archived: false },
      ),
      t(205, 2, 'Automation rollout', '2026-09-30', '2026-09-30', 0, {
        type: 'Milestone',
        priority: 'Critical',
        archived: false,
      }),
    ],
  },
  {
    id: 3,
    name: 'Mobile App Release',
    description:
      'Prepare the next mobile release across design, engineering and support.',
    priority: 'High',
    startDate: '2026-08-10',
    targetEndDate: '2026-09-18',
    notes: 'Beta testing is underway.',
    archived: false,
    tasks: [
      t(301, 3, 'Feature complete', '2026-08-10', '2026-08-28', 100),
      t(302, 3, 'Beta testing', '2026-08-31', '2026-09-11', 45, {
        priority: 'High',
        notes: 'Testing in staging.',
        archived: false,
      }),
      t(
        303,
        3,
        'Store listing and release notes',
        '2026-09-01',
        '2026-09-10',
        30,
        { archived: false },
      ),
      t(304, 3, 'Submit to app stores', '2026-09-14', '2026-09-14', 0, {
        type: 'Milestone',
        priority: 'High',
        archived: false,
      }),
      t(305, 3, 'Release', '2026-09-18', '2026-09-18', 0, {
        type: 'Milestone',
        priority: 'Critical',
        archived: false,
      }),
    ],
  },
  {
    id: 4,
    name: 'Data Platform Upgrade',
    description:
      'Move reporting workloads to the new warehouse and validation pipeline.',
    priority: 'High',
    startDate: '2026-09-01',
    targetEndDate: '2026-12-11',
    notes: 'Source-system discovery is in progress.',
    archived: false,
    tasks: [
      t(401, 4, 'Confirm source systems', '2026-09-01', '2026-09-11', 10, {
        priority: 'High',
        archived: false,
      }),
      t(402, 4, 'Design target data model', '2026-09-14', '2026-09-25', 0, {
        archived: false,
      }),
      t(403, 4, 'Build ingestion pipeline', '2026-09-28', '2026-10-30', 0, {
        archived: false,
      }),
      t(404, 4, 'Reconcile business metrics', '2026-11-02', '2026-11-20', 0, {
        priority: 'High',
        archived: false,
      }),
      t(405, 4, 'Production cutover', '2026-12-11', '2026-12-11', 0, {
        type: 'Milestone',
        priority: 'Critical',
        archived: false,
      }),
    ],
  },
  {
    id: 5,
    name: 'Office Move',
    description:
      'Coordinate facilities, technology, vendors and employee communications.',
    priority: 'Normal',
    startDate: '2026-07-06',
    targetEndDate: '2026-08-28',
    notes: 'Move completed; remaining items are being closed.',
    archived: false,
    tasks: [
      t(501, 5, 'Approve floor plan', '2026-07-06', '2026-07-17', 100),
      t(502, 5, 'Install network equipment', '2026-08-10', '2026-08-21', 100),
      t(503, 5, 'Employee move day', '2026-08-28', '2026-08-28', 100, {
        type: 'Milestone',
      }),
      t(
        504,
        5,
        'Close outstanding facilities items',
        '2026-08-31',
        '2026-09-04',
        70,
        { archived: false },
      ),
    ],
  },
  {
    id: 6,
    name: 'Legacy Reporting Migration',
    description:
      'Historical project retained as a reusable delivery reference.',
    priority: 'Normal',
    startDate: '2026-01-12',
    targetEndDate: '2026-05-29',
    notes: 'Migration completed and archived.',
    archived: true,
    tasks: [
      t(601, 6, 'Inventory reports', '2026-01-12', '2026-01-30', 100),
      t(602, 6, 'Rebuild priority dashboards', '2026-02-02', '2026-04-17', 100),
      t(603, 6, 'Decommission legacy server', '2026-05-29', '2026-05-29', 100, {
        type: 'Milestone',
      }),
    ],
  },
];
export const todayIso = new Date().toLocaleDateString('en-CA');
export function taskStatus(task: TrackerTask) {
  if (task.manualStatusOverride) return task.manualStatusOverride;
  if (task.percentComplete >= 100) return 'Complete';
  if (!task.dueDate) return 'No Date';
  if (task.dueDate < todayIso) return 'Overdue';
  const diff =
    (new Date(task.dueDate + 'T12:00:00').getTime() -
      new Date(todayIso + 'T12:00:00').getTime()) /
    86400000;
  if (diff <= 7) return 'Due Soon';
  if (task.startDate && task.startDate > todayIso && task.percentComplete === 0)
    return 'Not Started';
  return task.percentComplete > 0 ? 'In Progress' : 'Not Started';
}
export function projectMetrics(project: TrackerProject) {
  const active = project.tasks.filter(
      (x) => !x.archived || x.percentComplete < 100,
    ),
    complete = project.tasks.length > 0 && project.tasks.every(
      (x) => x.percentComplete >= 100 || x.manualStatusOverride === 'Cancelled',
    ),
    progress = project.tasks.length
      ? Math.round(
          project.tasks.reduce((s, x) => s + x.percentComplete, 0) /
            project.tasks.length,
        )
      : 0,
    overdue = active.filter((x) => taskStatus(x) === 'Overdue'),
    dueSoon = active.filter((x) => taskStatus(x) === 'Due Soon'),
    health = complete
      ? 'Complete'
      : overdue.some((x) => x.priority === 'High' || x.priority === 'Critical')
        ? 'At Risk'
        : overdue.length || dueSoon.length
          ? 'Watch'
          : 'On Track',
    next = active
      .filter((x) => x.dueDate && x.percentComplete < 100)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))[0];
  return {
    progress,
    health,
    overdue: overdue.length,
    open: active.filter((x) => x.percentComplete < 100).length,
    next,
  };
}
