import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetProductsQuery, 
  useCreateProductMutation, 
  useUpdateProductMutation, 
  useDeleteProductMutation 
} from '../services/api';
import { selectCurrentUser } from '../store/authSlice';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import QRCodeGenerator from '../components/QRCodeGenerator';
import ImageUpload from '../components/ImageUpload';
import { getProductImage, getStockStatus } from '../utils/productImages';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentListIcon,
  QrCodeIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Products = () => {
  const user = useSelector(selectCurrentUser);
  const { data: products = [], isLoading, refetch } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // QR Code Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState(null);

  // Movement Modal States
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovements, setSelectedProductForMovements] = useState(null);
  const [productMovements, setProductMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementsError, setMovementsError] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch movements when modal opens
  useEffect(() => {
    if (isMovementModalOpen && selectedProductForMovements) {
      setLoadingMovements(true);
      setMovementsError(null);
      
      const fetchMovements = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`https://localhost:7273/api/Staff/movements/product/${selectedProductForMovements.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const movements = await response.json();
          setProductMovements(movements);
        } catch (error) {
          console.error('Error fetching movements:', error);
          setMovementsError('Failed to load movement data');
          setProductMovements([]);
          toast.error('Failed to load movement data');
        } finally {
          setLoadingMovements(false);
        }
      };

      fetchMovements();
    }
  }, [isMovementModalOpen, selectedProductForMovements]);

  // Handle showing movements
  const handleShowMovements = (product) => {
    setSelectedProductForMovements(product);
    setIsMovementModalOpen(true);
  };

  // Close movement modal
  const handleCloseMovementModal = () => {
    setIsMovementModalOpen(false);
    setSelectedProductForMovements(null);
    setProductMovements([]);
    setMovementsError(null);
  };

  // Handle QR Code
  const handleShowQR = (product) => {
    setSelectedProductForQR(product);
    setShowQRModal(true);
  };

  // Movement type helpers
  const getMovementTypeText = (type) => {
    const typeMapping = {
      1: 'Stock In',
      2: 'Stock Out', 
      3: 'Adjustment',
      4: 'Sale',
      5: 'Return',
      6: 'Damage'
    };
    return typeMapping[type] || 'Unknown';
  };

  const getMovementTypeColor = (type) => {
    const colorMapping = {
      1: 'text-green-600 bg-green-100',
      2: 'text-red-600 bg-red-100',
      3: 'text-blue-600 bg-blue-100',
      4: 'text-purple-600 bg-purple-100',
      5: 'text-yellow-600 bg-yellow-100',
      6: 'text-red-600 bg-red-100'
    };
    return colorMapping[type] || 'text-gray-600 bg-gray-100';
  };

  const onSubmit = async (data) => {
    try {
      const productData = {
        ...data,
        imageUrl: uploadedImage, // Include uploaded image
      };

      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, ...productData }).unwrap();
        toast.success('Product updated successfully');
      } else {
        await createProduct(productData).unwrap();
        toast.success('Product created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setUploadedImage(product.imageUrl || null);
    reset(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id).unwrap();
        toast.success('Product deleted successfully');
        refetch();
      } catch (err) {
        toast.error(err.data?.message || 'Delete failed');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setUploadedImage(null);
    reset();
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        {user?.role === 'Admin' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const productImage = getProductImage(product);
          
          return (
            <Card key={product.id} className="overflow-hidden">
              <div className="space-y-4">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop';
                    }}
                  />
                  
                  {/* Stock Status Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </div>

                  {/* Action Buttons Overlay */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {/* QR Code Button */}
                    <button
                      onClick={() => handleShowQR(product)}
                      className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-sm transition-all duration-200"
                      title="Show QR Code"
                    >
                      <QrCodeIcon className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Movement Logs Button */}
                    <button
                      onClick={() => handleShowMovements(product)}
                      className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-sm transition-all duration-200"
                      title="View Movement Logs"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 text-gray-700" />
                    </button>

                    {/* Edit Button */}
                    {(user?.role === 'Manager' || user?.role === 'Admin') && (
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-sm transition-all duration-200"
                        title="Edit Product"
                      >
                        <PencilIcon className="h-4 w-4 text-blue-600" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {user?.role === 'Admin' && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1.5 shadow-sm transition-all duration-200"
                        title="Delete Product"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category || 'No Category'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="text-sm font-medium text-green-600">${product.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className={`text-sm font-medium ${
                        product.isLowStock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">SKU:</span>
                      <span className="text-sm">{product.sku || 'N/A'}</span>
                    </div>
                  </div>

                  {product.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                    </div>
                  )}

                  {product.isLowStock && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2">
                      <p className="text-xs text-red-800 font-medium">⚠️ Low Stock Alert!</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedProductForQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Product QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">{selectedProductForQR.name}</h3>
              <p className="text-sm text-gray-600 mb-4">SKU: {selectedProductForQR.sku}</p>
              <QRCodeGenerator product={selectedProductForQR} size={200} />
            </div>
          </div>
        </div>
      )}

      {/* Product Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Movement Logs - {selectedProductForMovements?.name}
              </h3>
              <button
                onClick={handleCloseMovementModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {loadingMovements && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading movements...</span>
              </div>
            )}

            {movementsError && (
              <div className="text-center py-8">
                <p className="text-red-500">{movementsError}</p>
                <Button 
                  onClick={() => handleShowMovements(selectedProductForMovements)} 
                  variant="secondary" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {!loadingMovements && !movementsError && productMovements.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No movements found for this product</p>
              </div>
            )}

            {!loadingMovements && !movementsError && productMovements.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                            {getMovementTypeText(movement.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={movement.change > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {movement.change > 0 ? '+' : ''}{movement.change}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.previousQuantity} → {movement.newQuantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {movement.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(movement.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(movement.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {movement.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={handleCloseMovementModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Image Upload */}
              <ImageUpload
                currentImage={uploadedImage}
                onImageChange={setUploadedImage}
                onImageRemove={() => setUploadedImage(null)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    {...register('price', { 
                      required: 'Price is required',
                      valueAsNumber: true,
                      min: { value: 0.01, message: 'Price must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.price && <p className="text-red-600 text-sm">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    {...register('quantity', { 
                      required: 'Quantity is required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Quantity cannot be negative' }
                    })}
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.quantity && <p className="text-red-600 text-sm">{errors.quantity.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    {...register('category')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                  <input
                    {...register('lowStockThreshold', { 
                      valueAsNumber: true,
                      min: { value: 1, message: 'Threshold must be at least 1' }
                    })}
                    type="number"
                    defaultValue={10}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.lowStockThreshold && <p className="text-red-600 text-sm">{errors.lowStockThreshold.message}</p>}
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <input
                    {...register('sku')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
