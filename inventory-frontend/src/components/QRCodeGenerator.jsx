import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const QRCodeGenerator = ({ product, size = 200 }) => {
  const qrCodeRef = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    const qrData = JSON.stringify({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      category: product.category,
      url: `${window.location.origin}/products/${product.id}`
    });

    qrCode.current = new QRCodeStyling({
      width: size,
      height: size,
      data: qrData,
      dotsOptions: {
        color: "#2563eb",
        type: "rounded"
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#1d4ed8"
      },
      cornersDotOptions: {
        type: "dot",
        color: "#1e40af"
      }
    });

    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = '';
      qrCode.current.append(qrCodeRef.current);
    }
  }, [product, size]);

  const downloadQR = () => {
    if (qrCode.current) {
      qrCode.current.download({
        name: `${product.sku || product.name}-qr-code`,
        extension: "png"
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div ref={qrCodeRef} className="border border-gray-200 rounded-lg p-2 bg-white" />
      <button
        onClick={downloadQR}
        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 underline"
      >
        <DocumentArrowDownIcon className="w-4 h-4" />
        <span>Download QR Code</span>
      </button>
    </div>
  );
};

export default QRCodeGenerator;
