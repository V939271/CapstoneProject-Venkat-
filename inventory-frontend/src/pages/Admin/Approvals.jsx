import { useGetPendingApprovalsQuery, useApproveUserMutation, useRejectUserMutation } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Approvals = () => {
  const { data: pendingUsers = [], isLoading, refetch } = useGetPendingApprovalsQuery();
  const [approveUser] = useApproveUserMutation();
  const [rejectUser] = useRejectUserMutation();

  const handleApprove = async (id, role) => {
    try {
      console.log('Approving user:', { id, role }); // Debug log
      
      // Send the role as a number (1 = Staff, 2 = Manager, 3 = Admin)
      const roleValue = role === 'Staff' ? 1 : role === 'Manager' ? 2 : 3;
      await approveUser({ id, role:roleValue }).unwrap();
      toast.success('User approved successfully');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        await rejectUser(id).unwrap();
        toast.success('User rejected');
        refetch();
      } catch (err) {
        toast.error(err.data?.message || 'Rejection failed');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending User Approvals</h1>

      {pendingUsers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No pending approvals</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user) => (
            <Card key={user.id}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                
                <div className="text-xs text-gray-400">
                  Registered: {new Date(user.createdAt).toLocaleDateString()}
                </div>

                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(user.id, 'Staff')}
                    className="w-full"
                  >
                    Approve as Staff
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleApprove(user.id, 'Manager')}
                    className="w-full"
                  >
                    Approve as Manager
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleReject(user.id)}
                    className="w-full"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
  // return (
  //   <div className="space-y-6">
  //     <h1 className="text-2xl font-bold text-gray-900">Pending User Approvals</h1>

  //     {pendingUsers.length === 0 ? (
  //       <Card>
  //         <div className="text-center py-12">
  //           <p className="text-gray-500">No pending approvals</p>
  //         </div>
  //       </Card>
  //     ) : (
  //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //         {pendingUsers.map((user) => (
  //           <Card key={user.id}>
  //             <div className="space-y-4">
  //               <div>
  //                 <h3 className="text-lg font-medium text-gray-900">
  //                   {user.firstName} {user.lastName}
  //                 </h3>
  //                 <p className="text-sm text-gray-500">@{user.username}</p>
  //                 <p className="text-sm text-gray-500">{user.email}</p>
  //               </div>
                
  //               <div className="text-xs text-gray-400">
  //                 Registered: {new Date(user.createdAt).toLocaleDateString()}
  //               </div>

  //               <div className="space-y-2">
  //                 <div className="flex space-x-2">
  //                   <Button 
  //                     size="sm" 
  //                     onClick={() => handleApprove(user.id, 'Staff')}
  //                     className="flex-1"
  //                   >
  //                     Approve as Staff
  //                   </Button>
  //                 </div>
  //                 <div className="flex space-x-2">
  //                   <Button 
  //                     size="sm" 
  //                     variant="secondary"
  //                     onClick={() => handleApprove(user.id, 'Manager')}
  //                     className="flex-1"
  //                   >
  //                     Approve as Manager
  //                   </Button>
  //                 </div>
  //                 <Button 
  //                   size="sm" 
  //                   variant="danger" 
  //                   onClick={() => handleReject(user.id)}
  //                   className="w-full"
  //                 >
  //                   Reject
  //                 </Button>
  //               </div>
  //             </div>
  //           </Card>
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );
};

export default Approvals;
