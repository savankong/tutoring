import { NavLink } from 'react-router-dom';

function AdminNav() {
  return (
    <div className="admin-subnav">
      <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Users
      </NavLink>
      <NavLink to="/admin/questions" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Public Question Bank
      </NavLink>
      <NavLink to="/admin/submissions" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Submissions
      </NavLink>
    </div>
  );
}

export default AdminNav;
