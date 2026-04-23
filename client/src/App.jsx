import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Request failed.');
  }

  return payload;
}

function formatDate(value) {
  if (!value) return 'Just now';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Just now';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function buildActivityFeed(assignments) {
  return [...assignments]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
    .slice(0, 6);
}

function StatCard({ label, value, note, tone = 'default' }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function Message({ tone, message }) {
  return <div className={`message message-${tone}`}>{message}</div>;
}

function EmptyState({ title, copy }) {
  return (
    <div className="empty-block">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function ActivityList({ items }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        copy="As soon as reviews are created or completed, the latest database activity will show here."
      />
    );
  }

  return (
    <div className="activity-list">
      {items.map((item) => (
        <article className="activity-card" key={item._id}>
          <div className="activity-meta">
            <span className={`status-badge ${item.completed ? 'done' : 'pending'}`}>
              {item.completed ? 'Completed' : 'Pending'}
            </span>
            <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
          </div>
          <strong>{item.reviewId?.title || 'Untitled review'}</strong>
          <p>
            {item.reviewId?.subjectId?.name || 'Employee unavailable'} reviewed by{' '}
            {item.reviewerId?.name || 'Reviewer unavailable'}
          </p>
        </article>
      ))}
    </div>
  );
}

function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews in the database"
        copy="Create a review cycle to start tracking assignments and employee feedback."
      />
    );
  }

  return (
    <div className="review-list-grid">
      {reviews.map((review) => (
        <article className="review-card" key={review._id}>
          <div className="activity-meta">
            <span className="mini-label">Review cycle</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
          <h3>{review.title}</h3>
          <p>{review.subjectId?.name || 'Employee unavailable'}</p>
          <small>{review.subjectId?.email || 'Email unavailable'}</small>
        </article>
      ))}
    </div>
  );
}

function AssignmentBoard({ assignments }) {
  const pendingAssignments = assignments.filter((item) => !item.completed);
  const completedAssignments = assignments.filter((item) => item.completed);

  return (
    <div className="board-grid">
      <section className="board-column board-pending">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Open Work</p>
            <h3>Pending assignments</h3>
          </div>
          <span className="count-chip">{pendingAssignments.length}</span>
        </div>

        {pendingAssignments.length === 0 ? (
          <EmptyState
            title="Nothing pending"
            copy="The database does not currently show any unfinished review requests."
          />
        ) : (
          <div className="stack-list">
            {pendingAssignments.map((item) => (
              <article className="stack-card" key={item._id}>
                <strong>{item.reviewId?.title || 'Untitled review'}</strong>
                <p>Subject: {item.reviewId?.subjectId?.name || 'Employee unavailable'}</p>
                <small>Reviewer: {item.reviewerId?.name || 'Reviewer unavailable'}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="board-column board-done">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Completed Work</p>
            <h3>Submitted feedback</h3>
          </div>
          <span className="count-chip">{completedAssignments.length}</span>
        </div>

        {completedAssignments.length === 0 ? (
          <EmptyState
            title="Nothing completed yet"
            copy="Completed feedback pulled from the database will appear here."
          />
        ) : (
          <div className="stack-list">
            {completedAssignments.map((item) => (
              <article className="stack-card" key={item._id}>
                <strong>{item.reviewId?.title || 'Untitled review'}</strong>
                <p>Subject: {item.reviewId?.subjectId?.name || 'Employee unavailable'}</p>
                <small>Submitted on {formatDate(item.updatedAt)}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserDirectory({ users, busy, onDelete }) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        copy="There are no employee or admin records available in the database."
      />
    );
  }

  return (
    <div className="directory-list">
      {users.map((user) => (
        <article className="directory-card" key={user._id}>
          <div>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
          </div>
          <div className="directory-actions">
            <span className="role-pill">{user.role}</span>
            {user.role !== 'ADMIN' ? (
              <button
                className="ghost-btn danger-btn"
                disabled={busy}
                onClick={() => onDelete(user._id)}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminView({ dashboard, refreshDashboard, setError, onNotify }) {
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE'
  });
  const [reviewForm, setReviewForm] = useState({
    title: '',
    subjectId: '',
    reviewerId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const employees = dashboard.employees;
  const nonAdminUsers = employees.filter((user) => user.role !== 'ADMIN');
  const pendingAssignments = dashboard.assignments.filter((item) => !item.completed);
  const completedAssignments = dashboard.assignments.filter((item) => item.completed);
  const activityFeed = buildActivityFeed(dashboard.assignments);

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchJson('/admin/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm)
      });
      setEmployeeForm({ name: '', email: '', role: 'EMPLOYEE' });
      await refreshDashboard();
      onNotify('Employee added successfully.');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAssign = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchJson('/admin/assign-review', {
        method: 'POST',
        body: JSON.stringify(reviewForm)
      });
      setReviewForm({
        title: '',
        subjectId: '',
        reviewerId: ''
      });
      await refreshDashboard();
      onNotify('Review created and assigned.');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    setSubmitting(true);
    setError('');

    try {
      await fetchJson(`/admin/employees/${employeeId}`, { method: 'DELETE' });
      await refreshDashboard();
      onNotify('Employee removed.');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="workspace-grid">
      <aside className="workspace-sidebar">
        <section className="sidebar-panel feature-panel">
          <p className="eyebrow">Live Database Overview</p>
          <h2>Admin workspace</h2>
          <p className="section-copy">
            This screen is reading real employees, real reviews, and real assignments from MongoDB.
          </p>
        </section>

        <section className="sidebar-panel stat-grid">
          <StatCard label="Employees" value={nonAdminUsers.length} note="Active employee records" />
          <StatCard label="Pending" value={pendingAssignments.length} note="Unfinished requests" tone="warm" />
          <StatCard label="Completed" value={completedAssignments.length} note="Submitted feedback" tone="success" />
          <StatCard label="Reviews" value={dashboard.reviews.length} note="Review cycles created" tone="soft" />
        </section>

        <section className="sidebar-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest Activity</p>
              <h3>From the database</h3>
            </div>
          </div>
          <ActivityList items={activityFeed} />
        </section>
      </aside>

      <div className="workspace-main">
        <section className="canvas-panel form-panel-grid">
          <article className="form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Add Employee</p>
                <h3>Create a person record</h3>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleCreateEmployee}>
              <label>
                Full name
                <input
                  required
                  value={employeeForm.name}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })}
                  placeholder="Employee name"
                />
              </label>

              <label>
                Email
                <input
                  required
                  type="email"
                  value={employeeForm.email}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })}
                  placeholder="employee@company.com"
                />
              </label>

              <label>
                Role
                <select
                  value={employeeForm.role}
                  onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>

              <button className="primary-btn" disabled={submitting} type="submit">
                Save employee
              </button>
            </form>
          </article>

          <article className="form-card accent-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Launch Review</p>
                <h3>Create and assign from real users</h3>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleCreateAndAssign}>
              <label>
                Review title
                <input
                  required
                  value={reviewForm.title}
                  onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })}
                  placeholder="Quarterly review, probation review, leadership review..."
                />
              </label>

              <label>
                Subject
                <select
                  required
                  value={reviewForm.subjectId}
                  onChange={(event) => setReviewForm({ ...reviewForm, subjectId: event.target.value })}
                >
                  <option value="">Select employee</option>
                  {nonAdminUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Reviewer
                <select
                  required
                  value={reviewForm.reviewerId}
                  onChange={(event) => setReviewForm({ ...reviewForm, reviewerId: event.target.value })}
                >
                  <option value="">Select reviewer</option>
                  {nonAdminUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="primary-btn" disabled={submitting} type="submit">
                Create assignment
              </button>
            </form>
          </article>
        </section>

        <section className="canvas-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Team Records</p>
              <h3>User directory</h3>
            </div>
          </div>
          <UserDirectory users={employees} busy={submitting} onDelete={handleDeleteEmployee} />
        </section>

        <section className="canvas-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Assignment Flow</p>
              <h3>Review pipeline</h3>
            </div>
          </div>
          <AssignmentBoard assignments={dashboard.assignments} />
        </section>

        <section className="canvas-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Review Archive</p>
              <h3>All review cycles</h3>
            </div>
          </div>
          <ReviewList reviews={dashboard.reviews} />
        </section>
      </div>
    </div>
  );
}

function EmployeeView({ currentUser, setError, onNotify }) {
  const [summary, setSummary] = useState({
    assignedReviews: [],
    feedbackAboutMe: []
  });
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function initializeSummary() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchJson(`/employee/summary/${currentUser._id}`);
        if (!cancelled) {
          setSummary(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeSummary();

    return () => {
      cancelled = true;
    };
  }, [currentUser._id, setError]);

  const pending = summary.assignedReviews.filter((item) => !item.completed);
  const completed = summary.assignedReviews.filter((item) => item.completed);
  const completionRate = summary.assignedReviews.length
    ? Math.round((completed.length / summary.assignedReviews.length) * 100)
    : 0;

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchJson(`/employee/summary/${currentUser._id}`);
      setSummary(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskId) => {
    setSavingId(taskId);
    setError('');

    try {
      await fetchJson(`/employee/feedback/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: drafts[taskId] || '' })
      });
      setDrafts((current) => ({ ...current, [taskId]: '' }));
      await handleRefresh();
      onNotify('Feedback submitted successfully.');
    } catch (error) {
      setError(error.message);
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="workspace-grid">
      <aside className="workspace-sidebar">
        <section className="sidebar-panel feature-panel">
          <p className="eyebrow">Your Live Queue</p>
          <h2>Employee review desk</h2>
          <p className="section-copy">
            Every task and progress number here is loaded from your real feedback requests in the database.
          </p>
          <button className="ghost-btn" onClick={handleRefresh} type="button">
            Refresh my data
          </button>
        </section>

        <section className="sidebar-panel stat-grid">
          <StatCard label="Pending" value={pending.length} note="Tasks waiting for feedback" tone="warm" />
          <StatCard label="Submitted" value={completed.length} note="Feedback already sent" tone="success" />
          <StatCard label="About you" value={summary.feedbackAboutMe.length} note="Review requests opened" tone="soft" />
          <StatCard label="Progress" value={`${completionRate}%`} note="Completion rate" />
        </section>

        <section className="sidebar-panel progress-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Completion</p>
              <h3>Review progress</h3>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
          <p className="section-copy">
            {completed.length} of {summary.assignedReviews.length} assigned reviews completed.
          </p>
        </section>
      </aside>

      <div className="workspace-main">
        <section className="canvas-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pending Feedback</p>
              <h3>Open assignments</h3>
            </div>
          </div>

          {loading ? <p className="section-copy">Loading your assignments from the database...</p> : null}

          {!loading && pending.length === 0 ? (
            <EmptyState
              title="No pending tasks"
              copy="You do not have any unfinished feedback requests right now."
            />
          ) : (
            <div className="feedback-grid">
              {pending.map((task) => (
                <article className="feedback-card" key={task._id}>
                  <div className="activity-meta">
                    <span className="status-badge pending">Pending</span>
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                  <h3>{task.reviewId?.title || 'Untitled review'}</h3>
                  <p>{task.reviewId?.subjectId?.name || 'Employee unavailable'}</p>
                  <small>{task.reviewId?.subjectId?.email || 'Email unavailable'}</small>
                  <textarea
                    placeholder="Write actionable, specific feedback..."
                    value={drafts[task._id] || ''}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [task._id]: event.target.value }))
                    }
                  />
                  <button
                    className="primary-btn"
                    disabled={savingId === task._id}
                    onClick={() => handleSubmit(task._id)}
                    type="button"
                  >
                    Submit feedback
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="canvas-panel split-panel">
          <div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Submitted</p>
                <h3>Your completed reviews</h3>
              </div>
            </div>

            {completed.length === 0 ? (
              <EmptyState
                title="No completed feedback yet"
                copy="Finished reviews will appear here after you submit them."
              />
            ) : (
              <div className="stack-list">
                {completed.map((task) => (
                  <article className="stack-card" key={task._id}>
                    <strong>{task.reviewId?.title || 'Untitled review'}</strong>
                    <p>{task.reviewId?.subjectId?.name || 'Employee unavailable'}</p>
                    <small>Submitted on {formatDate(task.updatedAt)}</small>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Incoming</p>
                <h3>Reviews opened about you</h3>
              </div>
            </div>

            {summary.feedbackAboutMe.length === 0 ? (
              <EmptyState
                title="No feedback requests about you"
                copy="The database does not show any review cycles targeting you right now."
              />
            ) : (
              <div className="stack-list">
                {summary.feedbackAboutMe.map((item) => (
                  <article className="stack-card" key={item._id}>
                    <strong>{item.reviewId?.title || 'Untitled review'}</strong>
                    <p>{item.reviewerId?.name || 'Reviewer unavailable'}</p>
                    <small>{item.completed ? 'Feedback submitted' : 'Waiting for reviewer'}</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function LoginScreen({ dashboard, error, onSelectUser }) {
  const employeeCount = dashboard.employees.filter((user) => user.role === 'EMPLOYEE').length;
  const adminCount = dashboard.employees.filter((user) => user.role === 'ADMIN').length;
  const latestReview = dashboard.reviews[0];
  const latestAssignment = buildActivityFeed(dashboard.assignments)[0];

  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Connected Workspace</p>
          <h1>Performance reviews driven by live database records.</h1>
          <p className="section-copy">
            No dummy cards, no static tables. The people, reviews, assignments, and status blocks on
            this page all come from your MongoDB collections.
          </p>
        </div>

        <div className="landing-stats">
          <StatCard label="Employees" value={employeeCount} note="Database employee records" />
          <StatCard label="Admins" value={adminCount} note="Admin records" tone="soft" />
          <StatCard label="Reviews" value={dashboard.reviews.length} note="Review cycles saved" tone="warm" />
          <StatCard
            label="Assignments"
            value={dashboard.assignments.length}
            note="Feedback requests in database"
            tone="success"
          />
        </div>
      </section>

      <section className="landing-grid">
        <article className="landing-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest Review</p>
              <h3>{latestReview ? latestReview.title : 'No reviews yet'}</h3>
            </div>
          </div>
          <p className="section-copy">
            {latestReview
              ? `${latestReview.subjectId?.name || 'Employee unavailable'} added on ${formatDate(latestReview.createdAt)}.`
              : 'Create your first review cycle to populate this area from the database.'}
          </p>
        </article>

        <article className="landing-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest Assignment</p>
              <h3>{latestAssignment ? latestAssignment.reviewId?.title : 'No assignments yet'}</h3>
            </div>
          </div>
          <p className="section-copy">
            {latestAssignment
              ? `${latestAssignment.reviewerId?.name || 'Reviewer unavailable'} is ${latestAssignment.completed ? 'done' : 'currently assigned'}.`
              : 'Assignments created in the database will show up here automatically.'}
          </p>
        </article>
      </section>

      <section className="landing-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Users</p>
            <h3>Select a database user</h3>
          </div>
        </div>

        {error ? <Message tone="error" message={error} /> : null}

        {dashboard.employees.length === 0 ? (
          <EmptyState
            title="No users in database"
            copy="Seed or create users first, then they will appear here for login selection."
          />
        ) : (
          <div className="login-grid">
            {dashboard.employees.map((user) => (
              <button className="login-card" key={user._id} onClick={() => onSelectUser(user)} type="button">
                <span className="role-pill">{user.role}</span>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboard, setDashboard] = useState({
    employees: [],
    reviews: [],
    assignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchJson('/admin/dashboard');
      setDashboard(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchJson('/admin/dashboard');
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeUser = useMemo(() => {
    if (!currentUser) return null;
    return dashboard.employees.find((user) => user._id === currentUser._id) || currentUser;
  }, [currentUser, dashboard.employees]);

  const announce = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };

  if (loading && dashboard.employees.length === 0) {
    return (
      <div className="loading-screen">
        <div className="loading-panel">
          <p className="eyebrow">Loading</p>
          <h1>Connecting to your review database...</h1>
          <p className="section-copy">Fetching employees, reviews, and assignments.</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return <LoginScreen dashboard={dashboard} error={error} onSelectUser={setCurrentUser} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Logged In</p>
          <h1>{activeUser.name}</h1>
          <p className="section-copy">
            {activeUser.role === 'ADMIN'
              ? 'Manage employees, create review cycles, and monitor database activity.'
              : 'Work through live feedback requests and track your review progress.'}
          </p>
        </div>

        <div className="header-actions">
          <span className="role-pill">{activeUser.role}</span>
          <button className="ghost-btn" onClick={loadDashboard} type="button">
            Refresh
          </button>
          <button className="secondary-btn" onClick={() => setCurrentUser(null)} type="button">
            Switch user
          </button>
        </div>
      </header>

      {notice ? <Message tone="success" message={notice} /> : null}
      {error ? <Message tone="error" message={error} /> : null}

      {activeUser.role === 'ADMIN' ? (
        <AdminView
          dashboard={dashboard}
          refreshDashboard={loadDashboard}
          setError={setError}
          onNotify={announce}
        />
      ) : (
        <EmployeeView currentUser={activeUser} setError={setError} onNotify={announce} />
      )}
    </div>
  );
}

export default App;
