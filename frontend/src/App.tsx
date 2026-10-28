
import { useEffect, useMemo, useState, type FormEvent } from "react";

import AuthScreen from "./AuthScreen";

import {
  cancelMeeting as cancelMeetingApi,
  clearToken,
  createMeeting as createMeetingApi,
  getMeetings,
  getMe,
  getWorkspaces,
  hasToken,
  type Meeting as ApiMeeting,
  type User,
  type Workspace,
} from "./lib/api";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Filter,
  LayoutDashboard,
  ListTodo,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Video,
  X,
  LogOut,
} from "lucide-react";

type MeetingStatus = "Scheduled" | "In progress" | "Completed" | "Cancelled";

type Meeting = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: MeetingStatus;
  duration: string;
  attendees: number;
};


const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Meetings", icon: Video },
  { label: "AI Insights", icon: BrainCircuit },
  { label: "Action Center", icon: ListTodo },
];

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status: MeetingStatus) {
  switch (status) {
    case "Scheduled":
      return "status-scheduled";
    case "In progress":
      return "status-live";
    case "Completed":
      return "status-completed";
    case "Cancelled":
      return "status-cancelled";
  }
}

function mapApiMeeting(meeting: ApiMeeting): Meeting {
  const statusMap: Record<string, MeetingStatus> = {
    scheduled: "Scheduled",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description ?? "No description added",
    date: meeting.scheduled_for ?? meeting.created_at,
    status: statusMap[meeting.status.toLowerCase()] ?? "Scheduled",
    duration:
      meeting.started_at && meeting.ended_at
        ? `${Math.max(
          1,
          Math.round(
            (new Date(meeting.ended_at).getTime() -
              new Date(meeting.started_at).getTime()) /
            60000,
          ),
        )} min`
        : "—",
    attendees: 0,
  };
}

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All meetings");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const visibleMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          meeting.title.toLowerCase().includes(query) ||
          meeting.description.toLowerCase().includes(query);

        const matchesFilter =
          filter === "All meetings" || meeting.status === filter;

        return matchesSearch && matchesFilter;
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [meetings, search, filter]);

  const scheduledCount = meetings.filter(
    (meeting) => meeting.status === "Scheduled",
  ).length;

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "Completed",
  ).length;

  const activeCount = meetings.filter(
    (meeting) => meeting.status === "In progress",
  ).length;

  function logout() {
    clearToken();
    setUser(null);
    setWorkspace(null);
    setMeetings([]);
  }

  async function loadAuthenticatedData() {
    setAuthChecking(true);
    

    try {
      const currentUser = await getMe();
      const workspaces = await getWorkspaces();

      if (workspaces.length === 0) {
        throw new Error("Your account does not have an accessible workspace.");
      }

      const activeWorkspace = workspaces[0];

      setUser(currentUser);
      setWorkspace(activeWorkspace);
      setDataLoading(true);

      const apiMeetings = await getMeetings(activeWorkspace.id);
      setMeetings(apiMeetings.map(mapApiMeeting));
    } catch (error) {
      clearToken();
      setUser(null);
      setWorkspace(null);
      setMeetings([]);

    } finally {
      setAuthChecking(false);
      setDataLoading(false);
    }
  }
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!hasToken()) {
        setAuthChecking(false);
        return;
      }

      await loadAuthenticatedData();
    }

    const handleUnauthorized = () => {
      if (!mounted) return;

      setUser(null);
      setWorkspace(null);
      setMeetings([]);
    };

    window.addEventListener("meetorbit:unauthorized", handleUnauthorized);
    void restoreSession();

    return () => {
      mounted = false;
      window.removeEventListener(
        "meetorbit:unauthorized",
        handleUnauthorized,
      );
    };
  }, []);

  function openCreateModal() {
    setTitle("");
    setDescription("");
    setScheduledFor("");
    setFormError("");
    setShowModal(true);
  }

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!workspace) {
      setFormError("No workspace is selected. Please sign in again.");
      return;
    }

    if (!title.trim()) {
      setFormError("Enter a meeting title.");
      return;
    }

    if (!scheduledFor) {
      setFormError("Choose a meeting date and time.");
      return;
    }

    const chosenDate = new Date(scheduledFor);

    if (Number.isNaN(chosenDate.getTime()) || chosenDate <= new Date()) {
      setFormError("Choose a future date and time.");
      return;
    }

    setDataLoading(true);

    try {
      const created = await createMeetingApi(workspace.id, {
        title: title.trim(),
        description: description.trim() || null,
        scheduled_for: chosenDate.toISOString(),
      });

      setMeetings((current) => [mapApiMeeting(created), ...current]);
      setShowModal(false);
      setActiveNav("Meetings");
      setFilter("All meetings");
      setSearch("");
      setNotice("Meeting saved successfully.");
      window.setTimeout(() => setNotice(""), 3500);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not create the meeting.",
      );
    } finally {
      setDataLoading(false);
    }
  }

  async function cancelMeeting(id: string) {
    if (!workspace) return;

    const meeting = meetings.find((item) => item.id === id);

    if (!meeting || meeting.status !== "Scheduled") return;

    try {
      const updated = await cancelMeetingApi(workspace.id, id);

      setMeetings((current) =>
        current.map((item) =>
          item.id === id ? mapApiMeeting(updated) : item,
        ),
      );

      setNotice("Meeting cancelled successfully.");
      window.setTimeout(() => setNotice(""), 3500);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not cancel the meeting.",
      );
    }
  }

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    Overview: {
      title: "Good morning",
      subtitle: "Here's what's happening across your meetings.",
    },
    Meetings: {
      title: "Your meetings",
      subtitle: "Plan, manage, and revisit your team conversations.",
    },
    "AI Insights": {
      title: "AI Insights",
      subtitle: "Your meeting intelligence workspace is taking shape.",
    },
    "Action Center": {
      title: "Action Center",
      subtitle: "Keep track of follow-ups and important outcomes.",
    },
  };

  const page = pageTitles[activeNav] ?? pageTitles.Overview;
  if (authChecking) {
    return (
      <main className="auth-loading" aria-live="polite">
        <div className="auth-loading-mark">
          <Command size={25} />
        </div>
        <p>Loading your MeetOrbit workspace...</p>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={loadAuthenticatedData} />;
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={() => setActiveNav("Overview")}>
          <span className="brand-icon">
            <Command size={23} strokeWidth={2.4} />
          </span>
          <span className="brand-name">
            MeetOrbit<span className="brand-period">.</span>
          </span>
        </a>

        <div className="workspace-picker">
          <div className="workspace-avatar">{workspace?.name?.charAt(0).toUpperCase() ?? "W"}</div>
          <div className="workspace-copy">
            <span className="workspace-label">WORKSPACE</span>
            <strong>{workspace?.name ?? "Workspace"}</strong>
          </div>
          <ChevronDown size={16} />
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${activeNav === label ? "nav-link-active" : ""}`}
              onClick={() => {
                setActiveNav(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Meetings" && (
                <span className="nav-count">{meetings.length}</span>
              )}
            </button>
          ))}
        </nav>

        <p className="nav-heading nav-heading-spaced">PREFERENCES</p>

        <nav className="sidebar-nav">
          <button
            className="nav-link"
            onClick={() => setNotice("Workspace settings will be available soon.")}
          >
            <Settings2 size={19} />
            <span>Settings</span>
          </button>
          <button
            className="nav-link"
            onClick={() => setNotice("Help documentation will be available soon.")}
          >
            <CircleHelp size={19} />
            <span>Help & support</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-card">
            <span className="ai-card-icon">
              <Sparkles size={17} />
            </span>
            <strong>More clarity, less busywork.</strong>
            <p>Turn conversations into knowledge your team can use.</p>
            <button onClick={() => setActiveNav("AI Insights")}>
              Explore AI insights <span>↗</span>
            </button>
          </div>

          <div className="profile">
            <div className="profile-avatar">D</div>
            <div className="profile-copy">
              <strong>{user?.full_name ?? "Workspace member"}</strong>
              <span>{user?.email ?? ""}</span>
            </div>
            <button
              type="button"
              className="row-action-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                aria-label="Search meetings"
                placeholder="Search meetings..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setNotice("You're all caught up.")}
            >
              <Bell size={19} />
              <span />
            </button>
            <div className="topbar-avatar">D</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR MEETING WORKSPACE
              </div>
              <h1>
                {page.title}
                {activeNav === "Overview"
                  ? `, ${user?.full_name.split(" ")[0] ?? ""}`
                  : ""}
              </h1>
              <p>{page.subtitle}</p>
            </div>

            <div className="heading-actions">
              <button className="button-secondary" onClick={() => setNotice("Calendar integration is coming soon.")}>
                <CalendarDays size={17} />
                Calendar
              </button>
              <button className="button-primary" onClick={openCreateModal}>
                <Plus size={18} />
                New meeting
              </button>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <Check size={17} />
              {notice}
              <button aria-label="Dismiss message" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {activeNav === "Overview" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-content">
                  <div className="welcome-label">
                    <Sparkles size={15} /> YOUR SPACE, IN SYNC
                  </div>
                  <h2>Make every conversation count.</h2>
                  <p>
                    Bring your meetings together. Find the details that matter.
                    Turn great conversations into meaningful progress.
                  </p>
                  <button onClick={openCreateModal}>
                    Schedule a meeting <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="orbit-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="orbit-core">
                    <BrainCircuit size={34} />
                  </div>
                  <span className="orbit-node node-one"><Video size={16} /></span>
                  <span className="orbit-node node-two"><Sparkles size={16} /></span>
                  <span className="orbit-node node-three"><ListTodo size={16} /></span>
                </div>
              </section>

              <section className="stats-grid" aria-label="Meeting statistics">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total meetings</span>
                    <span className="stat-icon stat-indigo"><Video size={19} /></span>
                  </div>
                  <div className="stat-value">{meetings.length}</div>
                  <div className="stat-foot">
                    <span className="stat-neutral">All time</span>
                    <span>in this preview</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Upcoming</span>
                    <span className="stat-icon stat-blue"><CalendarDays size={19} /></span>
                  </div>
                  <div className="stat-value">{scheduledCount}</div>
                  <div className="stat-foot">
                    <span className="stat-positive"><ArrowUpRight size={14} /> Scheduled</span>
                    <span>meetings</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Completed</span>
                    <span className="stat-icon stat-green"><Check size={19} /></span>
                  </div>
                  <div className="stat-value">{completedCount}</div>
                  <div className="stat-foot">
                    <span className="stat-positive"><ArrowUpRight size={14} /> Finished</span>
                    <span>meetings</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>In progress</span>
                    <span className="stat-icon stat-orange"><Activity size={19} /></span>
                  </div>
                  <div className="stat-value">{activeCount}</div>
                  <div className="stat-foot">
                    <span className="stat-neutral"><ArrowDownRight size={14} /> Live status</span>
                    <span>placeholder</span>
                  </div>
                </article>
              </section>
            </>
          )}

          {activeNav === "AI Insights" && (
            <section className="feature-panel">
              <div className="feature-icon"><BrainCircuit size={27} /></div>
              <h2>Your meeting intelligence starts here.</h2>
              <p>
                This space will display summaries, decisions, expressed risks,
                and evidence-backed findings after transcription and AI processing
                are connected.
              </p>
              <span className="feature-tag"><Sparkles size={14} /> AI processing not connected yet</span>
            </section>
          )}

          {activeNav === "Action Center" && (
            <section className="feature-panel">
              <div className="feature-icon"><ListTodo size={27} /></div>
              <h2>Your team's next steps, in one place.</h2>
              <p>
                Action items and owners will appear here when the meeting
                intelligence pipeline is implemented.
              </p>
              <span className="feature-tag"><Clock3 size={14} /> Coming in a future milestone</span>
            </section>
          )}

          <section className="meetings-section">
            <div className="section-heading">
              <div>
                <h2>{activeNav === "Overview" ? "Your meetings" : activeNav}</h2>
                <p>
                  {activeNav === "Overview"
                    ? "A quick look at your meeting schedule."
                    : "Search and manage meetings in this preview."}
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => setActiveNav("Meetings")}
              >
                View all <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="meeting-toolbar">
              <div className="meeting-tabs">
                {["All meetings", "Scheduled", "Completed", "Cancelled"].map((item) => (
                  <button
                    key={item}
                    className={filter === item ? "meeting-tab active-tab" : "meeting-tab"}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button className="filter-button" onClick={() => setNotice("Use the status tabs to filter meetings.")}>
                <Filter size={16} /> Filter
              </button>
            </div>

            <div className="meeting-table-wrap">
              <table className="meeting-table">
                <thead>
                  <tr>
                    <th>MEETING</th>
                    <th>DATE & TIME</th>
                    <th>STATUS</th>
                    <th>PEOPLE</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleMeetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td>
                        <div className="meeting-name-cell">
                          <span className="meeting-type-icon">
                            <Video size={18} />
                          </span>
                          <span className="meeting-title-copy">
                            <strong>{meeting.title}</strong>
                            <span>{meeting.description}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <strong>{formatDate(meeting.date)}</strong>
                          <span>{formatTime(meeting.date)} · {meeting.duration}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${getStatusClass(meeting.status)}`}>
                          <span className="status-dot" />
                          {meeting.status}
                        </span>
                      </td>
                      <td>
                        <div className="people-cell">
                          {meeting.attendees > 0 ? (
                            <>
                              <span className="people-avatar">{meeting.attendees}</span>
                              <span>
                                {meeting.attendees} {meeting.attendees === 1 ? "person" : "people"}
                              </span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          {meeting.status === "Scheduled" && (
                            <button
                              className="row-action-button"
                              title="Cancel meeting"
                              aria-label={`Cancel ${meeting.title}`}
                              onClick={() => cancelMeeting(meeting.id)}
                            >
                              <X size={16} />
                            </button>
                          )}
                          <button
                            className="row-action-button"
                            title="Meeting options"
                            aria-label={`Options for ${meeting.title}`}
                            onClick={() => setNotice(`${meeting.title} · ${meeting.id}`)}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleMeetings.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><Search size={22} /></div>
                  <strong>No meetings found</strong>
                  <p>Try another search or change the selected status.</p>
                  <button
                    className="button-secondary"
                    onClick={() => {
                      setSearch("");
                      setFilter("All meetings");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>


            <div className="table-footer">
              <span>
                Showing <strong>{visibleMeetings.length}</strong> of{" "}
                <strong>{meetings.length}</strong> meetings
              </span>
              <span className="demo-indicator">
                <span />
                {dataLoading ? "Syncing..." : "Connected to workspace"}
              </span>
            </div>
          </section>



          <footer className="page-footer">
            <span>© 2026 MeetOrbit</span>
            <span>Meetings, made intelligent.</span>
          </footer>
        </div>
      </main>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >

          <section
            className="meeting-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div className="modal-icon"><CalendarDays size={22} /></div>
              <button
                className="icon-button modal-close"
                aria-label="Close modal"
                onClick={() => setShowModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <h2 id="modal-title">Schedule a meeting</h2>
            <p className="modal-subtitle">
              Set up your next conversation. You can edit the details later.
            </p>

            <form onSubmit={createMeeting}>
              <label className="form-label" htmlFor="meeting-title">Meeting title</label>
              <input
                id="meeting-title"
                className="form-input"
                placeholder="e.g. Product planning"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={240}
                required
              />

              <label className="form-label" htmlFor="meeting-description">
                Description <span>(optional)</span>
              </label>
              <textarea
                id="meeting-description"
                className="form-input form-textarea"
                placeholder="What would you like to discuss?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={3}
              />

              <label className="form-label" htmlFor="meeting-date">Date and time</label>
              <input
                id="meeting-date"
                className="form-input"
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                required
              />

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-note">
                <Sparkles size={16} />
                AI summaries and action items will be available after the AI pipeline is connected.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary">
                  <Plus size={17} /> Create meeting
                </button>
              </div>
            </form>
          </section>
        </div>
      )
      }
    </div >
  );
}

export default App;
