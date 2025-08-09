import React, { useState, useEffect, useMemo } from 'react';
import type { User, Product, Sale, CartItem, UserRole, Activity, Ticket, TicketStatus, TicketMessage } from './types.ts';
import { View } from './types.ts';

import Sidebar from './components/Sidebar.tsx';
import LoginView from './components/LoginView.tsx';
import DashboardView from './components/DashboardView.tsx';
import StockView from './components/StockView.tsx';
import NewSaleView from './components/NewSaleView.tsx';
import SalesHistoryView from './components/SalesHistoryView.tsx';
import SettingsView from './components/SettingsView.tsx';
import SuperAdminActivityLogView from './components/SuperAdminActivityLogView.tsx';
import ActivityLogView from './components/ActivityLogView.tsx';
import SuperAdminDashboardView from './components/SuperAdminDashboardView.tsx';
import AccountDisabledOverlay from './components/AccountDisabledOverlay.tsx';
import CustomerBanner from './components/CustomerBanner.tsx';
import { generateAndPrintInvoice } from './services/invoiceService.ts';
import { downloadCSV } from './services/csvService.ts';
import SupportView from './components/SupportView.tsx';
import SuperAdminSupportView from './components/SuperAdminSupportView.tsx';

const App: React.FC = () => {
  // Global state for all data across all shops
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);

  // --- Data Persistence ---
  useEffect(() => {
    // Load ALL data from localStorage once on startup
    try {
        const savedUsers = localStorage.getItem('zenbill_users_all');
        const savedProducts = localStorage.getItem('zenbill_products_all');
        const savedSales = localStorage.getItem('zenbill_sales_all');
        const savedActivities = localStorage.getItem('zenbill_activities_all');
        const savedTickets = localStorage.getItem('zenbill_tickets_all');
        const savedCurrentUser = localStorage.getItem('zenbill_currentUser');
        
        let loadedUsers = savedUsers ? JSON.parse(savedUsers) : [];
        
        // Backfill merchantId for existing users who don't have one
        const usersWithMerchantId = loadedUsers.map((u: User) => {
          if (!u.merchantId && u.role !== 'SuperAdmin') {
            return { ...u, merchantId: `ZEN-${Math.floor(1000000 + Math.random() * 9000000)}` };
          }
          return u;
        });

        setUsers(usersWithMerchantId);
        setProducts(savedProducts ? JSON.parse(savedProducts) : []);
        setSales(savedSales ? JSON.parse(savedSales) : []);
        setActivities(savedActivities ? JSON.parse(savedActivities) : []);
        setTickets(savedTickets ? JSON.parse(savedTickets) : []);

        if (savedCurrentUser) {
            const user: User = JSON.parse(savedCurrentUser);
            if (user.role === 'SuperAdmin' || usersWithMerchantId.some((u: User) => u.id === user.id)) {
                // Find the latest version of the user from the loaded users array
                const latestUser = usersWithMerchantId.find((u:User) => u.id === user.id) || user;
                handleSuccessfulLogin(latestUser);
            }
        }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        localStorage.clear(); // Clear potentially corrupted storage
    }
  }, []);

  useEffect(() => { localStorage.setItem('zenbill_users_all', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('zenbill_products_all', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('zenbill_sales_all', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('zenbill_activities_all', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('zenbill_tickets_all', JSON.stringify(tickets)); }, [tickets]);

  // --- Per-Shop Data Filtering ---
  const shopData = useMemo(() => {
    if (!currentUser || currentUser.role === 'SuperAdmin') {
        return { shopUsers: [], shopProducts: [], shopSales: [], shopActivities: [], shopTickets: [] };
    }
    const shopId = currentUser.shopId;
    return {
        shopUsers: users.filter(u => u.shopId === shopId),
        shopProducts: products.filter(p => p.shopId === shopId),
        shopSales: sales.filter(s => s.shopId === shopId),
        shopActivities: activities.filter(a => a.shopId === shopId),
        shopTickets: tickets.filter(t => t.shopId === shopId),
    };
  }, [currentUser, users, products, sales, activities, tickets]);

  const logActivity = (description: string, shopId: string) => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      shopId,
      timestamp: new Date().toISOString(),
      description,
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleSuccessfulLogin = (user: User) => {
    setCurrentUser(user);
    
    let targetView = View.DASHBOARD; // Default view

    if (user.role === 'SuperAdmin') {
      targetView = View.SUPER_ADMIN_DASHBOARD;
    } else {
       switch(user.role) {
          case 'Admin': targetView = View.DASHBOARD; break;
          case 'Cashier': targetView = View.NEW_SALE; break;
          case 'Accountant': targetView = View.STOCK; break;
      }
    }
    setCurrentView(targetView);
    
    if (user.role !== 'SuperAdmin' && !user.isDisabled) {
        logActivity(`${user.name} logged in.`, user.shopId);
    }
  };

  // --- Auth Handlers ---
  const handleAuth = async (isLogin: boolean, name: string, password: string, shopName?: string): Promise<string | null> => {
    if (isLogin && name === 'admin' && password === 'password') {
        const superAdminUser: User = { id: 'super-admin', shopId: 'super-admin-hq', name: 'ZenBill Admin', role: 'SuperAdmin', shopName: 'ZenBill HQ' };
        localStorage.setItem('zenbill_currentUser', JSON.stringify(superAdminUser));
        handleSuccessfulLogin(superAdminUser);
        return null;
    }
    
    if (isLogin) {
        const user = users.find(u => u.name === name && u.password === password);
        if (user) {
            localStorage.setItem('zenbill_currentUser', JSON.stringify(user));
            handleSuccessfulLogin(user);
            return null;
        } else {
            return 'Invalid username or password.';
        }
    } else { // Sign Up
        if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
            return 'Username is already taken. Please choose another one.';
        }

        const newShopId = `shop-${Date.now()}`;
        const newMerchantId = `ZEN-${Math.floor(1000000 + Math.random() * 9000000)}`;
        const adminUser: User = { 
            id: `user-${Date.now()}`,
            shopId: newShopId, 
            name, 
            password, 
            shopName: shopName!, 
            role: 'Admin',
            merchantId: newMerchantId,
            gstNumber: '', 
            sgstPercentage: 0, 
            cgstPercentage: 0, 
            shopAddress: '', 
            shopLogo: '', 
            shopPhoneNumber: '', 
            isDisabled: false, 
            disabledMessage: '',
            isBannerVisible: false,
            bannerText: ''
        };
        const newUsers = [...users, adminUser];
        setUsers(newUsers);
        localStorage.setItem('zenbill_currentUser', JSON.stringify(adminUser));
        handleSuccessfulLogin(adminUser);
        logActivity(`Shop "${shopName}" created. Admin user "${name}" registered.`, newShopId);
        return null;
    }
  };
  
  const handleLogout = () => {
      if (currentUser && currentUser.role !== 'SuperAdmin' && !currentUser.isDisabled) {
        logActivity(`${currentUser.name} logged out.`, currentUser.shopId);
      }
      setCurrentUser(null);
      setCurrentView(View.LOGIN);
      localStorage.removeItem('zenbill_currentUser');
  };

  const handleUpdateCustomer = (userId: string, updates: Partial<Pick<User, 'isDisabled' | 'disabledMessage' | 'isBannerVisible' | 'bannerText'>>) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    let activityDescription = `Super Admin updated settings for ${userToUpdate.shopName}.`;
    if(updates.isDisabled !== undefined) {
        activityDescription = `Super Admin ${updates.isDisabled ? 'disabled' : 'enabled'} account for ${userToUpdate.shopName}.`
    }
     if(updates.isBannerVisible !== undefined) {
        activityDescription = `Super Admin ${updates.isBannerVisible ? 'enabled' : 'disabled'} the announcement banner for ${userToUpdate.shopName}.`
    }

    const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, ...updates } : u
    );
    setUsers(updatedUsers);
    logActivity(activityDescription, 'super-admin-hq');
  };

  const handleSuperAdminAddUser = (customerAdmin: User, newUser: Omit<User, 'id'| 'shopId' | 'shopName'>) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin') return;
    
    const user: User = { 
        ...newUser,
        id: `user-${Date.now()}`,
        shopId: customerAdmin.shopId,
        shopName: customerAdmin.shopName,
    };
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    logActivity(`Super Admin added new user: ${user.name} (${user.role}) to shop ${customerAdmin.shopName}.`, 'super-admin-hq');
  };

  const handleSuperAdminRemoveUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin') return;

    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    logActivity(`Super Admin removed user: ${userToRemove.name} from shop ${userToRemove.shopName}.`, 'super-admin-hq');
  }

  // --- Settings Handlers ---
  const handleUpdateProfile = (name: string, shopName: string, gstNumber: string, sgstPercentage: number, cgstPercentage: number, shopAddress: string, shopLogo: string, shopPhoneNumber: string) => {
    if (!currentUser || currentUser.role !== 'Admin') return;

    const updatedUsers = users.map(u => {
      if (u.shopId !== currentUser.shopId) return u;
      const updatedUser = { ...u, shopName, gstNumber, sgstPercentage, cgstPercentage, shopAddress, shopLogo, shopPhoneNumber };
      if (u.id === currentUser.id) {
        updatedUser.name = name;
      }
      return updatedUser;
    });

    setUsers(updatedUsers);
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem('zenbill_currentUser', JSON.stringify(updatedCurrentUser));
    logActivity('Shop profile and tax settings were updated.', currentUser.shopId);
  };
  
  const handleAddUser = (newUser: Omit<User, 'id'| 'shopId' | 'shopName'>) => {
    if (!currentUser) return;
    const user: User = { 
        ...newUser,
        id: `user-${Date.now()}`,
        shopId: currentUser.shopId,
        shopName: currentUser.shopName,
        merchantId: currentUser.merchantId,
        gstNumber: currentUser.gstNumber,
        sgstPercentage: currentUser.sgstPercentage,
        cgstPercentage: currentUser.cgstPercentage,
        shopAddress: currentUser.shopAddress,
        shopLogo: currentUser.shopLogo,
        shopPhoneNumber: currentUser.shopPhoneNumber,
    };
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    logActivity(`Added new user: ${user.name} (${user.role}).`, currentUser.shopId);
  };
  
  const handleRemoveUser = (userId: string) => {
    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove || userToRemove.shopId !== currentUser?.shopId) return;
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    logActivity(`Removed user: ${userToRemove.name}.`, currentUser!.shopId);
  };

  // --- Product Handlers ---
  const handleAddProduct = (product: Omit<Product, 'id'|'shopId'>) => {
    if (!currentUser) return;
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      shopId: currentUser.shopId,
    };
    setProducts(prev => [...prev, newProduct]);
    logActivity(`Added new product: ${newProduct.name} (Stock: ${newProduct.stock}, Price: ₹${newProduct.price}).`, currentUser.shopId);
  };

  const handleDeleteProduct = (productId: string) => {
    const productToDelete = products.find(p => p.id === productId && p.shopId === currentUser?.shopId);
    if (productToDelete) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        logActivity(`Deleted product: ${productToDelete.name}.`, currentUser!.shopId);
    }
  };

  const handleUpdateProduct = (productId: string, newStock: number) => {
    const productToUpdate = products.find(p => p.id === productId && p.shopId === currentUser?.shopId);
    if(productToUpdate) {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === productId ? { ...p, stock: newStock } : p
          )
        );
        logActivity(`Updated stock for ${productToUpdate.name} to ${newStock}.`, currentUser!.shopId);
    }
  };
  
  const handleProcessCsvImport = (
    productsToCreate: Omit<Product, 'id' | 'shopId'>[],
    productsToUpdate: { id: string, stock: number }[]
  ) => {
      if (!currentUser) return;

      const newProducts: Product[] = productsToCreate.map(p => ({
        ...p,
        id: `prod-${Date.now()}-${Math.random()}`,
        shopId: currentUser.shopId
      }));

      const updatedProductIds = new Set(productsToUpdate.map(p => p.id));
      const productsMap = new Map(productsToUpdate.map(p => [p.id, p.stock]));
      
      const updatedProducts = products
        .map(p => {
          if (updatedProductIds.has(p.id)) {
            return { ...p, stock: productsMap.get(p.id)! };
          }
          return p;
        })
        .concat(newProducts);
      
      setProducts(updatedProducts);
      logActivity(`Imported from CSV: ${productsToCreate.length} products created, ${productsToUpdate.length} products updated.`, currentUser.shopId);
  };


  // --- Sales Handlers ---
  const handleCompleteSale = (cartItems: CartItem[], paymentMethod: 'UPI' | 'Card' | 'Cash') => {
      if (!currentUser) return;
      const { sgstPercentage = 0, cgstPercentage = 0 } = currentUser;

      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const sgstAmount = subtotal * (sgstPercentage / 100);
      const cgstAmount = subtotal * (cgstPercentage / 100);
      const total = subtotal + sgstAmount + cgstAmount;
      
      const newSale: Sale = {
          id: `sale-${Date.now()}`,
          shopId: currentUser.shopId,
          items: cartItems,
          subtotal,
          sgstAmount,
          cgstAmount,
          total,
          date: new Date().toISOString(),
          paymentMethod,
      };
      setSales(prev => [newSale, ...prev]);
      
      setProducts(prevProducts => {
          const updatedProducts = [...prevProducts];
          cartItems.forEach(cartItem => {
              const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
              if (productIndex !== -1) {
                  updatedProducts[productIndex].stock -= cartItem.quantity;
              }
          });
          return updatedProducts;
      });
      
      logActivity(`Completed sale #${newSale.id.substring(0,8)} for ₹${total.toFixed(2)}.`, currentUser.shopId);
      generateAndPrintInvoice(newSale, currentUser);
      setCurrentView(View.SALES_HISTORY);
  };
  
  const handleDownloadStockReport = () => {
    if (!currentUser) return;
    const reportData = shopData.shopProducts.map(p => ({
        ProductID: p.id,
        Name: p.name,
        Price: p.price.toFixed(2),
        Stock: p.stock,
    }));
    downloadCSV(reportData, `stock-report-${new Date().toISOString().split('T')[0]}.csv`);
    logActivity('Downloaded stock report.', currentUser.shopId);
  };
  
  // --- Ticket Handlers ---
  const handleCreateTicket = (subject: string, message: string) => {
    if (!currentUser) return;
    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      shopId: currentUser.shopId,
      customerId: currentUser.id,
      customerName: currentUser.shopName,
      subject,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        message,
        timestamp: new Date().toISOString(),
      }],
    };
    setTickets(prev => [newTicket, ...prev]);
    logActivity(`New support ticket created: "${subject}"`, currentUser.shopId);
  };

  const handleAddTicketMessage = (ticketId: string, message: string) => {
    if (!currentUser) return;
    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      message,
      timestamp: new Date().toISOString(),
    };
    
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, messages: [...ticket.messages, newMessage], updatedAt: new Date().toISOString(), status: currentUser.role === 'SuperAdmin' ? 'In Progress' : ticket.status }
          : ticket
      )
    );

    const logShopId = currentUser.role === 'SuperAdmin' ? 'super-admin-hq' : currentUser.shopId;
    logActivity(`New reply added to ticket #${ticketId.substring(0,8)}`, logShopId);
  };
  
  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin') return;
     setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
    logActivity(`Super Admin updated status for ticket #${ticketId.substring(0,8)} to ${status}.`, 'super-admin-hq');
  };

  // --- View Rendering ---
  const renderView = () => {
    if (!currentUser) {
        return <LoginView onAuth={handleAuth} />;
    }
    
    switch (currentView) {
      case View.DASHBOARD:
        return <DashboardView sales={shopData.shopSales} products={shopData.shopProducts} currentUser={currentUser} />;
      case View.STOCK:
        return <StockView 
                    products={shopData.shopProducts} 
                    onAddProduct={handleAddProduct} 
                    onDeleteProduct={handleDeleteProduct} 
                    onUpdateProduct={handleUpdateProduct} 
                    onProcessCsvImport={handleProcessCsvImport}
                    onDownloadReport={handleDownloadStockReport}
                />;
      case View.NEW_SALE:
        return <NewSaleView products={shopData.shopProducts} onCompleteSale={handleCompleteSale} sgstPercentage={currentUser.sgstPercentage || 0} cgstPercentage={currentUser.cgstPercentage || 0} />;
      case View.SALES_HISTORY:
        return <SalesHistoryView sales={shopData.shopSales} currentUser={currentUser} />;
      case View.SETTINGS:
          return <SettingsView adminUser={currentUser} allUsers={shopData.shopUsers} onUpdateProfile={handleUpdateProfile} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} />;
      case View.ACTIVITY_LOG:
          return <ActivityLogView activities={shopData.shopActivities} />;
      case View.SUPPORT:
          return <SupportView tickets={shopData.shopTickets} currentUser={currentUser} onCreateTicket={handleCreateTicket} onAddMessage={handleAddTicketMessage} />;
      case View.SUPER_ADMIN_DASHBOARD:
          return <SuperAdminDashboardView 
                  customers={users.filter(u => u.role === 'Admin')} 
                  allUsers={users}
                  tickets={tickets}
                  activities={activities}
                  onUpdateCustomer={handleUpdateCustomer} 
                  onAddUser={handleSuperAdminAddUser}
                  onRemoveUser={handleSuperAdminRemoveUser}
                />;
      case View.SUPER_ADMIN_SUPPORT:
          return <SuperAdminSupportView tickets={tickets} currentUser={currentUser} onAddMessage={handleAddTicketMessage} onUpdateStatus={handleUpdateTicketStatus} />;
      case View.SUPER_ADMIN_ACTIVITY_LOG:
          return <SuperAdminActivityLogView activities={activities.filter(a => a.shopId === 'super-admin-hq')} />;
      default:
        return <DashboardView sales={shopData.shopSales} products={shopData.shopProducts} currentUser={currentUser}/>;
    }
  };

  if (!currentUser) {
      return <LoginView onAuth={handleAuth} />;
  }

  return (
    <div className="flex">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="flex-1 ml-64 bg-background min-h-screen flex flex-col">
          {currentUser.isBannerVisible && !currentUser.isDisabled && (
            <CustomerBanner text={currentUser.bannerText || ''} />
          )}
          <main className="flex-1 p-8">
            {renderView()}
          </main>
      </div>
      {currentUser?.isDisabled && (
        <AccountDisabledOverlay 
            message={currentUser.disabledMessage || 'Your account has been disabled. Please contact support.'}
            onLogout={handleLogout}
        />
    )}
    </div>
  );
};

export default App;