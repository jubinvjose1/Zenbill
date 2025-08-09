export type UserRole = 'Admin' | 'Cashier' | 'Accountant' | 'SuperAdmin';

export interface User {
  id: string;
  shopId: string;
  name: string; // This will act as the username
  password?: string; // Required for authentication
  shopName: string;
  role: UserRole;
  merchantId?: string;
  gstNumber?: string;
  sgstPercentage?: number;
  cgstPercentage?: number;
  shopAddress?: string;
  shopLogo?: string; // Will be stored as a base64 data URI
  shopPhoneNumber?: string;
  isDisabled?: boolean;
  disabledMessage?: string;
  isBannerVisible?: boolean;
  bannerText?: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id:string;
  shopId: string;
  items: CartItem[];
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  total: number;
  date: string;
  paymentMethod: 'UPI' | 'Card' | 'Cash';
}

export interface Activity {
  id: string;
  shopId: string;
  timestamp: string;
  description: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  shopId: string;
  customerId: string; // User ID of the customer who created it
  customerName: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}


export enum View {
  LOGIN,
  DASHBOARD,
  STOCK,
  NEW_SALE,
  SALES_HISTORY,
  SETTINGS,
  ACTIVITY_LOG,
  SUPER_ADMIN_DASHBOARD,
  SUPPORT,
  SUPER_ADMIN_SUPPORT,
  SUPER_ADMIN_ACTIVITY_LOG,
}