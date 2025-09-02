// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import toast from 'react-hot-toast';

// const UserForm = () => {
//   const { id } = useParams();
//   const isAddMode = !id;
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     role: 'Staff',
//     password: '',
//     confirmPassword: ''
//   });
//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     if (!isAddMode) {
//       fetchUser();
//     }
//   }, [id, isAddMode]);

//   const fetchUser = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`https://localhost:7273/api/Admin/users/${id}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const user = await response.json();
//         setFormData({
//           firstName: user.firstName || '',
//           lastName: user.lastName || '',
//           email: user.email || '',
//           role: user.role || 'Staff',
//           password: '',
//           confirmPassword: ''
//         });
//       }
//     } catch (error) {
//       toast.error('Failed to load user data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: ''
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
//     if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
//     if (!formData.email.trim()) newErrors.email = 'Email is required';
//     if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
//     if (!formData.role) newErrors.role = 'Role is required';

//     if (isAddMode || formData.password) {
//       if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
//       if (formData.password !== formData.confirmPassword) {
//         newErrors.confirmPassword = 'Passwords must match';
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const url = isAddMode 
//         ? 'https://localhost:7273/api/Admin/users'
//         : `https://localhost:7273/api/Admin/users/${id}`;
      
//       const method = isAddMode ? 'POST' : 'PUT';
      
//       const requestData = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.email,
//         role: formData.role
//       };

//       if (isAddMode || formData.password) {
//         requestData.password = formData.password;
//       }

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(requestData)
//       });

//       if (response.ok) {
//         toast.success(isAddMode ? 'User created successfully' : 'User updated successfully');
//         navigate('/admin/users');
//       } else {
//         const errorData = await response.json();
//         toast.error(errorData.message || 'Failed to save user');
//       }
//     } catch (error) {
//       toast.error('Failed to save user');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading && !isAddMode) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         <span className="ml-2">Loading user data...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">
//         {isAddMode ? 'Create User' : 'Update User'}
//       </h2>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             First Name *
//           </label>
//           <input
//             type="text"
//             name="firstName"
//             value={formData.firstName}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.firstName ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Enter first name"
//           />
//           {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Last Name *
//           </label>
//           <input
//             type="text"
//             name="lastName"
//             value={formData.lastName}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.lastName ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Enter last name"
//           />
//           {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Email *
//           </label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.email ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Enter email address"
//           />
//           {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Role *
//           </label>
//           <select
//             name="role"
//             value={formData.role}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.role ? 'border-red-500' : 'border-gray-300'
//             }`}
//           >
//             <option value="Staff">Staff</option>
//             <option value="Manager">Manager</option>
//             <option value="Admin">Admin</option>
//           </select>
//           {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
//         </div>

//         {!isAddMode && (
//           <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
//             <p className="text-sm text-yellow-800">
//               Leave password fields blank to keep the current password
//             </p>
//           </div>
//         )}

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Password {isAddMode && '*'}
//           </label>
//           <input
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.password ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Enter password"
//           />
//           {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Confirm Password {isAddMode && '*'}
//           </label>
//           <input
//             type="password"
//             name="confirmPassword"
//             value={formData.confirmPassword}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
//             }`}
//             placeholder="Confirm password"
//           />
//           {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
//         </div>

//         <div className="flex space-x-3 pt-4">
//           <button
//             type="button"
//             onClick={() => navigate('/admin/users')}
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//           >
//             {loading ? 'Saving...' : isAddMode ? 'Create User' : 'Update User'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default UserForm;



import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from './ui/Button';

const UserForm = () => {
  const { id } = useParams();
  const isAddMode = !id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 1, // Use numeric role (1 = Staff)
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAddMode) {
      fetchUser();
    }
  }, [id, isAddMode]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        navigate('/login');
        return;
      }

      const response = await fetch(`https://localhost:7273/api/Admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        
        // Convert role string to number if needed
        let userRole = user.role;
        if (typeof user.role === 'string') {
          const roleMap = { 'Staff': 1, 'Manager': 2, 'Admin': 3 };
          userRole = roleMap[user.role] || 1;
        }

        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          role: userRole,
          password: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch user error:', response.status, errorData);
        toast.error(errorData.message || `Failed to load user: ${response.status}`);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      toast.error('Network error: Unable to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert role to number
    const processedValue = name === 'role' ? parseInt(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role || (formData.role < 1 || formData.role > 3)) {
      newErrors.role = 'Role is required';
    }

    // Password validation (required for new users)
    if (isAddMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords must match';
      }
    } else if (formData.password || formData.confirmPassword) {
      // If editing and password is provided
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords must match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        navigate('/login');
        return;
      }

      // Prepare request data
      const requestData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: parseInt(formData.role) // Ensure role is a number
      };

      // Only include password if it's provided
      if (isAddMode) {
        requestData.password = formData.password;
      } else if (formData.password.trim()) {
        requestData.password = formData.password;
      }

      console.log('Submitting user data:', { 
        ...requestData, 
        password: requestData.password ? '[PROVIDED]' : '[NOT PROVIDED]' 
      });

      const url = isAddMode 
        ? 'https://localhost:7273/api/Admin/users' 
        : `https://localhost:7273/api/Admin/users/${id}`;
      
      const method = isAddMode ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        toast.success(isAddMode ? 'User created successfully!' : 'User updated successfully!');
        navigate('/admin/users');
      } else {
        // Handle different error status codes
        let errorMessage = 'Failed to save user';
        
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          
          if (response.status === 400) {
            errorMessage = errorData.message || 'Invalid data provided';
          } else if (response.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
            navigate('/login');
          } else if (response.status === 403) {
            errorMessage = 'Access denied. Admin privileges required.';
          } else if (response.status === 409) {
            errorMessage = 'Email already exists. Please use a different email.';
          } else if (response.status === 422) {
            errorMessage = 'Invalid data format';
          } else {
            errorMessage = errorData.message || `Server error: ${response.status}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Network/Request Error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Cannot connect to server. Please check if the backend is running.');
      } else if (error.message.includes('ERR_CERT_AUTHORITY_INVALID')) {
        toast.error('SSL certificate error. Please check your HTTPS configuration.');
      } else {
        toast.error('Network error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get role display name
  const getRoleDisplayName = (roleValue) => {
    const roleNames = { 1: 'Staff', 2: 'Manager', 3: 'Admin' };
    return roleNames[roleValue] || 'Staff';
  };

  if (loading && !isAddMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isAddMode ? 'Create User' : 'Edit User'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
            disabled={loading}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
            disabled={loading}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.role ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value={1}>Staff</option>
            <option value={2}>Manager</option>
            <option value={3}>Admin</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">{errors.role}</p>
          )}
        </div>

        {!isAddMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              💡 Leave password fields blank to keep the current password
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password {isAddMode && '*'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={isAddMode ? "Enter password" : "Enter new password (optional)"}
            disabled={loading}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password {isAddMode && '*'}
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm password"
            disabled={loading}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/users')}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              isAddMode ? 'Create User' : 'Update User'
            )}
          </Button>
        </div>
      </form>

      {/* Debug Information (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong><br/>
          Mode: {isAddMode ? 'Add' : 'Edit'}<br/>
          Role: {formData.role} ({getRoleDisplayName(formData.role)})<br/>
          API URL: {isAddMode ? 'POST /api/Admin/users' : `PUT /api/Admin/users/${id}`}
        </div>
      )}
    </div>
  );
};

export default UserForm;

