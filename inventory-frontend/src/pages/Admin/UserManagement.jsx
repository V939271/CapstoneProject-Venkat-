import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:7273/api/Admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Role change with correct payload format
  const handleRoleChange = async (userId, newRole) => {
    // if (!window.confirm(`Are you sure you want to change the role to ${newRole}?`)) return;

    setRoleUpdatingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      // ✅ Convert role string to integer as expected by API
      const roleMapping = { 'Staff': 1, 'Manager': 2, 'Admin': 3 };
      const roleValue = roleMapping[newRole];

      const response = await fetch(`https://localhost:7273/api/Admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: roleValue }) // ✅ Send as integer
      });

      if (response.ok) {
        // Update local state immediately
        setUsers(users.map(u => u.id === userId ? { ...u, role: roleValue } : u));
        toast.success(`User role updated to ${newRole} successfully!`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Role update error:', error);
      toast.error('Failed to update role');
    } finally {
      setRoleUpdatingUserId(null);
    }
  };

  // const handleDelete = async (userId) => {
  //   if (!window.confirm('Are you sure you want to delete this user?')) return;
    
  //   setDeleteLoading(userId);
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(`https://localhost:7273/api/Admin/users/${userId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.ok) {
  //       setUsers(users.filter(user => user.id !== userId));
  //       toast.success('User deleted successfully');
  //     } else {
  //       toast.error('Failed to delete user');
  //     }
  //   } catch (error) {
  //     toast.error('Failed to delete user');
  //   } finally {
  //     setDeleteLoading(null);
  //   }
  // };

  
  // Update only the handleDelete function in your existing UserManagement.jsx
const handleDelete = async (userId) => {
  // Get user name for confirmation message
  const userToDelete = users.find(u => u.id === userId);
  const userName = userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : 'this user';
  
  if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
    return;
  }

  setDeleteLoading(userId);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found');
      return;
    }

    console.log(`Attempting to delete user with ID: ${userId}`);

    const response = await fetch(`https://localhost:7273/api/Admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Delete response status:', response.status);

    if (response.ok) {
      // Remove user from local state immediately
      setUsers(users.filter(user => user.id !== userId));
      toast.success(`${userName} deleted successfully`);
      
      // Optionally refetch users to ensure data consistency
      // fetchUsers();
    } else {
      let errorMessage = 'Failed to delete user';
      
      try {
        const errorData = await response.json();
        console.error('Delete API Error:', errorData);
        
        if (response.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (response.status === 404) {
          errorMessage = 'User not found or already deleted.';
          // Remove from UI anyway
          setUsers(users.filter(user => user.id !== userId));
        } else {
          errorMessage = errorData.message || `Server error: ${response.status}`;
        }
      } catch (parseError) {
        console.error('Failed to parse delete error response:', parseError);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }

      toast.error(errorMessage);
    }
  } catch (error) {
    console.error('Delete request error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    } else {
      toast.error('Network error: ' + error.message);
    }
  } finally {
    setDeleteLoading(null);
  }
};


  // Helper functions
  const getRoleString = (role) => {
    const roleMap = { 1: 'Staff', 2: 'Manager', 3: 'Admin' };
    return typeof role === 'number' ? roleMap[role] : role;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      0: 'bg-yellow-100 text-yellow-800', // Pending
      1: 'bg-green-100 text-green-800',   // Approved
      2: 'bg-red-100 text-red-800'        // Rejected
    };
    return statusMap[status] || 'bg-green-100 text-green-800';
  };

  const getStatusString = (status) => {
    const statusMap = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
    return typeof status === 'number' ? statusMap[status] : 'Approved';
  };

  const getRoleBadgeColor = (role) => {
    const roleString = getRoleString(role);
    switch (roleString) {
      case 'Admin': return 'bg-red-500 text-white';
      case 'Manager': return 'bg-blue-500 text-white';
      case 'Staff': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="text-sm text-gray-500 mt-1">
            Total Users: {users.length}
          </div>
        </div>
        <Link
          to="/admin/users/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New User
        </Link>
      </div>

      {/* Users List - Matching your image style */}
      {users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No users found. Create your first user!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  {/* Left side - User info */}
                  <div className="flex items-center space-x-4">
                    {/* Avatar - matching your image */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-red-300 flex items-center justify-center text-white font-medium text-sm">
                        {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                      </div>
                    </div>

                    {/* User details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        {/* <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(user.status || 1)}`}>
                          {getStatusString(user.status || 1)}
                        </span> */}
                        <span className={`ml-2 inline-flex px-3 py-0 text-sm font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleString(user.role)}
                      </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {user.username ? `@${user.username} • ` : ''}{user.email}
                      </p>
                      {user.createdAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side - Role and Actions */}
                  <div className="flex items-center space-x-6">
                    {/* Current Role Display */}
                    <div className="text-sm text-gray-600">
                      {/* <span className="text-gray-500">Role:</span>/ */}
                      {/* <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleString(user.role)}
                      </span> */}
                    </div>

                    {/* Role Change Buttons - Exact match to your image */}
                    {(!user.status || user.status === 1) && (
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant={getRoleString(user.role) === 'Staff' ? 'primary' : 'secondary'}
                          onClick={() => handleRoleChange(user.id, 'Staff')}
                          disabled={getRoleString(user.role) === 'Staff' || roleUpdatingUserId === user.id}
                          className="px-3 py-1.5 text-xs font-medium min-w-[60px]"
                        >
                          {roleUpdatingUserId === user.id ? '...' : 'Staff'}
                        </Button>
                        <Button
                          size="sm"
                          variant={getRoleString(user.role) === 'Manager' ? 'primary' : 'secondary'}
                          onClick={() => handleRoleChange(user.id, 'Manager')}
                          disabled={getRoleString(user.role) === 'Manager' || roleUpdatingUserId === user.id}
                          className="px-3 py-1.5 text-xs font-medium min-w-[70px]"
                        >
                          {roleUpdatingUserId === user.id ? '...' : 'Manager'}
                        </Button>
                        <Button
                          size="sm"
                          variant={getRoleString(user.role) === 'Admin' ? 'primary' : 'secondary'}
                          onClick={() => handleRoleChange(user.id, 'Admin')}
                          disabled={getRoleString(user.role) === 'Admin' || roleUpdatingUserId === user.id}
                          className="px-3 py-1.5 text-xs font-medium min-w-[60px]"
                        >
                          {roleUpdatingUserId === user.id ? '...' : 'Admin'}
                        </Button>
                      </div>
                    )}

                    {/* Edit and Delete Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/users/edit/${user.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit User"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteLoading === user.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Delete User"
                      >
                        {deleteLoading === user.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
