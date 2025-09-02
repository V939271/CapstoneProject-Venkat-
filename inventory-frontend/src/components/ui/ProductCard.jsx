import React from 'react';
import { getProductImage, getStockStatus } from '../../utils/productImages';
import { PencilIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const ProductCard = ({ product, onEdit, onDelete, onShowMovements, user }) => {
  const stockStatus = getStockStatus(product);
  const productImage = getProductImage(product);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200">
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
        {/* Low Stock Warning */}
        {product.isLowStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            ⚠️ Low Stock!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
          <span className="text-lg font-bold text-green-600">${product.price}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{product.category || 'No Category'}</p>
        <p className="text-xs text-gray-500 mb-3">{product.description}</p>
        
        {/* Quantity and SKU */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">
            Qty: <span className={`font-bold ${product.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
              {product.quantity}
            </span>
          </span>
          <span className="text-xs text-gray-500">SKU: {product.sku}</span>
        </div>

        {/* Action Buttons */}
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onShowMovements(product)}
              className="flex-1"
            >
              <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(product)}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(product.id)}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
