// import React, { useState } from 'react';
// import { BellIcon } from '@heroicons/react/24/outline';
// import { useGetLowStockProductsQuery } from '../services/api';
// import { useSelector } from 'react-redux';
// import { selectCurrentUser } from '../store/authSlice';

// const LowStockNotification = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const user = useSelector(selectCurrentUser);
  
//   // Fetch low stock products (only for non-staff users)
//   const { data: lowStockProducts = [], isLoading } = useGetLowStockProductsQuery(undefined, {
//     skip: user?.role === 'Staff'
//   });

//   const handleToggle = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleClose = () => {
//     setIsOpen(false);
//   };

//   // Don't show notification for Staff users
//   if (user?.role === 'Staff') {
//     return null;
//   }

//   return (
//     <div className="relative">
//       {/* Bell Icon with Notification Badge */}
//       <button
//         onClick={handleToggle}
//         className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150"
//         aria-label="Low Stock Notifications"
//       >
//         <BellIcon className="h-6 w-6" />
        
//         {/* Red dot badge if there are low stock items */}
//         {lowStockProducts.length > 0 && (
//           <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white">
//             <span className="sr-only">{lowStockProducts.length} low stock items</span>
//           </span>
//         )}
        
//         {/* Optional: Number badge instead of dot */}
//         {lowStockProducts.length > 0 && (
//           <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
//             {lowStockProducts.length > 9 ? '9+' : lowStockProducts.length}
//           </span>
//         )}
//       </button>

//       {/* Popup Modal */}
//       {isOpen && (
//         <>
//           {/* Backdrop overlay */}
//           <div 
//             className="fixed inset-0 z-40" 
//             onClick={handleClose}
//           ></div>
          
//           {/* Popup content */}
//           <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
//             {/* Header */}
//             <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Low Stock Alert
//               </h3>
//               <button
//                 onClick={handleClose}
//                 className="text-gray-400 hover:text-gray-600 text-xl font-bold"
//                 aria-label="Close notification"
//               >
//                 ×
//               </button>
//             </div>

//             {/* Content */}
//             <div className="max-h-64 overflow-y-auto">
//               {isLoading ? (
//                 <div className="p-4 text-center">
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
//                   <p className="mt-2 text-sm text-gray-500">Loading...</p>
//                 </div>
//               ) : lowStockProducts.length === 0 ? (
//                 <div className="p-6 text-center">
//                   <div className="text-4xl mb-2">🎉</div>
//                   <p className="text-gray-600">All products are well stocked!</p>
//                 </div>
//               ) : (
//                 <ul className="divide-y divide-gray-100">
//                   {lowStockProducts.map((product) => (
//                     <li key={product.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
//                       <div className="flex items-center justify-between">
//                         <div className="flex-1">
//                           <h4 className="text-sm font-medium text-gray-900">
//                             {product.name}
//                           </h4>
//                           <p className="text-xs text-gray-500 mt-1">
//                             SKU: {product.sku}
//                           </p>
//                         </div>
//                         <div className="flex flex-col items-end">
//                           <span className="text-sm font-semibold text-red-600">
//                             Only {product.quantity} left
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             Threshold: {product.lowStockThreshold}
//                           </span>
//                         </div>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>

//             {/* Footer */}
//             {lowStockProducts.length > 0 && (
//               <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
//                 <p className="text-xs text-gray-600 text-center">
//                   {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need restocking
//                 </p>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default LowStockNotification;
// import React, { useState, useEffect, useRef } from 'react';
// import { BellIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
// import { useGetLowStockProductsQuery, useGetAllUsersQuery } from '../services/api';
// import { useSelector } from 'react-redux';
// import { selectCurrentUser } from '../store/authSlice';

// const NotificationBell = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const user = useSelector(selectCurrentUser);
//   const dropdownRef = useRef(null);
  
//   // Fetch low stock products (only for non-staff users)
//   const { data: lowStockProducts = [], isLoading: loadingStock } = useGetLowStockProductsQuery(undefined, {
//     skip: user?.role === 'Staff'
//   });

//   // Fetch all users to get pending count (only for Admin users)
//   const { data: allUsers = [], isLoading: loadingUsers } = useGetAllUsersQuery(undefined, {
//     skip: user?.role !== 'Admin'
//   });

//   // Calculate notification counts
//   const lowStockCount = lowStockProducts.length;
//   const pendingUsersCount = user?.role === 'Admin' 
//     ? allUsers.filter(u => u.status === 0).length 
//     : 0;
//   const totalNotifications = lowStockCount + pendingUsersCount;
//   const pendingUsers = allUsers.filter(u => u.status === 0);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleToggle = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleClose = () => {
//     setIsOpen(false);
//   };

//   // Don't show notification for Staff users
//   if (user?.role === 'Staff') {
//     return null;
//   }

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {/* Bell Icon with Combined Notification Badge */}
//       <button
//         onClick={handleToggle}
//         className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150"
//         aria-label="Notifications"
//       >
//         <BellIcon className="h-6 w-6" />
        
//         {/* Combined notification badge */}
//         {totalNotifications > 0 && (
//           <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
//             {totalNotifications > 99 ? '99+' : totalNotifications}
//           </span>
//         )}
//       </button>

//       {/* Enhanced Popup Modal */}
//       {isOpen && (
//         <>
//           {/* Backdrop overlay */}
//           <div 
//             className="fixed inset-0 z-40" 
//             onClick={handleClose}
//           ></div>
          
//           {/* Popup content */}
//           <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
//             {/* Header */}
//             <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Notifications ({totalNotifications})
//               </h3>
//               <button
//                 onClick={handleClose}
//                 className="text-gray-400 hover:text-gray-600 text-xl font-bold"
//                 aria-label="Close notification"
//               >
//                 ×
//               </button>
//             </div>

//             {/* Content */}
//             <div className="max-h-96 overflow-y-auto">
//               {(loadingStock || loadingUsers) ? (
//                 <div className="p-4 text-center">
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
//                   <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
//                 </div>
//               ) : (
//                 <div className="space-y-1">
//                   {/* Pending Users Section */}
//                   {user?.role === 'Admin' && pendingUsersCount > 0 && (
//                     <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
//                       <div className="flex items-start space-x-3">
//                         <div className="flex-shrink-0">
//                           <UserIcon className="h-5 w-5 text-blue-600 mt-0.5" />
//                         </div>
//                         <div className="flex-1">
//                           <h4 className="text-sm font-medium text-blue-800">
//                             Pending User Approvals
//                           </h4>
//                           <p className="text-sm text-blue-700 mt-1">
//                             {pendingUsersCount} user{pendingUsersCount !== 1 ? 's' : ''} waiting for approval
//                           </p>
//                           <div className="mt-2 space-y-1">
//                             {pendingUsers.slice(0, 3).map((pendingUser) => (
//                               <div key={pendingUser.id} className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
//                                 <div className="font-medium">{pendingUser.firstName} {pendingUser.lastName}</div>
//                                 <div className="opacity-75">{pendingUser.email}</div>
//                               </div>
//                             ))}
//                             {pendingUsersCount > 3 && (
//                               <div className="text-xs text-blue-600 italic">
//                                 ... and {pendingUsersCount - 3} more user{pendingUsersCount - 3 !== 1 ? 's' : ''}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Low Stock Section */}
//                   {lowStockCount > 0 && (
//                     <div className="p-4 border-l-4 border-red-500 bg-red-50">
//                       <div className="flex items-start space-x-3">
//                         <div className="flex-shrink-0">
//                           <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
//                         </div>
//                         <div className="flex-1">
//                           <h4 className="text-sm font-medium text-red-800">
//                             Low Stock Alert
//                           </h4>
//                           <p className="text-sm text-red-700 mt-1">
//                             {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low on stock
//                           </p>
//                           <div className="mt-2 space-y-1">
//                             {lowStockProducts.slice(0, 3).map((product) => (
//                               <div key={product.id} className="text-xs text-red-600 bg-red-100 rounded px-2 py-1">
//                                 <div className="flex justify-between">
//                                   <span className="font-medium truncate">{product.name}</span>
//                                   <span className="ml-2 font-semibold">
//                                     Only {product.quantity} left
//                                   </span>
//                                 </div>
//                                 <div className="opacity-75">SKU: {product.sku}</div>
//                               </div>
//                             ))}
//                             {lowStockCount > 3 && (
//                               <div className="text-xs text-red-600 italic">
//                                 ... and {lowStockCount - 3} more product{lowStockCount - 3 !== 1 ? 's' : ''}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* No Notifications */}
//                   {totalNotifications === 0 && (
//                     <div className="p-6 text-center">
//                       <div className="text-4xl mb-2">🔔</div>
//                       <p className="text-gray-600">All caught up!</p>
//                       <p className="text-sm text-gray-500 mt-1">No new notifications</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Footer with Action Buttons */}
//             {totalNotifications > 0 && (
//               <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
//                 <div className="flex space-x-2">
//                   {pendingUsersCount > 0 && user?.role === 'Admin' && (
//                     <button className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors">
//                       Manage Users
//                     </button>
//                   )}
//                   {lowStockCount > 0 && (
//                     <button className="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
//                       View Products
//                     </button>
//                   )}
//                 </div>
//                 <p className="text-xs text-gray-500 text-center mt-2">
//                   {totalNotifications} total notification{totalNotifications !== 1 ? 's' : ''}
//                 </p>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default NotificationBell;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { useGetLowStockProductsQuery, useGetAllUsersQuery } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';

const LowStockNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  // Fetch low stock products (only for non-staff users)
  const { data: lowStockProducts = [], isLoading: loadingStock } = useGetLowStockProductsQuery(undefined, {
    skip: user?.role === 'Staff'
  });

  // Fetch all users to get pending count (only for Admin users)
  const { data: allUsers = [], isLoading: loadingUsers } = useGetAllUsersQuery(undefined, {
    skip: user?.role !== 'Admin'
  });

  // Calculate notification counts
  const lowStockCount = lowStockProducts.length;
  const pendingUsersCount = user?.role === 'Admin' 
    ? allUsers.filter(u => u.status === 0).length 
    : 0;
  const totalNotifications = lowStockCount + pendingUsersCount;
  const pendingUsers = allUsers.filter(u => u.status === 0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Navigation handlers
  const handleNavigateToUsers = () => {
    navigate('/admin/users');
    setIsOpen(false);
  };

  const handleNavigateToProducts = () => {
    navigate('/products');
    setIsOpen(false);
  };

  // Don't show notification for Staff users
  if (user?.role === 'Staff') {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Combined Notification Badge */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-150"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Combined notification badge */}
        {totalNotifications > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleClose}
          ></div>
          
          {/* Popup content */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications ({totalNotifications})
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                aria-label="Close notification"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {(loadingStock || loadingUsers) ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading...</p>
                </div>
              ) : (
                <div>
                  {/* Pending Users Section */}
                  {user?.role === 'Admin' && pendingUsersCount > 0 && (
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors duration-150">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">
                              Pending User Approvals
                            </h4>
                            <p className="text-sm text-blue-700">
                              {pendingUsersCount} user{pendingUsersCount !== 1 ? 's' : ''} waiting for approval
                            </p>
                            {/* Show first 3 pending users */}
                            {pendingUsers.slice(0, 3).map((pendingUser) => (
                              <div key={pendingUser.id} className="text-xs text-blue-600 mt-1">
                                • {pendingUser.firstName} {pendingUser.lastName} ({pendingUser.email})
                              </div>
                            ))}
                            {pendingUsersCount > 3 && (
                              <div className="text-xs text-blue-600 mt-1 italic">
                                ... and {pendingUsersCount - 3} more user{pendingUsersCount - 3 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Low Stock Section */}
                  {lowStockCount > 0 && (
                    <div className="p-4 border-l-4 border-red-500 bg-red-50 hover:bg-red-100 transition-colors duration-150">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800">
                              Low Stock Alert
                            </h4>
                            <p className="text-sm text-red-700">
                              {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} running low on stock
                            </p>
                            {/* Show first 3 low stock products */}
                            {lowStockProducts.slice(0, 3).map((product) => (
                              <div key={product.id} className="text-xs text-red-600 mt-1">
                                • {product.name} - Only {product.quantity} left (SKU: {product.sku})
                              </div>
                            ))}
                            {lowStockCount > 3 && (
                              <div className="text-xs text-red-600 mt-1 italic">
                                ... and {lowStockCount - 3} more product{lowStockCount - 3 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Notifications */}
                  {totalNotifications === 0 && (
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-gray-600">All caught up!</p>
                      <p className="text-sm text-gray-500 mt-1">No new notifications</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Action Buttons */}
            {totalNotifications > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex space-x-2">
                  {pendingUsersCount > 0 && user?.role === 'Admin' && (
                    <button 
                      onClick={handleNavigateToUsers}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Manage Users
                    </button>
                  )}
                  {lowStockCount > 0 && (
                    <button 
                      onClick={handleNavigateToProducts}
                      className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                      View Products
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 text-center mt-2">
                  {totalNotifications} product{totalNotifications !== 1 ? 's' : ''} need attention
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LowStockNotification;
