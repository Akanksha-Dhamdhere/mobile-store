import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Admin Panel</h2>
      </div>
      <nav className="nav-menu">
        <li className="nav-item">
          <NavLink to="/admin/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/existing-products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Existing Products</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/add-product" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Add Product</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Orders</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/bills" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Bills</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/customers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Customers</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/admin/feedback" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Feedback</NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>User Home</NavLink>
        </li>
        <li className="nav-item">
          <button onClick={handleLogout} className="nav-link" style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit'}}>Logout</button>
        </li>
      </nav>
    </aside>
  );
}
