import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../../store/budgetStore';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

export default function Analytics() {
  const { transactions } = useBudgetStore();
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [pocketMoney, setPocketMoney] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    calculateAnalytics();
    fetchPocketMoney();
  }, [transactions]);

  const fetchPocketMoney = async () => {
    try {
      const response = await axios.get('/api/analytics/pocket-money');
      setPocketMoney(response.data);
    } catch (error) {
      console.error('Error fetching pocket money:', error);
    }
  };

  const calculateAnalytics = () => {
    // Calculate totals
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    setSummary({ income, expense, balance: income - expense });

    // Category breakdown
    const categoryMap: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    const pieData = Object.entries(categoryMap).map(([name, value], index) => ({
      value,
      color: colors[index % colors.length],
      text: name,
    }));
    setCategoryData(pieData);

    // Monthly data
    const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyMap[month].income += t.amount;
      } else {
        monthlyMap[month].expense += t.amount;
      }
    });

    const sortedMonths = Object.keys(monthlyMap).sort().slice(-6);
    const barData = sortedMonths.map((month) => ({
      label: month.substring(5),
      value: monthlyMap[month].expense,
      frontColor: '#FF6384',
      spacing: 2,
    }));
    setMonthlyData(barData);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Pocket Money - Prominent Display */}
        {pocketMoney && (
          <View style={styles.pocketMoneySection}>
            <View style={styles.pocketMoneyCard}>
              <View style={styles.pocketMoneyHeader}>
                <MaterialCommunityIcons name="wallet-outline" size={40} color="#FFF" />
                <Text style={styles.pocketMoneyLabel}>Pocket Money</Text>
              </View>
              <Text style={styles.pocketMoneyAmount}>
                ₹{pocketMoney.pocketMoney.toFixed(2)}
              </Text>
              <Text style={styles.pocketMoneySubtext}>
                Available to spend this month
              </Text>
            </View>

            <View style={styles.dailySpendableCard}>
              <MaterialCommunityIcons name="calendar-today" size={32} color="#FF9800" />
              <Text style={styles.dailySpendableLabel}>Daily Spendable</Text>
              <Text style={styles.dailySpendableAmount}>
                ₹{pocketMoney.dailySpendable.toFixed(2)}
              </Text>
              <Text style={styles.dailySpendableSubtext}>
                For next {pocketMoney.daysRemaining} days
              </Text>
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons
                name="trending-up"
                size={32}
                color="#4CAF50"
              />
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                ₹{summary.income.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <MaterialCommunityIcons
                name="trending-down"
                size={32}
                color="#F44336"
              />
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                ₹{summary.expense.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { marginTop: 12 }]}>
            <MaterialCommunityIcons name="wallet" size={32} color="#6C63FF" />
            <Text style={styles.summaryLabel}>Net Balance</Text>
            <Text style={[styles.summaryValue, { color: '#6C63FF' }]}>
              ₹{summary.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Expense by Category</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={categoryData}
                donut
                radius={100}
                innerRadius={60}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelText}>Total</Text>
                    <Text style={styles.centerLabelValue}>
                      ₹{summary.expense.toFixed(0)}
                    </Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legend}>
              {categoryData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendText}>
                    {item.text}: ₹{item.value.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Chart */}
        {monthlyData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Monthly Expenses</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={monthlyData}
                width={screenWidth - 80}
                height={220}
                barWidth={40}
                noOfSections={4}
                barBorderRadius={8}
                frontColor="#FF6384"
                yAxisThickness={0}
                xAxisThickness={0}
              />
            </View>
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={80}
              color="#CCC"
            />
            <Text style={styles.emptyStateText}>No data to display</Text>
            <Text style={styles.emptyStateSubtext}>
              Add transactions to see analytics
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: 14,
    color: '#666',
  },
  centerLabelValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  legend: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
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
