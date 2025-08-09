import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { DownloadIcon } from './icons';
import { downloadCSV } from '../services/csvService';
import Input from './ui/Input';

interface SalesHistoryViewProps {
  sales: Sale[];
  currentUser: User;
}

type FilterType = 'all' | 'today' | 'week' | 'month' | '3month' | 'custom';

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ sales, currentUser }) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const viewDetails = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const closeModal = () => {
    setSelectedSale(null);
  };
  
  const handleDownloadReport = () => {
    const reportData = filteredSales.map(sale => ({
        SaleID: sale.id,
        Date: new Date(sale.date).toLocaleString(),
        Items: sale.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
        Subtotal: sale.subtotal.toFixed(2),
        SGST: sale.sgstAmount.toFixed(2),
        CGST: sale.cgstAmount.toFixed(2),
        Total: sale.total.toFixed(2),
        PaymentMethod: sale.paymentMethod,
    }));
    downloadCSV(reportData, `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
  }

  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch(filter) {
        case 'today':
            return saleDate >= startOfToday;
        case 'week':
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - now.getDay());
            return saleDate >= startOfWeek;
        case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return saleDate >= startOfMonth;
        case '3month':
            const startOf3Month = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            return saleDate >= startOf3Month;
        case 'custom':
            if (!customRange.start || !customRange.end) return true;
            const startDate = new Date(customRange.start);
            startDate.setHours(0,0,0,0);
            const endDate = new Date(customRange.end);
            endDate.setHours(23,59,59,999);
            return saleDate >= startDate && saleDate <= endDate;
        case 'all':
        default:
            return true;
      }
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, filter, customRange]);

  const FilterButton = ({ type, label }: { type: FilterType, label: string }) => (
    <Button
        variant={filter === type ? 'primary' : 'ghost'}
        onClick={() => setFilter(type)}
        className="text-sm px-3 py-1.5"
    >
        {label}
    </Button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-on-surface">Sales History</h1>
        <Button onClick={handleDownloadReport} disabled={filteredSales.length === 0}>
          <DownloadIcon className="w-5 h-5" /> Download Report
        </Button>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-on-surface-secondary">Filter by:</span>
            <FilterButton type="all" label="All Time" />
            <FilterButton type="today" label="Today" />
            <FilterButton type="week" label="This Week" />
            <FilterButton type="month" label="This Month" />
            <FilterButton type="3month" label="Last 3 Months" />
            <FilterButton type="custom" label="Custom" />
        </div>
        {filter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <Input 
                    id="start-date"
                    label="Start Date"
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <Input 
                    id="end-date"
                    label="End Date"
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                />
            </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-sm font-semibold text-on-surface-secondary">Sale ID</th>
                <th className="p-3 text-sm font-semibold text-on-surface-secondary">Date</th>
                <th className="p-3 text-sm font-semibold text-on-surface-secondary">Total Qty</th>
                <th className="p-3 text-sm font-semibold text-on-surface-secondary">Total</th>
                <th className="p-3 text-sm font-semibold text-on-surface-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-on-surface">{sale.id.substring(0, 8)}...</td>
                  <td className="p-3 text-on-surface-secondary">{new Date(sale.date).toLocaleString()}</td>
                  <td className="p-3 text-on-surface-secondary">{Number(sale.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3))}</td>
                  <td className="p-3 font-semibold text-on-surface">₹{sale.total.toFixed(2)}</td>
                  <td className="p-3">
                    <Button onClick={() => viewDetails(sale)} className="text-sm py-1 px-3">
                      View Details
                    </Button>
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={5} className="text-center p-6 text-on-surface-secondary">No sales found for the selected period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {selectedSale && (
        <Modal isOpen={!!selectedSale} onClose={closeModal} title={`Invoice - ${selectedSale.id.substring(0,8)}`}>
           <div className="space-y-4">
                <div className="text-center mb-6 border-b pb-4">
                    {currentUser.shopLogo && (
                        <img src={currentUser.shopLogo} alt={`${currentUser.shopName} Logo`} className="h-20 mx-auto mb-4 object-contain" />
                    )}
                    <h3 className="text-2xl font-bold text-on-surface">{currentUser.shopName}</h3>
                    {currentUser.shopAddress && <p className="text-sm text-on-surface-secondary whitespace-pre-wrap">{currentUser.shopAddress}</p>}
                    {currentUser.shopPhoneNumber && <p className="text-sm text-on-surface-secondary mt-1"><strong>Phone:</strong> {currentUser.shopPhoneNumber}</p>}
                    {currentUser.gstNumber && <p className="text-sm text-on-surface-secondary mt-1"><strong>GSTIN:</strong> {currentUser.gstNumber}</p>}
                </div>

                <div className="flex justify-between">
                    <span><strong>Date:</strong> {new Date(selectedSale.date).toLocaleString()}</span>
                    <span><strong>Payment:</strong> {selectedSale.paymentMethod}</span>
                </div>
                <div className="border-t pt-2">
                    <h4 className="font-semibold mb-2">Items Purchased:</h4>
                    <ul className="space-y-2">
                        {selectedSale.items.map(item => (
                            <li key={item.id} className="flex justify-between">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border-t pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-on-surface-secondary">
                        <span>Subtotal</span>
                        <span>₹{selectedSale.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-on-surface-secondary">
                        <span>SGST</span>
                        <span>₹{selectedSale.sgstAmount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-on-surface-secondary">
                        <span>CGST</span>
                        <span>₹{selectedSale.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-on-surface pt-1 border-t mt-1">
                        <span>Total</span>
                        <span>₹{selectedSale.total.toFixed(2)}</span>
                    </div>
                </div>
           </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesHistoryView;