import React, { useState, useEffect } from 'react';
import './App.css';

const AdminView = ({ allUsers, refreshData }) => {
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'EMPLOYEE' });
  const [assignment, setAssignment] = useState({ title: 'Annual Review 2026', subjectId: '', reviewerId: '' });

  // 1. Handle Adding Employee (Create)
  const handleAddUser = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3000/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setNewUser({ name: '', email: '', role: 'EMPLOYEE' });
    refreshData();
  };

  // 2. Handle Deleting Employee (Delete)
  const handleDeleteUser = async (id) => {
    if (window.confirm("Delete this employee?")) {
      await fetch(`http://localhost:3000/api/admin/employees/${id}`, { method: 'DELETE' });
      refreshData();
    }
  };

  // 3. Handle Assigning Review
  const handleAssign = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/api/admin/assign-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment)
    });
    if (res.ok) alert("Review Assigned successfully!");
  };

  return (
    <div className="admin-container">
      <h2>Admin Control Panel</h2>

      {/* CREATE SECTION */}
      <section className="card">
        <h3>Add New Employee</h3>
        <form onSubmit={handleAddUser} className="inline-form">
          <input placeholder="Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
          <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
          <button type="submit" className="primary-btn">Add User</button>
        </form>
      </section>

      {/* ASSIGN SECTION */}
      <section className="card">
        <h3>Assign Performance Review</h3>
        <form onSubmit={handleAssign}>
          <select onChange={e => setAssignment({...assignment, subjectId: e.target.value})} required>
            <option value="">Select Employee to be Reviewed</option>
            {allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <select onChange={e => setAssignment({...assignment, reviewerId: e.target.value})} required>
            <option value="">Select Coworker to Give Feedback</option>
            {allUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          <button type="submit" className="primary-btn">Assign Review Task</button>
        </form>
      </section>

      {/* READ & DELETE SECTION */}
      <section className="card">
        <h3>Employee List</h3>
        <div className="user-list">
          {allUsers.map(u => (
            <div key={u._id} className="user-item">
              <span>{u.name} ({u.role})</span>
              <button onClick={() => handleDeleteUser(u._id)} className="delete-btn">Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Main App to toggle between views
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const fetchData = () => {
    fetch('http://localhost:3000/api/admin/employees')
      .then(res => res.json())
      .then(data => setAllUsers(data));
  };

  useEffect(() => fetchData(), []);

  if (!currentUser) {
    return (
      <div className="login-screen">
        <h1>Review Portal</h1>
        <div className="user-grid">
          {allUsers.map(u => (
            <button key={u._id} onClick={() => setCurrentUser(u)}>{u.name} ({u.role})</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <strong>{currentUser.name} ({currentUser.role})</strong>
        <button onClick={() => setCurrentUser(null)}>Logout</button>
      </nav>
      {currentUser.role === 'ADMIN' ? 
        <AdminView allUsers={allUsers} refreshData={fetchData} /> : 
        <EmployeePortal userId={currentUser._id} />
      }
    </div>
  );
}

const EmployeePortal = ({ userId }) => {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    fetch(`http://localhost:3000/api/employee/tasks/${userId}`)
      .then(res => res.json())
      .then(setTasks);
  }, [userId]);

  return (
    <div className="card">
      <h2>Pending Feedback Tasks</h2>
      {tasks.length === 0 ? <p>All caught up!</p> : tasks.map(t => (
        <div key={t._id} className="task-item">
          Review for: <strong>{t.reviewId?.subjectId?.name}</strong>
          <textarea placeholder="Write feedback..." />
          <button className="primary-btn">Submit</button>
        </div>
      ))}
    </div>
  );
};

export default App;