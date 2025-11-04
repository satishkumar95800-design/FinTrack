import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../../store/budgetStore';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as SMS from 'expo-sms';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Dashboard() {
  const {
    transactions,
    categories,
    bills,
    loading,
    fetchTransactions,
    fetchCategories,
    fetchBills,
    deleteTransaction,
    parseSMS,
    addTransaction,
    addBill,
    parseEmail,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    amountRequired: 0,
    expense: 0,
    balance: 0,
    unpaidBills: 0,
  });
  const [amountRequiredData, setAmountRequiredData] = useState<any>(null);

  useEffect(() => {
    loadData();
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [transactions, bills]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
    }
  };

  const loadData = async () => {
    await fetchTransactions();
    await fetchCategories();
    await fetchBills();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateSummary = () => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Add unpaid bills to expense
    const unpaidBills = bills
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);
    
    const totalExpense = expense + unpaidBills;
    
    setSummary({ 
      income, 
      expense: totalExpense, 
      balance: income - totalExpense,
      unpaidBills 
    });
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Transaction deleted successfully',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete transaction',
              });
            }
          },
        },
      ]
    );
  };

  const scanSMS = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'SMS scanning is only available on Android');
      return;
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'SMS is not available on this device');
      return;
    }

    Alert.alert(
      'SMS Scanner',
      'This feature would scan your SMS messages for banking transactions. Due to platform limitations, please enter transaction details manually or use the receipt scanner.',
      [{ text: 'OK' }]
    );
  };

  const scanEmails = () => {
    Alert.alert(
      'Email Scanner',
      'This feature would scan your emails for credit card bills. Due to platform limitations, please add bills manually from the Bills tab.',
      [{ text: 'OK' }]
    );
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || '💰';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || '#6C63FF';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FinTrack</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/camera')}
        >
          <MaterialCommunityIcons name="camera" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons
              name="arrow-down-circle"
              size={32}
              color="#4CAF50"
            />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
              ₹{summary.income.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
            <MaterialCommunityIcons
              name="arrow-up-circle"
              size={32}
              color="#F44336"
            />
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              ₹{summary.expense.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="wallet" size={32} color="#2196F3" />
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryAmount, { color: '#2196F3' }]}>
              ₹{summary.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-transaction')}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => router.push('/camera')}
          >
            <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
            onPress={scanSMS}
          >
            <MaterialCommunityIcons name="message-text" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#00BCD4' }]}
            onPress={() => router.push('/upi-payments')}
          >
            <MaterialCommunityIcons name="credit-card" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>UPI</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={64}
              color="#CCC"
            />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first transaction to get started
            </Text>
          </View>
        ) : (
          transactions.slice(0, 10).map((transaction) => (
            <View key={transaction._id} style={styles.transactionCard}>
              <View style={styles.transactionIconContainer}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        getCategoryColor(transaction.category) + '20',
                    },
                  ]}
                >
                  <Text style={styles.transactionIconText}>
                    {getCategoryIcon(transaction.category)}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>
                  {transaction.category}
                </Text>
                <Text style={styles.transactionDescription}>
                  {transaction.description || 'No description'}
                </Text>
                <Text style={styles.transactionDate}>
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </Text>
              </View>

              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'income' ? '#4CAF50' : '#F44336',
                    },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}₹
                  {transaction.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(transaction._id!)}
                  style={styles.deleteButton}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconText: {
    fontSize: 24,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
});
