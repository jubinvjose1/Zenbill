import React, { useState, useRef } from 'react';
import { Product } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { PlusIcon, TrashIcon, StockIcon, EditIcon, DownloadIcon, UploadIcon, SearchIcon, CheckCircleIcon, LoadingSpinner, AlertTriangleIcon } from './icons';

interface StockViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'shopId'>) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProduct: (productId: string, newStock: number) => void;
  onProcessCsvImport: (productsToCreate: Omit<Product, 'id' | 'shopId'>[], productsToUpdate: { id: string, stock: number }[]) => void;
  onDownloadReport: () => void;
}

type ImportStep = 'idle' | 'upload' | 'analyzing' | 'review' | 'importing' | 'success' | 'error';
type CsvRow = { name: string, price: string, stock: string };
type ProductToCreate = Omit<Product, 'id' | 'shopId'>;
type ProductToUpdate = { id: string, stock: number, name: string, oldStock: number };


const StockStatusIndicator = ({ stock }: { stock: number }) => {
    let color = 'bg-gray-400';
    if (stock > 10) color = 'bg-green-500';
    else if (stock > 0) color = 'bg-yellow-500';
    else color = 'bg-red-500';
    
    return <span className={`w-3 h-3 rounded-full inline-block mr-3 flex-shrink-0 ${color}`}></span>
}

const StockView: React.FC<StockViewProps> = ({ products, onAddProduct, onDeleteProduct, onUpdateProduct, onProcessCsvImport, onDownloadReport }) => {
  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  // State for Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatedStock, setUpdatedStock] = useState('');

  // State for Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for CSV Import Modal
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [productsToCreate, setProductsToCreate] = useState<ProductToCreate[]>([]);
  const [productsToUpdate, setProductsToUpdate] = useState<ProductToUpdate[]>([]);

  const csvInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setName('');
    setPrice('');
    setStock('');
  };
  
  const openUpdateModal = (product: Product) => {
    setEditingProduct(product);
    setUpdatedStock(product.stock.toString());
    setIsUpdateModalOpen(true);
  };
  
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingProduct(null);
    setUpdatedStock('');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price && stock) {
      onAddProduct({
        name,
        price: parseFloat(price),
        stock: parseFloat(stock),
      });
      closeAddModal();
    }
  };
  
  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && updatedStock !== '') {
        onUpdateProduct(editingProduct.id, parseFloat(updatedStock));
        closeUpdateModal();
    }
  };

  const handleCsvUploadClick = () => {
      setImportStep('upload');
  }

  const handleCloseImportModal = () => {
    setImportStep('idle');
    setImportError(null);
    setProductsToCreate([]);
    setProductsToUpdate([]);
  }

  const handleConfirmImport = () => {
    setImportStep('importing');
    const updatePayload = productsToUpdate.map(p => ({ id: p.id, stock: p.stock }));
    onProcessCsvImport(productsToCreate, updatePayload);
    setTimeout(() => {
        setImportStep('success');
    }, 500);
  }
  
  const analyzeCsvFile = (text: string) => {
    setImportError(null);
    setImportStep('analyzing');

    try {
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headerRow = rows.shift()?.trim().toLowerCase();
        if (!headerRow) throw new Error("CSV file is empty or invalid.");

        const headers = headerRow.split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'price', 'stock'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error(`CSV must contain the following columns: ${requiredHeaders.join(', ')}.`);
        }
        
        const nameIndex = headers.indexOf('name');
        const priceIndex = headers.indexOf('price');
        const stockIndex = headers.indexOf('stock');

        const parsedData: CsvRow[] = rows.map((row, i) => {
            const values = row.split(',');
            const name = values[nameIndex]?.trim();
            const price = values[priceIndex]?.trim();
            const stock = values[stockIndex]?.trim();
            if (!name || !price || !stock) {
              console.warn(`Skipping incomplete row ${i+2}: ${row}`);
              return null;
            }
            if (isNaN(parseFloat(price)) || isNaN(parseFloat(stock))) {
              throw new Error(`Invalid number format in row ${i+2}. Price and stock must be numbers.`);
            }
            return { name, price, stock };
        }).filter((d): d is CsvRow => d !== null);

        const toCreate: ProductToCreate[] = [];
        const toUpdate: ProductToUpdate[] = [];
        const existingProductsMap = new Map(products.map(p => [p.name.toLowerCase(), p]));

        parsedData.forEach(row => {
            const existingProduct = existingProductsMap.get(row.name.toLowerCase());
            const newStock = parseFloat(row.stock);
            
            if (existingProduct) {
                if (existingProduct.stock !== newStock) {
                    toUpdate.push({
                        id: existingProduct.id,
                        name: existingProduct.name,
                        stock: newStock,
                        oldStock: existingProduct.stock
                    });
                }
            } else {
                toCreate.push({
                    name: row.name,
                    price: parseFloat(row.price),
                    stock: newStock
                });
            }
        });
        
        setProductsToCreate(toCreate);
        setProductsToUpdate(toUpdate);

        if (toCreate.length === 0 && toUpdate.length === 0) {
            throw new Error("No new products to create or stock levels to update were found in the file.");
        }

        setTimeout(() => setImportStep('review'), 500); // Simulate analysis time

    } catch (e: any) {
        setImportError(e.message);
        setImportStep('error');
    }
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      handleCloseImportModal();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        analyzeCsvFile(text);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const renderImportModalContent = () => {
    switch (importStep) {
      case 'upload':
        return (
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Upload your inventory file</h3>
            <p className="text-on-surface-secondary mb-4">File must be a .csv with 'name', 'price', and 'stock' columns.</p>
            <Button onClick={() => csvInputRef.current?.click()}>
              <UploadIcon className="w-5 h-5"/> Select CSV File
            </Button>
            <input type="file" ref={csvInputRef} onChange={handleCsvFileChange} className="hidden" accept=".csv" />
          </div>
        );
      case 'analyzing':
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-48">
              <LoadingSpinner className="w-12 h-12 text-primary"/>
              <p className="mt-4 font-semibold text-lg text-on-surface">Analyzing your file...</p>
          </div>
        );
      case 'review':
        return (
          <div>
            <h3 className="font-semibold text-lg mb-4 text-center">Review Your Import</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
                <h4 className="font-bold text-green-600 mb-2">{productsToCreate.length} New Products to Create</h4>
                {productsToCreate.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {productsToCreate.map(p => <li key={p.name}>{p.name} (Stock: {p.stock})</li>)}
                  </ul>
                ) : <p className="text-sm text-on-surface-secondary">None</p>}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
                <h4 className="font-bold text-blue-600 mb-2">{productsToUpdate.length} Existing Products to Update</h4>
                {productsToUpdate.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {productsToUpdate.map(p => <li key={p.id}>{p.name} (Stock: {p.oldStock} → {p.stock})</li>)}
                  </ul>
                ) : <p className="text-sm text-on-surface-secondary">None</p>}
              </div>
            </div>
             <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                <Button type="button" variant="ghost" onClick={handleCloseImportModal}>Cancel</Button>
                <Button type="button" onClick={handleConfirmImport}>Confirm & Import</Button>
            </div>
          </div>
        );
       case 'importing':
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-48">
              <LoadingSpinner className="w-12 h-12 text-primary"/>
              <p className="mt-4 font-semibold text-lg text-on-surface">Importing data...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-48">
            <CheckCircleIcon className="w-16 h-16 text-secondary"/>
            <p className="mt-4 font-semibold text-lg text-on-surface">Import Successful!</p>
            <p className="text-on-surface-secondary">{productsToCreate.length} products created, {productsToUpdate.length} products updated.</p>
            <Button onClick={handleCloseImportModal} className="mt-4">Done</Button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-48">
            <AlertTriangleIcon className="w-16 h-16 text-red-500"/>
            <p className="mt-4 font-semibold text-lg text-on-surface">Import Failed</p>
            <p className="text-on-surface-secondary text-red-600 my-2">{importError}</p>
            <Button variant="ghost" onClick={() => setImportStep('upload')}>Try Again</Button>
          </div>
        );
      default: return null;
    }
  }
  
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-on-surface">Stock Management</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={handleCsvUploadClick} variant="ghost">
            <UploadIcon className="w-5 h-5" /> Import from CSV
          </Button>
          <Button onClick={onDownloadReport} variant="ghost" disabled={products.length === 0}>
            <DownloadIcon className="w-5 h-5" /> Download Report
          </Button>
          <Button onClick={openAddModal}>
            <PlusIcon className="w-5 h-5" /> Add New Product
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b">
            <div className="relative">
                 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input 
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-gray-50 focus:ring-primary focus:border-primary"
                 />
            </div>
        </div>
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Product Name</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Price</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary">Stock Level</th>
                  <th className="p-4 text-sm font-semibold text-on-surface-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-on-surface">{product.name}</td>
                    <td className="p-4 text-on-surface-secondary">₹{product.price.toFixed(2)}</td>
                    <td className="p-4 text-on-surface-secondary flex items-center">
                        <StockStatusIndicator stock={product.stock} />
                        {product.stock} units
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="primary" onClick={() => openUpdateModal(product)} className="p-2">
                          <EditIcon className="w-5 h-5" />
                        </Button>
                        <Button variant="danger" onClick={() => onDeleteProduct(product.id)} className="p-2">
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <StockIcon className="w-16 h-16 mx-auto text-on-surface-secondary opacity-50" />
            <h3 className="mt-4 text-xl font-semibold text-on-surface">No Products Found</h3>
            <p className="mt-2 text-on-surface-secondary">
                {searchTerm ? "Try adjusting your search." : "Get started by adding your first product."}
            </p>
            {!searchTerm && (
                <Button onClick={openAddModal} className="mt-6">
                <PlusIcon className="w-5 h-5" /> Add First Product
                </Button>
            )}
          </div>
        )}
      </Card>
      
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add New Product">
         <form onSubmit={handleAddProduct} className="space-y-4">
            <Input id="product-name" label="Product Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input id="product-price" label="Price (₹)" type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input id="product-stock" label="Stock Quantity" type="number" min="0" step="any" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button type="button" variant="ghost" onClick={closeAddModal}>Cancel</Button>
                <Button type="submit">
                    <PlusIcon className="w-5 h-5" /> Add Product
                </Button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal} title="Update Stock">
        <form onSubmit={handleUpdateStock} className="space-y-4">
            <Input id="update-product-name" label="Product Name" type="text" value={editingProduct?.name || ''} disabled />
            <Input id="update-product-price" label="Price (₹)" type="number" value={editingProduct?.price.toString() || ''} disabled />
            <Input 
                id="update-product-stock" 
                label="New Stock Quantity" 
                type="number" 
                min="0" 
                step="any" 
                value={updatedStock} 
                onChange={(e) => setUpdatedStock(e.target.value)} 
                required 
                autoFocus
            />
            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button type="button" variant="ghost" onClick={closeUpdateModal}>Cancel</Button>
                <Button type="submit">
                    Update Stock
                </Button>
            </div>
        </form>
      </Modal>

       <Modal isOpen={importStep !== 'idle'} onClose={handleCloseImportModal} title="Import Stock from CSV">
            {renderImportModalContent()}
       </Modal>
    </div>
  );
};

export default StockView;