import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { 
  ArrowLeft, Download, UploadCloud, AlertCircle, CheckCircle2, 
  Trash2, Loader2, AlertTriangle, FileText, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { getCategories, uploadBulkProducts } from '../../api/products';

interface Category {
  _id: string;
  name: string;
  level: 0 | 1;
  parentId?: string;
  isActive: boolean;
  allowedGenders?: string[];
}

interface ParsedSize {
  size: string;
  stock: number;
}

interface ParsedVariant {
  color: { name: string; hex: string };
  sizes: ParsedSize[];
  mrp: number;
  price: number;
  discount: number;
  imageUrls: string[];
}

interface ParsedProduct {
  name: string;
  categoryName: string;
  subCategoryName: string;
  gender: string[];
  description: string;
  styleName: string;
  soldBy: string;
  tags: string[];
  isTriable: boolean;
  isActive: boolean;
  variants: ParsedVariant[];
  errors: string[];
}

// Helper to lookup row values supporting both raw headers and descriptive smart headers
const getRowValue = (row: any, keys: string[]): string => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return String(row[k]);
  }
  return '';
};

// Reusable validator function to perform real-time checks on the client side
const validateProduct = (p: Omit<ParsedProduct, 'errors'>, categories: Category[]): string[] => {
  const productErrors: string[] = [];
  const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // 1. Core validations
  if (!p.name || !p.name.trim()) {
    productErrors.push("Product name is required.");
  }
  if (!p.categoryName || !p.categoryName.trim()) {
    productErrors.push("Category name is required.");
  }

  // 2. Lookup categories
  let resolvedCategory: Category | undefined;
  if (p.categoryName) {
    resolvedCategory = categories.find(c => c.name.toLowerCase() === p.categoryName.toLowerCase() && c.level === 0);
    if (!resolvedCategory) {
      productErrors.push(`Category '${p.categoryName}' does not exist.`);
    }
  }

  if (resolvedCategory && p.subCategoryName) {
    const resolvedSub = categories.find(c => 
      c.name.toLowerCase() === p.subCategoryName.toLowerCase() && 
      c.level === 1 && 
      c.parentId === resolvedCategory?._id
    );
    if (!resolvedSub) {
      productErrors.push(`Subcategory '${p.subCategoryName}' does not exist under Category '${p.categoryName}'.`);
    }
  }

  // 3. Gender validation
  if (p.gender && p.gender.length > 0) {
    const invalidGenders = p.gender.filter(g => !['MEN', 'WOMEN', 'KIDS', 'BOYS', 'GIRLS'].includes(g));
    if (invalidGenders.length > 0) {
      productErrors.push(`Invalid Gender focus: ${invalidGenders.join(', ')}. Must be MEN, WOMEN, KIDS, BOYS, or GIRLS.`);
    } else if (resolvedCategory && resolvedCategory.allowedGenders) {
      const isAllowed = p.gender.every(g => resolvedCategory?.allowedGenders?.includes(g));
      if (!isAllowed) {
        productErrors.push(`Gender focus is not allowed for category '${p.categoryName}'. (Allowed: ${resolvedCategory.allowedGenders.join(', ')})`);
      }
    }
  } else {
    productErrors.push("Gender focus is required (e.g. MEN, WOMEN, KIDS, BOYS, GIRLS).");
  }

  // 4. Validate variants
  if (!p.variants || p.variants.length === 0) {
    productErrors.push("Product must have at least one variant.");
  } else {
    p.variants.forEach((v, idx) => {
      const colorLabel = v.color?.name || `Variant ${idx + 1}`;
      const mrpVal = Number(v.mrp);
      const priceVal = Number(v.price);
      
      if (isNaN(mrpVal) || mrpVal <= 0) {
        productErrors.push(`${colorLabel}: MRP must be a positive number.`);
      }
      if (isNaN(priceVal) || priceVal < 0) {
        productErrors.push(`${colorLabel}: Price must be a valid number.`);
      }
      if (priceVal > mrpVal) {
        productErrors.push(`${colorLabel}: Price cannot be greater than MRP.`);
      }

      if (!v.sizes || v.sizes.length === 0) {
        productErrors.push(`${colorLabel}: At least one size is required.`);
      } else {
        const sizeNames = v.sizes.map(s => s.size.toUpperCase());
        sizeNames.forEach(sName => {
          if (!VALID_SIZES.includes(sName)) {
            productErrors.push(`${colorLabel}: Invalid size '${sName}'. Must be: ${VALID_SIZES.join(', ')}.`);
          }
        });

        // Check duplicates
        const duplicates = sizeNames.filter((item, index) => sizeNames.indexOf(item) !== index);
        if (duplicates.length > 0) {
          productErrors.push(`${colorLabel}: Duplicate size '${duplicates[0]}' defined.`);
        }

        v.sizes.forEach(s => {
          if (isNaN(s.stock) || s.stock < 0) {
            productErrors.push(`${colorLabel} Size ${s.size}: Stock must be a positive integer.`);
          }
        });
      }
    });
  }

  return productErrors;
};

export default function BulkUploadProducts() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number; errors?: any[] } | null>(null);
  
  const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Load Categories on mount for frontend validation
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Generate and Download Template CSV with Smart Headers
  const handleDownloadTemplate = () => {
    const headers = [
      'Product Name', 'Category (e.g. Topwear)', 'Subcategory (e.g. T-Shirts)', 
      'Gender (MEN, WOMEN, KIDS)', 'Description', 'Style Name', 'Sold By', 
      'Tags (comma separated)', 'Color Name', 'Color Hex (e.g. #0000FF)', 
      'Size (XS, S, M, L, XL, XXL)', 'MRP', 'Price', 'Stock', 
      'Is Triable (true/false)', 'Is Active (true/false)'
    ];
    
    const rows = [
      [
        'Classic Polo Shirt', 'Topwear', 'T-Shirts', 'MEN', 'Premium cotton daily wear polo shirt',
        'Oxford Fit', '', 'casual, polo, summer', 'Navy Blue', '#000080', 'M',
        '999', '799', '20', 'true', 'true'
      ],
      [
        'Classic Polo Shirt', '', '', '', '',
        '', '', '', 'Navy Blue', '#000080', 'L',
        '999', '799', '15', '', ''
      ],
      [
        'Classic Polo Shirt', '', '', '', '',
        '', '', '', 'Burgundy', '#800020', 'M',
        '1099', '899', '10', '', ''
      ],
      [
        'Slim Denim Jeans', 'Bottomwear', 'Jeans', 'MEN, WOMEN', 'Stretch denim slim fit jeans',
        'Slim Fit', '', 'denim, rugged', 'Indigo', '#4B0082', 'S',
        '1999', '1599', '12', 'true', 'true'
      ]
    ];

    const csvContent = Papa.unparse({
      fields: headers,
      data: rows
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flashfits_bulk_upload_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Drag and Drop & Parsing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    setFile(file);
    setUploadResult(null);
    setExpandedProducts({});

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        parseCSVData(results.data as any[]);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to parse CSV file.");
      }
    });
  };

  // Turn flat rows into grouped Product and Variant structures
  const parseCSVData = (rows: any[]) => {
    const productsMap = new Map<string, any>();
    let currentProductName = '';

    rows.forEach((row, index) => {
      const name = getRowValue(row, ['Product Name', 'product name']).trim();
      
      if (!name) {
        if (!currentProductName) return; // skip if no context
      } else {
        currentProductName = name;
      }

      const pKey = currentProductName.toLowerCase();
      if (!productsMap.has(pKey)) {
        productsMap.set(pKey, {
          name: currentProductName,
          categoryName: getRowValue(row, ['Category (e.g. Topwear)', 'Category', 'category']).trim(),
          subCategoryName: getRowValue(row, ['Subcategory (e.g. T-Shirts)', 'Subcategory', 'subcategory']).trim(),
          genderRaw: getRowValue(row, ['Gender (MEN, WOMEN, KIDS)', 'Gender', 'gender']).trim(),
          description: getRowValue(row, ['Description', 'description']).trim(),
          styleName: getRowValue(row, ['Style Name', 'style name']).trim(),
          soldBy: getRowValue(row, ['Sold By', 'sold by']).trim(),
          tagsRaw: getRowValue(row, ['Tags (comma separated)', 'Tags', 'tags']).trim(),
          isTriableRaw: getRowValue(row, ['Is Triable (true/false)', 'Is Triable', 'is triable']).trim(),
          isActiveRaw: getRowValue(row, ['Is Active (true/false)', 'Is Active', 'is active']).trim(),
          rawVariants: [],
          csvLineStart: index + 2
        });
      }

      const currentProduct = productsMap.get(pKey);
      
      // Merge values if first row didn't have them but sub-row does
      if (!currentProduct.categoryName) currentProduct.categoryName = getRowValue(row, ['Category (e.g. Topwear)', 'Category', 'category']).trim();
      if (!currentProduct.subCategoryName) currentProduct.subCategoryName = getRowValue(row, ['Subcategory (e.g. T-Shirts)', 'Subcategory', 'subcategory']).trim();
      if (!currentProduct.genderRaw) currentProduct.genderRaw = getRowValue(row, ['Gender (MEN, WOMEN, KIDS)', 'Gender', 'gender']).trim();
      if (!currentProduct.description) currentProduct.description = getRowValue(row, ['Description', 'description']).trim();
      if (!currentProduct.styleName) currentProduct.styleName = getRowValue(row, ['Style Name', 'style name']).trim();
      if (!currentProduct.soldBy) currentProduct.soldBy = getRowValue(row, ['Sold By', 'sold by']).trim();
      if (!currentProduct.tagsRaw) currentProduct.tagsRaw = getRowValue(row, ['Tags (comma separated)', 'Tags', 'tags']).trim();
      if (!currentProduct.isTriableRaw) currentProduct.isTriableRaw = getRowValue(row, ['Is Triable (true/false)', 'Is Triable', 'is triable']).trim();
      if (!currentProduct.isActiveRaw) currentProduct.isActiveRaw = getRowValue(row, ['Is Active (true/false)', 'Is Active', 'is active']).trim();

      currentProduct.rawVariants.push({
        colorName: getRowValue(row, ['Color Name', 'color name']).trim(),
        colorHex: getRowValue(row, ['Color Hex (e.g. #0000FF)', 'Color Hex', 'color hex']).trim(),
        size: getRowValue(row, ['Size (XS, S, M, L, XL, XXL)', 'Size', 'size']).trim(),
        mrp: getRowValue(row, ['MRP', 'mrp']).trim(),
        price: getRowValue(row, ['Price', 'price']).trim(),
        stock: getRowValue(row, ['Stock', 'stock']).trim(),
        csvLine: index + 2
      });
    });

    const parsedList: ParsedProduct[] = [];

    productsMap.forEach((p) => {
      const tagsList = p.tagsRaw ? p.tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const isTriable = p.isTriableRaw ? p.isTriableRaw.toLowerCase() === 'true' : true;
      const isActive = p.isActiveRaw ? p.isActiveRaw.toLowerCase() === 'true' : true;

      // Group Variants by Color
      const colorGroups = new Map<string, any>();
      p.rawVariants.forEach((v: any) => {
        const colorKey = `${v.colorName.toLowerCase()}-${v.colorHex.toLowerCase()}`;
        if (!colorGroups.has(colorKey)) {
          const mrpVal = Number(v.mrp);
          const priceVal = Number(v.price);
          const discountVal = mrpVal > 0 ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;

          colorGroups.set(colorKey, {
            color: {
              name: v.colorName || 'Default',
              hex: v.colorHex || '#CCCCCC'
            },
            mrp: mrpVal || 0,
            price: priceVal || 0,
            discount: discountVal >= 0 ? discountVal : 0,
            sizes: [],
            imageUrls: []
          });
        }

        const group = colorGroups.get(colorKey);
        const normalizedSize = v.size.toUpperCase();
        group.sizes.push({
          size: normalizedSize,
          stock: Number(v.stock) || 0
        });
      });

      const parsedVariants = Array.from(colorGroups.values());

      let genderList: string[] = [];
      if (p.genderRaw) {
        genderList = p.genderRaw.split(',').map((g: string) => g.trim().toUpperCase());
      }

      const productInfo = {
        name: p.name,
        categoryName: p.categoryName,
        subCategoryName: p.subCategoryName,
        gender: genderList,
        description: p.description,
        styleName: p.styleName,
        soldBy: p.soldBy,
        tags: tagsList,
        isTriable,
        isActive,
        variants: parsedVariants,
      };

      const productErrors = validateProduct(productInfo, categories);

      parsedList.push({
        ...productInfo,
        errors: productErrors
      });
    });

    setParsedProducts(parsedList);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParsedProducts([]);
    setUploadResult(null);
    setExpandedProducts({});
  };

  // Re-validate and update a product inside state when changed in the table view
  const handleProductUpdate = (productIndex: number, updatedFields: Partial<ParsedProduct>) => {
    setParsedProducts(prev => {
      const copy = [...prev];
      const target = { ...copy[productIndex], ...updatedFields };
      target.errors = validateProduct(target, categories);
      copy[productIndex] = target;
      return copy;
    });
  };

  const toggleExpand = (idx: number) => {
    setExpandedProducts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Submit parsed data to Backend
  const handleUploadSubmit = async () => {
    if (parsedProducts.length === 0) return;
    
    const hasErrors = parsedProducts.some(p => p.errors.length > 0);
    if (hasErrors) {
      alert("Please fix all red highlighted validation errors in the preview list first.");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await uploadBulkProducts(parsedProducts);
      setUploadResult({
        success: true,
        message: res.message || "Bulk upload completed successfully!",
        count: res.count,
        errors: res.errors
      });
      setFile(null);
      setParsedProducts([]);
      setExpandedProducts({});
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: err.message || "Bulk upload failed. Please try again."
      });
    } finally {
      setUploading(false);
    }
  };

  const totalErrors = parsedProducts.reduce((acc, p) => acc + p.errors.length, 0);

  return (
    <div className="page-container animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4" style={{ marginBottom: "var(--space-6)" }}>
        <Link to="/merchant/inventory" className="btn btn-secondary btn-sm" style={{ padding: "8px 12px" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>Bulk Upload Products</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "4px" }}>
            Add multiple products and fashion variants to your catalog using a spreadsheet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left instructions panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Instructions Card */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Instructions
              </h3>
            </div>
            <div className="card-body" style={{ fontSize: "var(--text-sm)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <p>Follow these guidelines to prepare your spreadsheet file:</p>
                <ul style={{ paddingLeft: "var(--space-5)", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>Product Grouping</strong>: Group rows belonging to the same product by typing the exact same <strong>Product Name</strong> in adjacent rows.</li>
                  <li><strong>Shared Fields</strong>: Fields like Category, Subcategory, Gender, Description only need to be filled on the first row of a product.</li>
                  <li><strong>Categories & Subcategories</strong>: Must match existing ones exactly. (e.g. <i>Topwear</i> and <i>T-Shirts</i>).</li>
                  <li><strong>Gender Focus</strong>: Must be: <code>MEN</code>, <code>WOMEN</code>, <code>KIDS</code>, <code>BOYS</code>, or <code>GIRLS</code> (comma-separated for unisex support, e.g. <code>MEN, WOMEN</code>).</li>
                  <li><strong>Size Code</strong>: Must be exactly: <code>XS</code>, <code>S</code>, <code>M</code>, <code>L</code>, <code>XL</code>, <code>XXL</code>.</li>
                  <li><strong>Hex Color Code</strong>: Color Hex should start with a hash (e.g. <code>#0000FF</code> for Blue).</li>
                </ul>
              </div>
              <div className="divider" style={{ margin: "var(--space-4) 0" }} />
              <button onClick={handleDownloadTemplate} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                <Download size={16} /> Download CSV Template
              </button>
            </div>
          </div>

          {/* Categories Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} />
              <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>Supported Categories</h3>
            </div>
            <div className="card-body" style={{ maxHeight: '320px', overflowY: 'auto', padding: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                Write these exact names in the <strong>Category</strong> and <strong>Subcategory</strong> columns:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categories.filter(c => c.level === 0 && c.isActive).map(parent => {
                  const subs = categories.filter(c => c.level === 1 && c.parentId === parent._id && c.isActive);
                  return (
                    <div key={parent._id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{parent.name}</span>
                        <span style={{ fontWeight: 400, fontSize: '9px', color: 'var(--color-text-tertiary)' }}>
                          {parent.allowedGenders?.join(', ') || 'MEN, WOMEN'}
                        </span>
                      </div>
                      {subs.length > 0 ? (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '6px', 
                          marginTop: '6px',
                          paddingLeft: '4px'
                        }}>
                          {subs.map(sub => (
                            <span 
                              key={sub._id} 
                              className="badge badge-neutral" 
                              style={{ fontSize: '10px', padding: '2px 8px' }}
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '2px', paddingLeft: '4px' }}>
                          No subcategories
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right workspace panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Upload Dropzone */}
          {!file && (
            <div 
              className="card"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: "2px dashed var(--color-border-strong)",
                background: "var(--color-surface)",
                padding: "var(--space-12) var(--space-6)",
                textAlign: "center",
                cursor: "pointer",
                borderRadius: "var(--radius-lg)",
                transition: "all var(--transition-base)"
              }}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: 'none' }}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  background: "var(--color-bg)", 
                  color: "var(--color-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>Drag and Drop your CSV</h3>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                    or click to browse files on your computer
                  </p>
                </div>
                <div className="badge badge-neutral" style={{ fontSize: "11px" }}>Only .csv files supported</div>
              </div>
            </div>
          )}

          {/* Selected File Details */}
          {file && (
            <div className="card" style={{ background: "var(--color-surface)" }}>
              <div className="card-body" style={{ padding: "var(--space-4) var(--space-5)" }}>
                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-success)'
                    }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{file.name}</h4>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                        {(file.size / 1024).toFixed(1)} KB • {parsedProducts.length} unique products parsed
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveFile} 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: "var(--color-danger)", padding: "8px" }}
                    disabled={uploading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors Summary */}
          {file && totalErrors > 0 && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontWeight: 600 }}>Spreadsheet contains errors</span>
                <p style={{ color: 'inherit', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  We found {totalErrors} issue(s) that must be corrected. Please correct the red inputs in the preview list below before saving.
                </p>
              </div>
            </div>
          )}

          {/* Product Validation Table Preview */}
          {file && parsedProducts.length > 0 && (
            <div className="table-wrapper">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>Review Products List</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral">{parsedProducts.length} Products</span>
                  {totalErrors === 0 && <span className="badge badge-success">All Valid</span>}
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Product Name</th>
                      <th style={{ width: '25%' }}>Category / Sub</th>
                      <th style={{ width: '15%' }}>Gender Focus</th>
                      <th style={{ width: '23%' }}>Variants</th>
                      <th style={{ width: '15%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.map((p, idx) => {
                      const isValid = p.errors.length === 0;
                      const hasVarError = p.errors.some(e => e.includes("Variant") || e.includes("Price") || e.includes("MRP") || e.includes("Size") || e.includes("Stock") || e.includes("Default"));

                      // Check category lookup errors
                      const parentCategories = categories.filter(c => c.level === 0 && c.isActive);
                      const isCatInvalid = !!p.categoryName && !parentCategories.some(c => c.name.toLowerCase() === p.categoryName.toLowerCase());

                      const resolvedParent = categories.find(c => c.name.toLowerCase() === p.categoryName.toLowerCase() && c.level === 0);
                      const allowedSubs = resolvedParent ? categories.filter(c => c.level === 1 && c.parentId === resolvedParent._id && c.isActive) : [];
                      const isSubCatInvalid = !!p.subCategoryName && !allowedSubs.some(c => c.name.toLowerCase() === p.subCategoryName.toLowerCase());

                      return (
                        <>
                          <tr key={idx} style={{ verticalAlign: 'top', borderBottom: '1px solid var(--color-border)' }}>
                            {/* Product Name */}
                            <td style={{ padding: '12px 16px' }}>
                              <input 
                                type="text"
                                className="input"
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  borderColor: !p.name.trim() ? 'var(--color-danger)' : 'var(--color-border)',
                                  background: !p.name.trim() ? 'var(--color-danger-subtle)' : 'var(--color-surface)'
                                }}
                                value={p.name}
                                onChange={(e) => handleProductUpdate(idx, { name: e.target.value })}
                              />
                              {p.styleName && (
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px', paddingLeft: '4px' }}>
                                  Style: <strong>{p.styleName}</strong>
                                </div>
                              )}
                            </td>

                            {/* Category Dropdowns */}
                            <td style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* Category Select */}
                              <select 
                                className="input" 
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  borderColor: isCatInvalid || !p.categoryName ? 'var(--color-danger)' : 'var(--color-border)',
                                  background: isCatInvalid || !p.categoryName ? 'var(--color-danger-subtle)' : 'var(--color-surface)',
                                }}
                                value={p.categoryName}
                                onChange={(e) => handleProductUpdate(idx, { categoryName: e.target.value, subCategoryName: '' })}
                              >
                                <option value="">Select Category</option>
                                {isCatInvalid && <option value={p.categoryName}>{p.categoryName} (Invalid)</option>}
                                {parentCategories.map(c => (
                                  <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                              </select>

                              {/* Subcategory Select */}
                              <select 
                                className="input" 
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  borderColor: isSubCatInvalid ? 'var(--color-danger)' : 'var(--color-border)',
                                  background: isSubCatInvalid ? 'var(--color-danger-subtle)' : 'var(--color-surface)',
                                }}
                                value={p.subCategoryName}
                                onChange={(e) => handleProductUpdate(idx, { subCategoryName: e.target.value })}
                                disabled={!p.categoryName || isCatInvalid}
                              >
                                <option value="">Select Subcategory</option>
                                {isSubCatInvalid && <option value={p.subCategoryName}>{p.subCategoryName} (Invalid)</option>}
                                {allowedSubs.map(c => (
                                  <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </td>

                            {/* Gender Checkboxes */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                 {['MEN', 'WOMEN', 'KIDS', 'BOYS', 'GIRLS'].map(g => {
                                  const isChecked = p.gender.includes(g);
                                  const isAllowed = resolvedParent && resolvedParent.allowedGenders 
                                    ? resolvedParent.allowedGenders.includes(g) 
                                    : true;
                                  
                                  return (
                                    <label key={g} style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      fontSize: '11px',
                                      cursor: isAllowed ? 'pointer' : 'not-allowed',
                                      opacity: isAllowed ? 1 : 0.4
                                    }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        disabled={!isAllowed}
                                        onChange={(e) => {
                                          const updatedGender = e.target.checked 
                                            ? [...p.gender, g] 
                                            : p.gender.filter(x => x !== g);
                                          handleProductUpdate(idx, { gender: updatedGender });
                                        }}
                                      />
                                      {g}
                                    </label>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Variants Summary & Toggle */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                  {p.variants.length} Colors • {p.variants.reduce((acc, v) => acc + v.sizes.length, 0)} Sizes
                                </div>
                                <button 
                                  onClick={() => toggleExpand(idx)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    borderColor: hasVarError ? 'var(--color-danger)' : 'var(--color-border)',
                                    color: hasVarError ? 'var(--color-danger)' : 'var(--color-text)'
                                  }}
                                >
                                  {hasVarError && <AlertTriangle size={12} />}
                                  {expandedProducts[idx] ? 'Close Editor' : 'Edit Variants'}
                                  {expandedProducts[idx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Status Indicator */}
                            <td style={{ padding: '12px 16px' }}>
                              {isValid ? (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> Valid
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}>
                                    <AlertCircle size={12} /> {p.errors.length} issue(s)
                                  </span>
                                  <div style={{ fontSize: '10px', color: 'var(--color-danger)', maxWidth: '180px', whiteSpace: 'normal', lineHeight: 1.3 }}>
                                    {p.errors[0]}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Variant Sub-Row Editor */}
                          {expandedProducts[idx] && (
                            <tr style={{ background: 'var(--color-bg)' }}>
                              <td colSpan={5} style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                                      Variant Stock & Pricing Matrix for "{p.name}"
                                    </h4>
                                    <button 
                                      className="btn btn-secondary btn-sm" 
                                      style={{ padding: '2px 8px', fontSize: '10px' }}
                                      onClick={() => {
                                        const updatedVariants = [...p.variants];
                                        updatedVariants.push({
                                          color: { name: 'New Color', hex: '#CCCCCC' },
                                          mrp: 1000,
                                          price: 800,
                                          discount: 20,
                                          sizes: [{ size: 'M', stock: 10 }],
                                          imageUrls: []
                                        });
                                        handleProductUpdate(idx, { variants: updatedVariants });
                                      }}
                                    >
                                      + Add Color Variant
                                    </button>
                                  </div>
                                  
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                    {p.variants.map((v, vIdx) => {
                                      const isMrpInvalid = isNaN(v.mrp) || v.mrp <= 0;
                                      const isPriceInvalid = isNaN(v.price) || v.price < 0 || v.price > v.mrp;

                                      return (
                                        <div key={vIdx} className="card" style={{ padding: '12px', background: 'var(--color-surface)', boxShadow: 'none' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            
                                            {/* Color Name and Delete Button */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <input 
                                                type="text" 
                                                className="input" 
                                                style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 600, width: '70%' }}
                                                value={v.color.name}
                                                onChange={(e) => {
                                                  const updatedVariants = [...p.variants];
                                                  updatedVariants[vIdx].color.name = e.target.value;
                                                  handleProductUpdate(idx, { variants: updatedVariants });
                                                }}
                                              />
                                              <button 
                                                onClick={() => {
                                                  const updatedVariants = p.variants.filter((_, i) => i !== vIdx);
                                                  handleProductUpdate(idx, { variants: updatedVariants });
                                                }}
                                                style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px' }}
                                              >
                                                Delete Color
                                              </button>
                                            </div>

                                            {/* Hex and Preview */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: v.color.hex, border: '1px solid var(--color-border-strong)' }} />
                                              <input 
                                                type="text" 
                                                className="input" 
                                                style={{ padding: '2px 6px', fontSize: '10px', width: '70px', textAlign: 'center' }}
                                                value={v.color.hex}
                                                placeholder="#HEX"
                                                onChange={(e) => {
                                                  const updatedVariants = [...p.variants];
                                                  updatedVariants[vIdx].color.hex = e.target.value;
                                                  handleProductUpdate(idx, { variants: updatedVariants });
                                                }}
                                              />
                                            </div>

                                            {/* Pricing Row */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                              <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>MRP</label>
                                                <input 
                                                  type="number" 
                                                  className="input" 
                                                  style={{ 
                                                    padding: '2px 6px', 
                                                    fontSize: '11px',
                                                    borderColor: isMrpInvalid ? 'var(--color-danger)' : 'var(--color-border)',
                                                    background: isMrpInvalid ? 'var(--color-danger-subtle)' : 'var(--color-surface)',
                                                  }}
                                                  value={v.mrp || ''}
                                                  onChange={(e) => {
                                                    const updatedVariants = [...p.variants];
                                                    const val = Number(e.target.value);
                                                    updatedVariants[vIdx].mrp = val;
                                                    const prc = updatedVariants[vIdx].price;
                                                    updatedVariants[vIdx].discount = val > 0 ? Math.round(((val - prc) / val) * 100) : 0;
                                                    handleProductUpdate(idx, { variants: updatedVariants });
                                                  }}
                                                />
                                              </div>
                                              <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Selling Price</label>
                                                <input 
                                                  type="number" 
                                                  className="input" 
                                                  style={{ 
                                                    padding: '2px 6px', 
                                                    fontSize: '11px',
                                                    borderColor: isPriceInvalid ? 'var(--color-danger)' : 'var(--color-border)',
                                                    background: isPriceInvalid ? 'var(--color-danger-subtle)' : 'var(--color-surface)',
                                                  }}
                                                  value={v.price || ''}
                                                  onChange={(e) => {
                                                    const updatedVariants = [...p.variants];
                                                    const val = Number(e.target.value);
                                                    updatedVariants[vIdx].price = val;
                                                    const mrp = updatedVariants[vIdx].mrp;
                                                    updatedVariants[vIdx].discount = mrp > 0 ? Math.round(((mrp - val) / mrp) * 100) : 0;
                                                    handleProductUpdate(idx, { variants: updatedVariants });
                                                  }}
                                                />
                                              </div>
                                            </div>

                                            {/* Sizes Grid */}
                                            <div>
                                              <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>
                                                Sizes & Stock
                                              </label>
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                                {VALID_SIZES.map(sCode => {
                                                  const existingSize = v.sizes.find(sz => sz.size === sCode);
                                                  const isActive = !!existingSize;
                                                  const stock = existingSize ? existingSize.stock : 0;
                                                  const isStockInvalid = isActive && (isNaN(stock) || stock < 0);

                                                  return (
                                                    <div key={sCode} style={{ 
                                                      display: 'flex', 
                                                      alignItems: 'center', 
                                                      gap: '2px', 
                                                      border: '1px solid var(--color-border)',
                                                      borderRadius: '4px',
                                                      padding: '2px 4px',
                                                      background: isActive ? 'var(--color-surface-hover)' : 'transparent'
                                                    }}>
                                                      <input 
                                                        type="checkbox" 
                                                        checked={isActive}
                                                        onChange={(e) => {
                                                          const updatedVariants = [...p.variants];
                                                          let targetSizes = [...updatedVariants[vIdx].sizes];
                                                          if (e.target.checked) {
                                                            targetSizes.push({ size: sCode, stock: 10 }); // default stock 10
                                                          } else {
                                                            targetSizes = targetSizes.filter(sz => sz.size !== sCode);
                                                          }
                                                          updatedVariants[vIdx].sizes = targetSizes;
                                                          handleProductUpdate(idx, { variants: updatedVariants });
                                                        }}
                                                      />
                                                      <span style={{ fontSize: '10px', fontWeight: 600 }}>{sCode}</span>
                                                      {isActive && (
                                                        <input 
                                                          type="number"
                                                          className="input"
                                                          style={{ 
                                                            padding: '0 2px', 
                                                            fontSize: '10px', 
                                                            textAlign: 'center',
                                                            borderColor: isStockInvalid ? 'var(--color-danger)' : 'var(--color-border)',
                                                            background: isStockInvalid ? 'var(--color-danger-subtle)' : 'var(--color-surface)',
                                                            width: '28px',
                                                            height: '18px',
                                                            marginLeft: 'auto'
                                                          }}
                                                          value={stock}
                                                          onChange={(e) => {
                                                            const updatedVariants = [...p.variants];
                                                            const targetSizes = [...updatedVariants[vIdx].sizes];
                                                            const sIdx = targetSizes.findIndex(sz => sz.size === sCode);
                                                            if (sIdx >= 0) {
                                                              targetSizes[sIdx].stock = Number(e.target.value) || 0;
                                                            }
                                                            updatedVariants[vIdx].sizes = targetSizes;
                                                            handleProductUpdate(idx, { variants: updatedVariants });
                                                          }}
                                                        />
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: "var(--space-4)", borderTop: "1px solid var(--color-border)", display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={handleRemoveFile} className="btn btn-secondary btn-sm" disabled={uploading}>
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit} 
                  className="btn btn-primary btn-sm" 
                  disabled={uploading || totalErrors > 0 || parsedProducts.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="spinner spinner-sm" style={{ marginRight: '6px' }} /> Uploading Products...
                    </>
                  ) : (
                    'Import All Products'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Alerts */}
          {uploadResult && (
            <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-danger'}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0, color: uploadResult.success ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{uploadResult.success ? 'Import successful!' : 'Import failed'}</span>
                <p style={{ color: 'inherit', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  {uploadResult.message}
                </p>
                {uploadResult.success && uploadResult.count && (
                  <p style={{ color: 'inherit', fontSize: 'var(--text-xs)', marginTop: '4px', fontWeight: 500 }}>
                    Successfully imported {uploadResult.count} products into your inventory.
                  </p>
                )}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div style={{ marginTop: '12px', fontSize: 'var(--text-xs)', color: 'inherit', background: 'rgba(0, 0, 0, 0.05)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Some products failed during backend write:</span>
                    <ul style={{ paddingLeft: '16px', marginTop: '4px', margin: 0 }}>
                      {uploadResult.errors.map((e, idx) => (
                        <li key={idx}><strong>{e.name}</strong>: {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {uploadResult.success && (
                  <div style={{ marginTop: '12px' }}>
                    <Link to="/merchant/inventory" className="btn btn-primary btn-sm" style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                      Go to Inventory
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
