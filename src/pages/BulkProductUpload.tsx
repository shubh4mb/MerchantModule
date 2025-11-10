import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';
import { Download, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { uploadBulkProducts } from '../api/products';

// ---------- TYPES ----------
interface CSVRow {
  name: string;
  brandId: string;
  categoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  gender?: string;
  description?: string;
  tags?: string;
  [key: string]: any;
}

interface Size {
  size: string;
  stock: number;
}

interface Variant {
  color: { name: string; hex: string };
  sizes: Size[];
  mrp: number;
  price: number;
  discount: number;
  images: any[];
}

interface ProductData {
  name: string;
  brandId: string;
  categoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  gender: string;
  description: string;
  features: Record<string, string>;
  tags: string[];
  variants: Variant[];
}

interface ProductItem {
  data: ProductData;
  images: { file: File | null }[];
}

// --------------------------------

const BulkProductUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.csv')) {
      setFile(file);
      setErrors([]);
      setSuccess(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const parseCSVToProducts = (rows: CSVRow[]): ProductItem[] => {
    const productsMap: Record<string, ProductItem> = {};

    rows.forEach((row) => {
      const key = `${row.name}-${row.brandId}-${row.categoryId}-${row.subCategoryId || ''}-${row.subSubCategoryId || ''}`;

      if (!productsMap[key]) {
        productsMap[key] = {
          data: {
            name: row.name,
            brandId: row.brandId,
            categoryId: row.categoryId,
            subCategoryId: row.subCategoryId || undefined,
            subSubCategoryId: row.subSubCategoryId || undefined,
            gender: row.gender || 'unisex',
            description: row.description || '',
            features: {},
            tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
            variants: []
          },
          images: [],
        };

        // ✅ FIXED DYNAMIC FEATURE MAPPING
        let index = 1;
        while (row[`features_key${index}`]) {
          const fk = row[`features_key${index}`];
          const fv = row[`features_value${index}`];
          if (fk && fv) productsMap[key].data.features[fk] = fv;
          index++;
        }
      }

      // Add variant
      productsMap[key].data.variants.push({
        color: { name: row.variant_color_name, hex: row.variant_color_hex },
        sizes: row.variant_sizes.split(',').map((s: string) => ({ size: s.trim(), stock: 10 })),
        mrp: parseFloat(row.variant_mrp) || 0,
        price: parseFloat(row.variant_price) || 0,
        discount: parseFloat(row.variant_discount) || 0,
        images: []
      });

      // Placeholder image count
      const imgCount = parseInt(row.variant_images_count) || 0;
      for (let j = 0; j < imgCount; j++) {
        productsMap[key].images.push({ file: null });
      }
    });

    return Object.values(productsMap);
  };

const handleUpload = async () => {
  if (!file) return;

  setUploading(true);
  setProgress(0);
  setErrors([]);
  setSuccess(false);

  Papa.parse<CSVRow>(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const products = parseCSVToProducts(results.data);

      try {
        await uploadBulkProducts(products, (percent) => setProgress(percent));
        setSuccess(true);
      } catch (err: any) {
        setErrors([err?.response?.data?.message || err?.message]);
      } finally {
        setUploading(false);
      }
    },
    error: (err) => {
      setErrors([err.message]);
      setUploading(false);
    }
  });
};

  const downloadTemplate = () => {
    const csv = `name,brandId,categoryId,subCategoryId,subSubCategoryId,gender,description,features_key1,features_value1,tags,variant_color_name,variant_color_hex,variant_sizes,variant_mrp,variant_price,variant_discount,variant_images_count
T-Shirt,66f1...,66f1...,66f1...,,men,,Material,Cotton,Casual,Blue,#0000FF,"S,M,L",999,799,20,3`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_product_template.csv';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Product Upload</h2>

        {/* Download Template */}
        <button
          onClick={downloadTemplate}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {file ? (
            <p className="text-green-600 font-medium">{file.name}</p>
          ) : (
            <p className="text-gray-600">
              {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here, or click to select'}
            </p>
          )}
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              'Upload Products'
            )}
          </button>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Products uploaded successfully!
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <strong>Upload Failed:</strong>
            </div>
            <ul className="list-disc list-inside text-sm">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500">
          <strong>Note:</strong> For images, upload a ZIP file with named images like <code>product1_blue_1.jpg</code> or use Cloudinary URLs in CSV later.
        </p>
      </div>
    </div>
  );
};

export default BulkProductUpload;