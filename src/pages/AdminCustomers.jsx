import React, { useState, useEffect } from "react";
import axios from "axios";
import { devError } from '../utils/logger';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Use admin routes to fetch data
        const usersRes = await axios.get("/api/admin/users", { withCredentials: true });
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        const ordersRes = await axios.get("/api/admin/orders", { withCredentials: true });
        setOrders(Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []);
      } catch (err) {
        setUsers([]);
        setOrders([]);
        // Debug: show error in UI
        devError("Error fetching data:", err);
        window.alert("Error fetching users or orders: " + (err.response?.data?.message || err.message));
      }
    }
    fetchData();
  }, []);

  // (Optional) fetch reviews/feedbacks from backend if implemented - currently not used

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customer Management</h1>
      <div className="mb-6">
        {users.length === 0 ? (
          <p className="text-gray-500">No registered users found.</p>
        ) : (
          <>
            <div className="text-base font-semibold text-blue-700 mb-2">Total Users: {users.length}</div>

            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-sm text-gray-600">#</th>
                    <th className="px-4 py-3 text-sm text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm text-gray-600">Username</th>
                    <th className="px-4 py-3 text-sm text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    const username = u.username || (u.email ? u.email.split('@')[0] : (u.name || u.profile?.name || ''));
                    return (
                      <tr key={u._id} className="border-t hover:bg-blue-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-800 cursor-pointer" onClick={() => setSelectedUser(u)}>{u.name || u.profile?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{username}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedUser(u)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">View</button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm('Are you sure you want to delete this user? This will remove their account.')) return;
                                try {
                                  const deleteRes = await axios.delete(`/api/admin/users/${u._id}`, { withCredentials: true });
                                  if (deleteRes.data.success) {
                                    const usersRes = await axios.get('/api/admin/users', { withCredentials: true });
                                    setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
                                    if (selectedUser && selectedUser._id === u._id) setSelectedUser(null);
                                    window.alert('User deleted successfully!');
                                  }
                                } catch (err) {
                                  const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
                                  window.alert('Failed to delete user: ' + errorMsg);
                                }
                              }}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {selectedUser && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Profile Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-2">
            <p><strong>Name:</strong> {selectedUser.name || selectedUser.profile?.name || ''}</p>
            <p><strong>Age:</strong> {selectedUser.profile?.age || ''}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Mobile:</strong> {selectedUser.profile?.phone || selectedUser.phone || ''}</p>
            <p><strong>Address:</strong> {selectedUser.profile?.address || ''}</p>
            <p><strong>Gender:</strong> {selectedUser.profile?.gender || ''}</p>
            <p><strong>Password Status:</strong> {selectedUser.password === "clerk" ? "Password not set" : "Password set"}</p>
          </div>
          <h3 className="font-semibold mt-4 mb-2">Order History <span className='text-xs text-blue-600'>(Total: {orders.filter(o => o.user && o.user.email === selectedUser.email).length})</span></h3>
          <ul className="space-y-1 mb-2">
            {orders.filter(o => o.user && o.user.email === selectedUser.email).length === 0 ? (
              <li className="text-gray-500">No orders.</li>
            ) : (
              orders.filter(o => o.user && o.user.email === selectedUser.email).map(o => (
                <li key={o._id} className="text-sm">Order #{o._id} - {o.status}</li>
              ))
            )}
          </ul>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setSelectedUser(null)}>Back</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={async () => {
              if(window.confirm('Are you sure you want to delete this user?')) {
                try {
                  const deleteRes = await axios.delete(`/api/admin/users/${selectedUser._id}`, { withCredentials: true });
                  if (deleteRes.data.success) {
                    // Re-fetch users after delete
                    const usersRes = await axios.get("/api/admin/users", { withCredentials: true });
                    setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
                    setSelectedUser(null);
                    window.alert('User deleted successfully!');
                  }
                } catch (err) {
                  const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
                  window.alert('Failed to delete user: ' + errorMsg);
                }
              }
            }}>Delete User</button>
          </div>
        </div>
      )}
    </div>
  );
}
