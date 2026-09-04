'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  projectMetrics,
  taskStatus,
  todayIso,
  type Priority,
  type TrackerProject,
  type TrackerTask,
} from '@/lib/tracker-data';

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: CircleGauge },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'timeline', label: 'Timeline', icon: CalendarRange },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'settings', label: 'Settings', icon: Settings },
];
const priorities: Priority[] = ['Low', 'Normal', 'High', 'Critical'];
const fmt = (d?: string | null, year = false) =>
  d
    ? new Intl.DateTimeFormat('en-CA', {
        month: 'short',
        day: 'numeric',
        ...(year ? { year: 'numeric' } : {}),
      }).format(new Date(d + 'T12:00:00'))
    : '—';
function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase().replaceAll(' ', '-')}`}>
      {value}
    </span>
  );
}

export function TrackerApp({
  projects,
  setProjects,
}: {
  projects: TrackerProject[];
  setProjects: React.Dispatch<React.SetStateAction<TrackerProject[]>>;
}) {
  const [section, setSection] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [projectDialog, setProjectDialog] = useState(false);
  const [taskEditor, setTaskEditor] = useState<{
    projectId: number;
    task: TrackerTask | null;
  } | null>(null);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'create_tracker_task',
          title: 'Create tracker task',
          description:
            'Create a task in an existing project and update the visible tracker.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'number' },
              name: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string', enum: priorities },
            },
            required: ['projectId', 'name'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input: unknown) => {
            const x = input as {
              projectId: number;
              name: string;
              dueDate?: string;
              priority?: Priority;
            };
            if (!x.name?.trim() || !projects.some((p) => p.id === x.projectId))
              throw new Error('A valid projectId and task name are required.');
            const task: TrackerTask = {
              id: Date.now(),
              projectId: x.projectId,
              name: x.name.trim(),
              type: 'Task',
              owner: 'Project owner',
              startDate: todayIso,
              dueDate: x.dueDate || null,
              percentComplete: 0,
              priority: x.priority || 'Normal',
              manualStatusOverride: null,
              notes: '',
              sortOrder: 999,
              archived: false,
            };
            setProjects((ps) =>
              ps.map((p) =>
                p.id === x.projectId ? { ...p, tasks: [...p.tasks, task] } : p,
              ),
            );
            return { id: task.id, status: 'created' };
          },
        },
        { signal: controller.signal },
      ),
    );
    return () => controller.abort();
  }, [projects, setProjects]);
  const active = projects.filter((p) => !p.archived),
    activeTasks = active
      .flatMap((p) => p.tasks)
      .filter((t) => !t.archived || t.percentComplete < 100);
  const metrics = useMemo(
    () => ({
      projects: active.length,
      tasks: activeTasks.filter((t) => t.percentComplete < 100).length,
      overdue: activeTasks.filter((t) => taskStatus(t) === 'Overdue').length,
      week: activeTasks.filter((t) => taskStatus(t) === 'Due Soon').length,
      milestones: activeTasks.filter(
        (t) => t.type === 'Milestone' && t.percentComplete < 100,
      ).length,
      progress: Math.round(
        activeTasks.reduce((s, t) => s + t.percentComplete, 0) /
          Math.max(activeTasks.length, 1),
      ),
    }),
    [active, activeTasks],
  );
  const saveTask = (task: TrackerTask) => {
    setProjects((ps) =>
      ps.map((p) =>
        p.id === task.projectId
          ? {
              ...p,
              tasks: p.tasks.some((t) => t.id === task.id)
                ? p.tasks.map((t) => (t.id === task.id ? task : t))
                : [...p.tasks, task],
            }
          : p,
      ),
    );
    setTaskEditor(null);
  };
  const saveProject = (p: TrackerProject) => {
    setProjects((ps) => [...ps, p]);
    setProjectDialog(false);
  };
  const page = {
    dashboard: (
      <Dashboard
        projects={active}
        metrics={metrics}
        goProjects={() => setSection('projects')}
      />
    ),
    projects: (
      <ProjectsView
        projects={active}
        query={query}
        setProjects={setProjects}
        editTask={(projectId, task) => setTaskEditor({ projectId, task })}
      />
    ),
    timeline: (
      <Timeline
        projects={active}
        editTask={(projectId, task) => setTaskEditor({ projectId, task })}
      />
    ),
    archive: <ArchiveView projects={projects} setProjects={setProjects} />,
    settings: <SettingsView />,
  }[section];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <LayoutDashboard size={19} />
          </div>
          <div>
            <strong>Project Tracker</strong>
            <span>Multi-project workspace</span>
          </div>
        </div>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={section === id ? 'active' : ''}
            >
              <Icon size={17} />
              {label}
              {id === 'projects' && <em>{active.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span>Portfolio</span>
          <strong>Your project portfolio</strong>
          <small>Private cloud workspace</small>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p>
              {new Date().toLocaleDateString('en-CA', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1>{nav.find((n) => n.id === section)?.label}</h1>
          </div>
          <div className="top-actions">
            <label>
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, tasks, notes"
              />
            </label>
            <button
              className="primary"
              onClick={() =>
                section === 'projects' && active.length > 0
                  ? setTaskEditor({ projectId: active[0]?.id || 1, task: null })
                  : setProjectDialog(true)
              }
            >
              <Plus size={16} /> New item
            </button>
          </div>
        </header>
        {page}
      </main>
      <NewProjectDialog
        open={projectDialog}
        onOpenChange={setProjectDialog}
        save={saveProject}
      />
      <TaskSheet
        editor={taskEditor}
        projects={active}
        close={() => setTaskEditor(null)}
        save={saveTask}
      />
    </div>
  );
}

function Dashboard({
  projects,
  metrics,
  goProjects,
}: {
  projects: TrackerProject[];
  metrics: {
    projects: number;
    tasks: number;
    overdue: number;
    week: number;
    milestones: number;
    progress: number;
  };
  goProjects: () => void;
}) {
  const attention = projects.filter((p) =>
    ['At Risk', 'Watch'].includes(projectMetrics(p).health),
  );
  return (
    <div className="content">
      <section className="heading-row">
        <div>
          <h2>Portfolio overview</h2>
          <p>Active workstreams, deadlines and delivery health at a glance.</p>
        </div>
        <button className="filter" onClick={goProjects}>
          <SlidersHorizontal size={15} /> Review work
        </button>
      </section>
      <section className="kpi-grid">
        <Kpi
          label="Active projects"
          value={metrics.projects}
          note={`${attention.length} require attention`}
        />
        <Kpi
          label="Active tasks"
          value={metrics.tasks}
          note={`${metrics.milestones} upcoming milestones`}
        />
        <Kpi
          cls="danger"
          label="Overdue"
          value={metrics.overdue}
          note={`Across ${attention.length} workstreams`}
        />
        <Kpi
          cls="warning"
          label="Due within 7 days"
          value={metrics.week}
          note="Upcoming task deadlines"
        />
        <article>
          <span>Overall completion</span>
          <strong>{metrics.progress}%</strong>
          <div className="bar full">
            <i style={{ width: `${metrics.progress}%` }} />
          </div>
        </article>
      </section>
      <ProjectHealth projects={projects} />
      <div className="lower-grid">
        <section className="panel compact">
          <PanelTitle
            title="Requires attention"
            note="High-priority schedule exceptions."
          />
          {attention.slice(0, 4).map((p) => {
            const m = projectMetrics(p);
            return (
              <div className="attention" key={p.id}>
                <span
                  className={`signal ${m.health === 'At Risk' ? 'bad' : ''}`}
                />
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {m.overdue} overdue · {m.next?.name}
                  </small>
                </div>
                <Badge value={m.health} />
              </div>
            );
          })}
        </section>
        <section className="panel compact">
          <PanelTitle
            title="Upcoming milestones"
            note="Next scheduled decision points and releases."
          />
          {projects
            .flatMap((p) => p.tasks.map((t) => ({ p, t })))
            .filter(
              (x) => x.t.type === 'Milestone' && x.t.percentComplete < 100,
            )
            .sort((a, b) =>
              (a.t.dueDate || '').localeCompare(b.t.dueDate || ''),
            )
            .slice(0, 4)
            .map(({ p, t }) => (
              <div className="milestone" key={t.id}>
                <div className="datebox">
                  <strong>{fmt(t.dueDate).split(' ')[1]}</strong>
                  <span>{fmt(t.dueDate).split(' ')[0]}</span>
                </div>
                <div>
                  <strong>{t.name}</strong>
                  <small>{p.name}</small>
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
function Kpi({
  label,
  value,
  note,
  cls = '',
}: {
  label: string;
  value: number;
  note: string;
  cls?: string;
}) {
  return (
    <article className={cls}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function PanelTitle({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        <p>{note}</p>
      </div>
      {children}
    </div>
  );
}
function ProjectHealth({ projects }: { projects: TrackerProject[] }) {
  return (
    <section className="panel">
      <PanelTitle
        title="Project health"
        note="Calculated from active task dates and priority."
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project / workstream</th>
              <th>Progress</th>
              <th>Health</th>
              <th>Next due item</th>
              <th>Due</th>
              <th>Overdue</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const m = projectMetrics(p);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="project-name">
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.notes}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <Progress value={m.progress} />
                  </td>
                  <td>
                    <Badge value={m.health} />
                  </td>
                  <td>
                    {m.next ? (
                      <>
                        <strong className="task-title">{m.next.name}</strong>
                        <Badge value={taskStatus(m.next)} />
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{fmt(m.next?.dueDate)}</td>
                  <td>
                    <b className={m.overdue ? 'red' : ''}>{m.overdue}</b>
                  </td>
                  <td>{m.open}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div className="progress-cell">
      <span>{value}%</span>
      <div className="bar">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProjectsView({
  projects,
  query,
  setProjects,
  editTask,
}: {
  projects: TrackerProject[];
  query: string;
  setProjects: React.Dispatch<React.SetStateAction<TrackerProject[]>>;
  editTask: (p: number, t: TrackerTask | null) => void;
}) {
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [status, setStatus] = useState('All statuses');
  const [priority, setPriority] = useState('All priorities');
  const filtered = projects.filter((p) => {
    const hay = (
      p.name +
      ' ' +
      p.notes +
      ' ' +
      p.tasks.map((t) => t.name + ' ' + t.notes).join(' ')
    ).toLowerCase();
    return (
      hay.includes(query.toLowerCase()) &&
      (priority === 'All priorities' || p.priority === priority) &&
      (status === 'All statuses' ||
        p.tasks.some((t) => taskStatus(t) === status))
    );
  });
  const toggle = (id: number) =>
    setExpanded((xs) =>
      xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id],
    );
  const archiveProject = (id: number) => {
    setProjects((ps) =>
      ps.map((p) => (p.id === id ? { ...p, archived: true } : p)),
    );
  };
  return (
    <div className="content">
      <section className="heading-row">
        <div>
          <h2>Projects & workstreams</h2>
          <p>Update delivery details and tasks without leaving this view.</p>
        </div>
        <button
          className="primary"
          disabled={projects.length === 0}
          onClick={() => editTask(projects[0]?.id || 1, null)}
        >
          <Plus size={15} /> Add task
        </button>
      </section>
      <div className="filterbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All statuses</option>
          {[
            'Overdue',
            'Due Soon',
            'In Progress',
            'Not Started',
            'Complete',
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>All priorities</option>
          {priorities.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setStatus('All statuses');
            setPriority('All priorities');
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
        <span>{filtered.length} projects</span>
      </div>
      <section className="project-list">
        {filtered.map((p) => {
          const m = projectMetrics(p);
          const open = expanded.includes(p.id);
          return (
            <article key={p.id} className="project-card">
              <div className="project-summary">
                <button className="expand" onClick={() => toggle(p.id)}>
                  {open ? <ChevronDown /> : <ChevronRight />}
                </button>
                <div className="project-info">
                  <strong>{p.name}</strong>
                  <small>{p.description}</small>
                </div>
                <Progress value={m.progress} />
                <Badge value={m.health} />
                <div className="stat">
                  <span>Target</span>
                  <b>{fmt(p.targetEndDate, true)}</b>
                </div>
                <div className="stat">
                  <span>Open</span>
                  <b>{m.open}</b>
                </div>
                <div className="stat">
                  <span>Overdue</span>
                  <b className={m.overdue ? 'red' : ''}>{m.overdue}</b>
                </div>
                <button
                  className="more"
                  title="Archive project"
                  onClick={() => archiveProject(p.id)}
                >
                  <Archive size={15} />
                </button>
              </div>
              {open && (
                <div className="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Task / deliverable</th>
                        <th>Type</th>
                        <th>Start</th>
                        <th>Due</th>
                        <th>Progress</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.tasks
                        .filter((t) => !t.archived || t.percentComplete < 100)
                        .map((t) => (
                          <tr key={t.id}>
                            <td>
                              <GripVertical size={14} />
                            </td>
                            <td>
                              <button
                                className="task-link"
                                onClick={() => editTask(p.id, t)}
                              >
                                <strong>{t.name}</strong>
                                {t.notes && <small>{t.notes}</small>}
                              </button>
                            </td>
                            <td>{t.type}</td>
                            <td>{fmt(t.startDate)}</td>
                            <td>{fmt(t.dueDate)}</td>
                            <td>
                              <Progress value={t.percentComplete} />
                            </td>
                            <td>
                              <Badge value={t.priority} />
                            </td>
                            <td>
                              <Badge value={taskStatus(t)} />
                            </td>
                            <td>{t.owner}</td>
                            <td>
                              <button
                                className="more"
                                onClick={() => editTask(p.id, t)}
                              >
                                <MoreHorizontal size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <button
                    className="add-row"
                    onClick={() => editTask(p.id, null)}
                  >
                    <Plus size={14} /> Add task or milestone
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Timeline({
  projects,
  editTask,
}: {
  projects: TrackerProject[];
  editTask: (p: number, t: TrackerTask) => void;
}) {
  const [view, setView] = useState<'Week' | 'Month'>('Month');
  const start = new Date('2026-08-17T12:00:00'),
    end = new Date(
      view === 'Month' ? '2026-12-28T12:00:00' : '2026-10-12T12:00:00',
    );
  const span = end.getTime() - start.getTime();
  const pos = (d: string | null) =>
    d
      ? Math.max(
          0,
          Math.min(
            100,
            ((new Date(d + 'T12:00:00').getTime() - start.getTime()) / span) *
              100,
          ),
        )
      : 0;
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <div className="content timeline-page">
      <section className="heading-row">
        <div>
          <h2>Portfolio timeline</h2>
          <p>
            One schedule generated automatically from project and task dates.
          </p>
        </div>
        <div className="segmented">
          <button
            className={view === 'Week' ? 'on' : ''}
            onClick={() => setView('Week')}
          >
            Week
          </button>
          <button
            className={view === 'Month' ? 'on' : ''}
            onClick={() => setView('Month')}
          >
            Month
          </button>
        </div>
      </section>
      <section className="timeline panel">
        <div className="timeline-head">
          <div>Project / task</div>
          <div className="months">
            {months.slice(0, view === 'Month' ? 5 : 3).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
        <div className="timeline-body">
          <div
            className="today-line"
            style={{
              left: `calc(330px + (100% - 330px) * ${pos(todayIso) / 100})`,
            }}
          >
            <span>Today</span>
          </div>
          {projects.map((p) => (
            <div key={p.id}>
              <div className="gantt-project">
                <div>
                  <ChevronDown size={14} />
                  <strong>{p.name}</strong>
                  <Badge value={projectMetrics(p).health} />
                </div>
                <div className="project-track">
                  <i
                    style={{
                      left: `${pos(p.startDate)}%`,
                      width: `${Math.max(1, pos(p.targetEndDate) - pos(p.startDate))}%`,
                    }}
                  />
                </div>
              </div>
              {p.tasks
                .filter((t) => !t.archived || t.percentComplete < 100)
                .map((t) => (
                  <button
                    className="gantt-task"
                    key={t.id}
                    onClick={() => editTask(p.id, t)}
                  >
                    <div>
                      <span>{t.type === 'Milestone' ? '◆' : '—'}</span>
                      <strong>{t.name}</strong>
                      <small>{fmt(t.dueDate)}</small>
                    </div>
                    <div className="task-track">
                      {t.type === 'Milestone' ? (
                        <i
                          className="diamond"
                          style={{ left: `${pos(t.dueDate)}%` }}
                        />
                      ) : (
                        <i
                          className={taskStatus(t) === 'Overdue' ? 'late' : ''}
                          style={{
                            left: `${pos(t.startDate)}%`,
                            width: `${Math.max(1, pos(t.dueDate) - pos(t.startDate))}%`,
                          }}
                        >
                          <b style={{ width: `${t.percentComplete}%` }} />
                        </i>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArchiveView({
  projects,
  setProjects,
}: {
  projects: TrackerProject[];
  setProjects: React.Dispatch<React.SetStateAction<TrackerProject[]>>;
}) {
  const archivedProjects = projects.filter((p) => p.archived),
    items = projects.flatMap((p) =>
      p.tasks
        .filter((t) => t.archived || t.manualStatusOverride === 'Cancelled')
        .map((t) => ({ p, t })),
    );
  const restoreProject = (id: number) => {
    setProjects((ps) =>
      ps.map((p) => (p.id === id ? { ...p, archived: false } : p)),
    );
  };
  const restoreTask = (pId: number, id: number) => {
    setProjects((ps) =>
      ps.map((p) =>
        p.id === pId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, archived: false } : t,
              ),
            }
          : p,
      ),
    );
  };
  return (
    <div className="content">
      <section className="heading-row">
        <div>
          <h2>Archive</h2>
          <p>
            Completed, cancelled and historical items remain searchable and
            restorable.
          </p>
        </div>
      </section>
      <section className="panel">
        <PanelTitle
          title="Archived projects"
          note={`${archivedProjects.length} historical workstreams`}
        />
        {archivedProjects.map((p) => (
          <div className="archive-row" key={p.id}>
            <Archive size={16} />
            <div>
              <strong>{p.name}</strong>
              <small>{p.description}</small>
            </div>
            <Badge value="Complete" />
            <button onClick={() => restoreProject(p.id)}>
              <RotateCcw size={13} /> Restore
            </button>
          </div>
        ))}
      </section>
      <section className="panel">
        <PanelTitle
          title="Completed & archived tasks"
          note={`${items.length} retained records`}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Completed / due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 16).map(({ p, t }) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.name}</strong>
                  </td>
                  <td>{p.name}</td>
                  <td>{fmt(t.dueDate, true)}</td>
                  <td>
                    <Badge value={taskStatus(t)} />
                  </td>
                  <td>
                    <button
                      className="restore"
                      onClick={() => restoreTask(p.id, t.id)}
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function SettingsView() {
  return (
    <div className="content">
      <section className="heading-row">
        <div>
          <h2>Preferences</h2>
          <p>
            Display defaults. Your project data is private to your signed-in
            account.
          </p>
        </div>
      </section>
      <section className="panel settings-panel">
        <label>
          <span>
            Due soon threshold
            <small>
              Tasks inside this window are highlighted on the dashboard.
            </small>
          </span>
          <select defaultValue="7">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
          </select>
        </label>
        <label>
          <span>
            Default timeline view
            <small>Initial scale for the Gantt timeline.</small>
          </span>
          <select defaultValue="Month">
            <option>Month</option>
            <option>Week</option>
          </select>
        </label>
        <label>
          <span>
            Date format
            <small>Applied consistently across project and task views.</small>
          </span>
          <select defaultValue="MMM d, yyyy">
            <option>MMM d, yyyy</option>
            <option>yyyy-MM-dd</option>
          </select>
        </label>
      </section>
    </div>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
  save,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  save: (p: TrackerProject) => void;
}) {
  const [name, setName] = useState('');
  const value = (id: string) =>
    (document.getElementById(id) as unknown as { value: string }).value;
  if (!open) return null;
  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <section
        className="form-dialog modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={() => onOpenChange(false)}>
          <X size={16} />
        </button>
        <header>
          <h3>Create project</h3>
          <p>
            Add a workstream. Progress and health will be calculated from its
            tasks.
          </p>
        </header>
        <label>
          Project name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="form-grid">
          <label>
            Start date
            <input type="date" id="p-start" defaultValue={todayIso} />
          </label>
          <label>
            Target end
            <input type="date" id="p-end" defaultValue="2026-12-31" />
          </label>
        </div>
        <label>
          Priority
          <select id="p-priority" defaultValue="Normal">
            {priorities.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button
          className="primary save"
          disabled={!name.trim()}
          onClick={() =>
            save({
              id: Date.now(),
              name: name.trim(),
              description: 'New project workstream.',
              priority: value('p-priority') as Priority,
              startDate: value('p-start'),
              targetEndDate: value('p-end'),
              notes: '',
              archived: false,
              tasks: [],
            })
          }
        >
          Create project
        </button>
      </section>
    </div>
  );
}
function TaskSheet({
  editor,
  projects,
  close,
  save,
}: {
  editor: { projectId: number; task: TrackerTask | null } | null;
  projects: TrackerProject[];
  close: () => void;
  save: (t: TrackerTask) => void;
}) {
  if (!editor) return null;
  const existing = editor.task;
  const get = (id: string) =>
    (document.querySelector(id) as unknown as { value: string }).value;
  return (
    <div
      className="overlay sheet-overlay"
      role="presentation"
      onMouseDown={close}
    >
      <section
        className="task-sheet"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close}>
          <X size={16} />
        </button>
        <header>
          <h3>{existing ? 'Edit task' : 'Create task'}</h3>
          <p>
            Changes flow through to dashboard health and the timeline
            automatically.
          </p>
        </header>
        <div className="sheet-form">
          <label>
            Project
            <select id="t-project" defaultValue={editor.projectId}>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Task / deliverable name
            <input id="t-name" defaultValue={existing?.name} />
          </label>
          <div className="form-grid">
            <label>
              Type
              <select id="t-type" defaultValue={existing?.type || 'Task'}>
                <option>Task</option>
                <option>Milestone</option>
              </select>
            </label>
            <label>
              Priority
              <select
                id="t-priority"
                defaultValue={existing?.priority || 'Normal'}
              >
                {priorities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              Start date
              <input
                id="t-start"
                type="date"
                defaultValue={existing?.startDate || todayIso}
              />
            </label>
            <label>
              Due date
              <input
                id="t-due"
                type="date"
                defaultValue={existing?.dueDate || ''}
              />
            </label>
          </div>
          <label>
            Percent complete <output>{existing?.percentComplete || 0}%</output>
            <input
              id="t-progress"
              type="range"
              min="0"
              max="100"
              step="5"
              defaultValue={existing?.percentComplete || 0}
            />
          </label>
          <label>
            Owner
            <input
              id="t-owner"
              defaultValue={existing?.owner || 'Project owner'}
            />
          </label>
          <label>
            Status override
            <select
              id="t-status"
              defaultValue={existing?.manualStatusOverride || ''}
            >
              <option value="">Automatic</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label>
            Latest update / notes
            <textarea id="t-notes" defaultValue={existing?.notes} />
          </label>
        </div>
        <footer>
          <button
            className="primary save"
            onClick={() => {
              const projectId = Number(get('#t-project'));
              save({
                id: existing?.id || Date.now(),
                projectId,
                name: get('#t-name') || 'Untitled task',
                type: get('#t-type') as 'Task' | 'Milestone',
                owner: get('#t-owner'),
                startDate: get('#t-start') || null,
                dueDate: get('#t-due') || null,
                percentComplete: Number(get('#t-progress')),
                priority: get('#t-priority') as Priority,
                manualStatusOverride: (get('#t-status') ||
                  null) as TrackerTask['manualStatusOverride'],
                notes: get('#t-notes'),
                sortOrder: existing?.sortOrder || 999,
                archived: existing?.archived || false,
              });
            }}
          >
            Save task
          </button>
          {existing && (
            <button
              className="archive-action"
              onClick={() => save({ ...existing, archived: true })}
            >
              <Archive size={13} /> Archive task
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
