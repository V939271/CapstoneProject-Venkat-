// import { useSelector } from 'react-redux';
// import { Navigate, useLocation } from 'react-router-dom';
// import { selectCurrentUser, selectIsAuthenticated } from '../store/authSlice';

// const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const user = useSelector(selectCurrentUser);
//   const location = useLocation();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
//   //   return <Navigate to="/unauthorized" replace />;
//   // }
// if (allowedRoles.length > 0 && user) {
//     // Create a mapping for numeric roles
//     const roleMapping = {
//       1: 'Staff',
//       2: 'Manager', 
//       3: 'Admin'
//     };
    
//     const userRoleString = typeof user.role === 'number' 
//       ? roleMapping[user.role] 
//       : user.role;
    
//     if (!allowedRoles.includes(userRoleString)) {
//       return <Navigate to="/unauthorized" replace />;
//     }
//   }
//   return children;
// };

// export default ProtectedRoute;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../store/authSlice';

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified but user doesn't have required role
  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      const redirectPath = getDashboardPath(user.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

// Helper function to get appropriate dashboard path based on role
const getDashboardPath = (userRole) => {
  switch (userRole) {
    case 'Admin':
      return '/dashboard';
    case 'Manager':
      return '/dashboard';
    case 'Staff':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

export default ProtectedRoute;
