import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { PlusIcon, TrashIcon, NewSaleIcon, StockIcon, SearchIcon, ScaleIcon, AlertTriangleIcon } from './icons';
import Input from './ui/Input';

interface NewSaleViewProps {
  products: Product[];
  onCompleteSale: (cart: CartItem[], paymentMethod: 'UPI' | 'Card' | 'Cash') => void;
  sgstPercentage: number;
  cgstPercentage: number;
}

const NewSaleView: React.FC<NewSaleViewProps> = ({ products, onCompleteSale, sgstPercentage, cgstPercentage }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash' | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  const [quantityProduct, setQuantityProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (quantityProduct) {
        quantityInputRef.current?.focus();
    }
  }, [quantityProduct]);


  const openQuantityModal = (product: Product) => {
    setQuantityProduct(product);
    const existingItem = cart.find(item => item.id === product.id);
    setCurrentQuantity(existingItem ? String(existingItem.quantity) : '1');
    setIsDropdownVisible(false);
  }

  const closeQuantityModal = () => {
    setQuantityProduct(null);
    setCurrentQuantity('');
    searchInputRef.current?.focus();
  };

  const handleSetQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityProduct) return;
    const quantity = parseFloat(currentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      removeFromCart(quantityProduct.id);
      closeQuantityModal();
      return;
    }
    
    if (quantity > quantityProduct.stock) {
      alert(`Cannot add more than available stock (${quantityProduct.stock}).`);
      return;
    }
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === quantityProduct.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === quantityProduct.id ? { ...item, quantity: quantity } : item
        );
      } else {
        return [...prevCart, { ...quantityProduct, quantity: quantity }];
      }
    });
    closeQuantityModal();
  }
  
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
     const product = products.find(p => p.id === productId);
     if (product && quantity > product.stock) {
        quantity = product.stock;
     }
     if (quantity <= 0) {
         removeFromCart(productId);
     } else {
        setCart(prevCart => prevCart.map(item => item.id === productId ? {...item, quantity} : item));
     }
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const sgstAmount = subtotal * (sgstPercentage / 100);
  const cgstAmount = subtotal * (cgstPercentage / 100);
  const total = subtotal + sgstAmount + cgstAmount;

  const handleCheckout = () => {
      if (cart.length > 0) {
          setIsPaymentModalOpen(true);
      }
  };
  
  const handleCompleteSale = () => {
    if (cart.length > 0 && paymentMethod) {
      onCompleteSale(cart, paymentMethod);
      setCart([]);
      setIsPaymentModalOpen(false);
      setPaymentMethod(null);
    }
  };
  
  const filteredProducts = searchTerm.length > 0 
    ? products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0)
      .sort((a,b) => a.name.localeCompare(b.name))
    : [];
  
  const renderQuantityModal = () => {
    if (!quantityProduct) return null;
    return (
        <Modal isOpen={true} onClose={closeQuantityModal} title="Set Quantity">
            <form onSubmit={handleSetQuantity} className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                    <ScaleIcon className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-bold text-lg text-on-surface">{quantityProduct.name}</p>
                        <p className="text-sm text-on-surface-secondary">Available Stock: {quantityProduct.stock}</p>
                    </div>
                </div>
                 <Input 
                    ref={quantityInputRef}
                    id="item-quantity"
                    label="Quantity"
                    type="number"
                    step="any"
                    min="0"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    required
                />
                {parseFloat(currentQuantity) > quantityProduct.stock && (
                    <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangleIcon className="w-4 h-4"/>Not enough stock available.</p>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                    <Button type="button" variant="ghost" onClick={closeQuantityModal}>Cancel</Button>
                    <Button type="submit">Add to Cart</Button>
                </div>
            </form>
        </Modal>
    );
  };


  const renderPaymentModal = () => (
    <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Select Payment Method">
        <div className="space-y-4">
            <p className="text-on-surface-secondary">Select how the customer is paying.</p>
            <div className="grid grid-cols-3 gap-4">
                {(['Card', 'UPI', 'Cash'] as const).map(method => (
                    <Button 
                        key={method}
                        variant={paymentMethod === method ? 'primary' : 'ghost'}
                        onClick={() => setPaymentMethod(method)}
                        className="!py-4 !text-lg"
                    >
                        {method}
                    </Button>
                ))}
            </div>
            <div className="border-t pt-4 mt-4 flex justify-end">
                <Button 
                    onClick={handleCompleteSale} 
                    variant="secondary" 
                    className="w-full !py-3"
                    disabled={!paymentMethod}
                >
                    Complete Sale & Print Invoice
                </Button>
            </div>
        </div>
    </Modal>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)]">
      <h1 className="text-3xl font-bold text-on-surface mb-4 flex-shrink-0">New Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <Card className="flex-grow flex flex-col">
            <div ref={searchContainerRef} className="relative w-full mb-4">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Start typing to search for products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownVisible(true)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {isDropdownVisible && searchTerm.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-surface rounded-lg shadow-xl z-10 border max-h-96 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                            <ul>
                                {filteredProducts.map(product => (
                                    <li 
                                        key={product.id}
                                        className="p-4 border-b last:border-b-0 hover:bg-primary-light cursor-pointer flex justify-between items-center"
                                        onMouseDown={() => openQuantityModal(product)}
                                    >
                                        <div>
                                            <p className="font-semibold text-on-surface">{product.name}</p>
                                            <p className="text-sm text-on-surface-secondary">Stock: {product.stock}</p>
                                        </div>
                                        <p className="font-semibold text-on-surface">₹{product.price.toFixed(2)}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-on-surface-secondary">
                                No products found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {products.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-on-surface-secondary p-4">
                    <StockIcon className="w-16 h-16 opacity-50 mb-4" />
                    <h3 className="text-xl font-semibold">No Products in Inventory</h3>
                    <p>Please add items in Stock Management to begin a sale.</p>
                </div>
            ) : (
                 <div className="flex-grow flex flex-col items-center justify-center text-on-surface-secondary p-4 bg-gray-50 rounded-lg">
                    <SearchIcon className="w-16 h-16 opacity-40 mb-4" />
                    <h3 className="text-xl font-semibold">Ready to make a sale!</h3>
                    <p>Use the search bar above to find products and add them to the cart.</p>
                </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col min-h-0">
          <Card title="Current Sale" className="flex-grow flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-on-surface-secondary">
                <NewSaleIcon className="w-20 h-20 opacity-40 mb-4"/>
                <p className="font-semibold">Your cart is empty</p>
                <p className="text-sm">Search for products to get started.</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col min-h-0">
                  <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                      {cart.map((item) => (
                      <div key={item.id} className="flex items-center">
                          <div className="flex-grow">
                            <p className="font-semibold text-on-surface">{item.name}</p>
                            <p className="text-sm text-on-surface-secondary">₹{item.price.toFixed(2)} x {item.quantity} = <strong>₹{(item.price * item.quantity).toFixed(2)}</strong></p>
                          </div>
                          <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 p-1 border rounded-md text-center bg-gray-50 focus:ring-primary focus:border-primary"
                                min="0"
                                step="any"
                                max={item.stock}
                              />
                              <Button variant="danger" onClick={() => removeFromCart(item.id)} className="p-2 !rounded-full">
                                <TrashIcon className="w-4 h-4"/>
                              </Button>
                          </div>
                      </div>
                      ))}
                  </div>

                  <div className="border-t pt-4 mt-auto flex-shrink-0">
                      <div className="space-y-1 text-sm mb-3">
                          <div className="flex justify-between text-on-surface-secondary">
                              <span>Subtotal</span>
                              <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-on-surface-secondary">
                              <span>SGST ({sgstPercentage}%)</span>
                              <span>+ ₹{sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-on-surface-secondary">
                              <span>CGST ({cgstPercentage}%)</span>
                              <span>+ ₹{cgstAmount.toFixed(2)}</span>
                          </div>
                      </div>
                      <div className="flex justify-between font-bold text-xl text-on-surface border-t pt-3">
                          <span>Total</span>
                          <span>₹{total.toFixed(2)}</span>
                      </div>
                      <Button onClick={handleCheckout} variant="secondary" className="w-full !mt-4 !py-3">
                          Checkout
                      </Button>
                  </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      {renderPaymentModal()}
      {renderQuantityModal()}
    </div>
  );
};

export default NewSaleView;