import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBudgetStore } from '../store/budgetStore';
import { format, subMonths } from 'date-fns';
import axios from 'axios';

export default function MonthlySummary() {
  const { transactions, bills, fetchTransactions, fetchBills } = useBudgetStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [summary, setSummary] = useState({
    income: 0,
    expenditure: 0,
    savings: 0,
  });
  const [expenditureList, setExpenditureList] = useState<any[]>([]);

  // Generate last 12 months for picker
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      label: format(date, 'MMMM yyyy'),
      value: format(date, 'yyyy-MM'),
    };
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    await fetchTransactions();
    await fetchBills();
    calculateSummary();
  };

  const calculateSummary = () => {
    // Filter transactions for selected month
    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(selectedMonth)
    );

    // Calculate income
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get expenses from transactions
    const transactionExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .map((t) => ({
        name: t.description || t.category,
        amount: t.amount,
        status: 'paid',
        type: 'expense',
        category: t.category,
      }));

    // Get bills for selected month
    const monthBills = bills.filter((b) => b.dueDate.startsWith(selectedMonth));
    const billExpenses = monthBills.map((b) => ({
      name: b.name,
      amount: b.amount,
      status: b.isPaid ? 'paid' : 'pending',
      type: 'bill',
      category: b.category,
    }));

    // Combine all expenditures
    const allExpenditures = [...transactionExpenses, ...billExpenses];
    
    // Calculate total expenditure
    const totalExpenditure = allExpenditures.reduce((sum, e) => sum + e.amount, 0);

    // Calculate savings
    const savings = income - totalExpenditure;

    setSummary({
      income,
      expenditure: totalExpenditure,
      savings,
    });

    setExpenditureList(allExpenditures);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Month Selector */}
      <TouchableOpacity
        style={styles.monthSelector}
        onPress={() => setShowMonthPicker(true)}
      >
        <MaterialCommunityIcons name="calendar-month" size={24} color="#6C63FF" />
        <Text style={styles.monthText}>
          {months.find((m) => m.value === selectedMonth)?.label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.summaryCardLabel}>Total Income</Text>
            <Text style={[styles.summaryCardValue, { color: '#4CAF50' }]}>
              ₹{summary.income.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.summaryCardLabel}>Total Expenditure</Text>
            <Text style={[styles.summaryCardValue, { color: '#F44336' }]}>
              ₹{summary.expenditure.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Expenditure Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Expenditure Details</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.nameColumn]}>
              Expenditure
            </Text>
            <Text style={[styles.tableHeaderCell, styles.amountColumn]}>
              Amount
            </Text>
            <Text style={[styles.tableHeaderCell, styles.statusColumn]}>
              Status
            </Text>
          </View>

          {/* Table Rows */}
          {expenditureList.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={48}
                color="#CCC"
              />
              <Text style={styles.emptyStateText}>No expenditure this month</Text>
            </View>
          ) : (
            expenditureList.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
              >
                <Text style={[styles.tableCell, styles.nameColumn]}>
                  {item.name}
                </Text>
                <Text style={[styles.tableCell, styles.amountColumn]}>
                  ₹{item.amount.toFixed(0)}
                </Text>
                <View style={[styles.tableCell, styles.statusColumn]}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'paid'
                        ? styles.statusPaid
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'paid'
                          ? styles.statusTextPaid
                          : styles.statusTextPending,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Total Row */}
          {expenditureList.length > 0 && (
            <>
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.tableCell, styles.nameColumn, styles.totalText]}>
                  Total
                </Text>
                <Text
                  style={[styles.tableCell, styles.amountColumn, styles.totalText]}
                >
                  ₹{summary.expenditure.toFixed(0)}
                </Text>
                <View style={[styles.tableCell, styles.statusColumn]} />
              </View>

              {/* Savings Row */}
              <View style={[styles.tableRow, styles.savingsRow]}>
                <Text style={[styles.tableCell, styles.nameColumn, styles.savingsText]}>
                  Savings
                </Text>
                <Text
                  style={[styles.tableCell, styles.amountColumn, styles.savingsAmount]}
                >
                  ₹{summary.savings.toFixed(0)}
                </Text>
                <View style={[styles.tableCell, styles.statusColumn]} />
              </View>
            </>
          )}
        </View>

        {/* Summary Info */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            Savings = Total Income - Total Expenditure{'\n'}
            Status shows if bills are paid or pending
          </Text>
        </View>
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.monthList}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthItem,
                    selectedMonth === month.value && styles.monthItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(month.value);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthItemText,
                      selectedMonth === month.value && styles.monthItemTextSelected,
                    ]}
                  >
                    {month.label}
                  </Text>
                  {selectedMonth === month.value && (
                    <MaterialCommunityIcons name="check" size={24} color="#6C63FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  monthText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tableContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nameColumn: {
    flex: 2,
  },
  amountColumn: {
    flex: 1,
    textAlign: 'right',
  },
  statusColumn: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 0,
    marginTop: 8,
    borderRadius: 8,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1976D2',
  },
  savingsRow: {
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 0,
    marginTop: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  savingsAmount: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: '#4CAF50',
  },
  statusTextPending: {
    color: '#FF9800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  monthList: {
    maxHeight: 400,
  },
  monthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  monthItemSelected: {
    backgroundColor: '#F0EEFF',
  },
  monthItemText: {
    fontSize: 16,
    color: '#333',
  },
  monthItemTextSelected: {
    fontWeight: 'bold',
    color: '#6C63FF',
  },
});
