import { create } from 'zustand';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get API URL based on platform
const getApiUrl = () => {
  // For web, use relative URL (proxied by nginx)
  if (Platform.OS === 'web') {
    return '';
  }
  
  // For mobile (iOS/Android), use full backend URL
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 
                     process.env.EXPO_PUBLIC_BACKEND_URL || 
                     'https://expense-tracker-1322.preview.emergentagent.com';
  
  return backendUrl;
};

const API_URL = getApiUrl();

console.log('API_URL configured as:', API_URL);

interface Transaction {
  _id?: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  imageBase64?: string;
  createdAt?: string;
}

interface Bill {
  _id?: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  category: string;
  reminderSet: boolean;
  source: string;
  createdAt?: string;
}

interface Category {
  _id?: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

interface UPIPayment {
  _id?: string;
  amount: number;
  recipient: string;
  upiId: string;
  date: string;
  status: string;
  createdAt?: string;
}

interface BudgetStore {
  transactions: Transaction[];
  bills: Bill[];
  categories: Category[];
  upiPayments: UPIPayment[];
  loading: boolean;
  
  fetchTransactions: () => Promise<void>;
  fetchBills: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchUPIPayments: () => Promise<void>;
  
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (id: string, bill: Bill) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  scanReceipt: (imageBase64: string) => Promise<any>;
  parseSMS: (body: string, date: string) => Promise<any>;
  parseEmail: (subject: string, body: string, date: string) => Promise<any>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  transactions: [],
  bills: [],
  categories: [],
  upiPayments: [],
  loading: false,
  
  fetchTransactions: async () => {
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/api/transactions`);
      set({ transactions: response.data.transactions, loading: false });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ loading: false });
    }
  },
  
  fetchBills: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bills`);
      set({ bills: response.data.bills });
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  },
  
  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      set({ categories: response.data.categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },
  
  fetchUPIPayments: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/upi-payments`);
      set({ upiPayments: response.data.payments });
    } catch (error) {
      console.error('Error fetching UPI payments:', error);
    }
  },
  
  addTransaction: async (transaction: Transaction) => {
    try {
      const response = await axios.post(`${API_URL}/api/transactions`, transaction);
      set({ transactions: [response.data.transaction, ...get().transactions] });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },
  
  updateTransaction: async (id: string, transaction: Transaction) => {
    try {
      const response = await axios.put(`${API_URL}/api/transactions/${id}`, transaction);
      set({
        transactions: get().transactions.map(t => 
          t._id === id ? response.data.transaction : t
        )
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },
  
  deleteTransaction: async (id: string) => {
    try {
      console.log('Deleting transaction with ID:', id);
      console.log('API URL:', `${API_URL}/api/transactions/${id}`);
      const response = await axios.delete(`${API_URL}/api/transactions/${id}`);
      console.log('Delete response:', response.data);
      set({ transactions: get().transactions.filter(t => t._id !== id) });
      return response.data;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },
  
  addBill: async (bill: Bill) => {
    try {
      const response = await axios.post(`${API_URL}/api/bills`, bill);
      set({ bills: [response.data.bill, ...get().bills] });
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  },
  
  updateBill: async (id: string, bill: Bill) => {
    try {
      const response = await axios.put(`${API_URL}/api/bills/${id}`, bill);
      set({
        bills: get().bills.map(b => 
          b._id === id ? response.data.bill : b
        )
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  },
  
  deleteBill: async (id: string) => {
    try {
      console.log('Deleting bill with ID:', id);
      console.log('API URL:', `${API_URL}/api/bills/${id}`);
      const response = await axios.delete(`${API_URL}/api/bills/${id}`);
      console.log('Delete response:', response.data);
      set({ bills: get().bills.filter(b => b._id !== id) });
      return response.data;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },
  
  scanReceipt: async (imageBase64: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/ocr/receipt`, { imageBase64 });
      return response.data;
    } catch (error) {
      console.error('Error scanning receipt:', error);
      throw error;
    }
  },
  
  parseSMS: async (body: string, date: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/parse/sms`, { body, date });
      return response.data;
    } catch (error) {
      console.error('Error parsing SMS:', error);
      throw error;
    }
  },
  
  parseEmail: async (subject: string, body: string, date: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/parse/email`, { subject, body, date });
      return response.data;
    } catch (error) {
      console.error('Error parsing email:', error);
      throw error;
    }
  },
}));
