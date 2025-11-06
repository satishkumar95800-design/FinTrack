import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
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
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    calculateAnalytics();
    fetchPocketMoney();
  }, [transactions]);

  const fetchAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await axios.get('/api/analytics/ai-insights');
      setAiInsights(response.data.insights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

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

        {/* AI Financial Advisor */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <MaterialCommunityIcons name="robot" size={28} color="#6C63FF" />
            <Text style={styles.aiTitle}>AI Financial Advisor</Text>
          </View>
          
          {!aiInsights ? (
            <TouchableOpacity
              style={styles.getInsightsButton}
              onPress={fetchAIInsights}
              disabled={loadingInsights}
            >
              {loadingInsights ? (
                <>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.getInsightsButtonText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFF" />
                  <Text style={styles.getInsightsButtonText}>Get AI Insights</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View>
              {/* Financial Health Score */}
              <View style={styles.healthScoreCard}>
                <Text style={styles.healthScoreLabel}>Financial Health Score</Text>
                <Text style={styles.healthScoreValue}>
                  {aiInsights.financial_health_score}/100
                </Text>
                <View style={styles.healthScoreBar}>
                  <View
                    style={[
                      styles.healthScoreFill,
                      {
                        width: `${aiInsights.financial_health_score}%`,
                        backgroundColor:
                          aiInsights.financial_health_score >= 70
                            ? '#4CAF50'
                            : aiInsights.financial_health_score >= 40
                            ? '#FF9800'
                            : '#F44336',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Loan Payoff Strategy */}
              {aiInsights.loan_payoff_strategy && (
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <MaterialCommunityIcons
                      name="cash-fast"
                      size={24}
                      color="#4CAF50"
                    />
                    <Text style={styles.insightTitle}>Loan Payoff Strategy</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <View style={styles.payoffRow}>
                      <Text style={styles.payoffLabel}>Current Timeline:</Text>
                      <Text style={styles.payoffValue}>
                        {aiInsights.loan_payoff_strategy.current_timeline}
                      </Text>
                    </View>
                    <View style={styles.payoffRow}>
                      <Text style={styles.payoffLabel}>Accelerated:</Text>
                      <Text style={[styles.payoffValue, { color: '#4CAF50' }]}>
                        {aiInsights.loan_payoff_strategy.accelerated_timeline}
                      </Text>
                    </View>
                    <Text style={styles.recommendationText}>
                      💡 {aiInsights.loan_payoff_strategy.recommendation}
                    </Text>
                  </View>
                </View>
              )}

              {/* Savings Opportunities */}
              {aiInsights.savings_opportunities &&
                aiInsights.savings_opportunities.length > 0 && (
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <MaterialCommunityIcons
                        name="piggy-bank"
                        size={24}
                        color="#FF9800"
                      />
                      <Text style={styles.insightTitle}>Savings Opportunities</Text>
                    </View>
                    {aiInsights.savings_opportunities.map((opp: any, index: number) => (
                      <View key={index} style={styles.savingOpportunity}>
                        <View style={styles.savingHeader}>
                          <Text style={styles.savingCategory}>{opp.category}</Text>
                          <Text style={styles.savingAmount}>
                            Save ₹{opp.savings}
                          </Text>
                        </View>
                        <Text style={styles.savingTip}>
                          Current: ₹{opp.current} → Suggested: ₹{opp.suggested}
                        </Text>
                        <Text style={styles.savingTipText}>{opp.tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

              {/* Top Recommendations */}
              {aiInsights.top_recommendations &&
                aiInsights.top_recommendations.length > 0 && (
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <MaterialCommunityIcons
                        name="star-circle"
                        size={24}
                        color="#6C63FF"
                      />
                      <Text style={styles.insightTitle}>Top Recommendations</Text>
                    </View>
                    {aiInsights.top_recommendations.map(
                      (rec: string, index: number) => (
                        <View key={index} style={styles.recommendationItem}>
                          <Text style={styles.recommendationNumber}>
                            {index + 1}
                          </Text>
                          <Text style={styles.recommendationText}>{rec}</Text>
                        </View>
                      )
                    )}
                  </View>
                )}

              {/* Future Projection */}
              {aiInsights.future_projection && (
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <MaterialCommunityIcons
                      name="crystal-ball"
                      size={24}
                      color="#2196F3"
                    />
                    <Text style={styles.insightTitle}>Future Projection</Text>
                  </View>
                  <View style={styles.projectionItem}>
                    <Text style={styles.projectionLabel}>In 6 Months:</Text>
                    <Text style={styles.projectionText}>
                      {aiInsights.future_projection['6_months']}
                    </Text>
                  </View>
                  <View style={styles.projectionItem}>
                    <Text style={styles.projectionLabel}>In 1 Year:</Text>
                    <Text style={styles.projectionText}>
                      {aiInsights.future_projection['1_year']}
                    </Text>
                  </View>
                </View>
              )}

              {/* Spending Insights */}
              {aiInsights.spending_insights &&
                aiInsights.spending_insights.length > 0 && (
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <MaterialCommunityIcons
                        name="chart-line"
                        size={24}
                        color="#9C27B0"
                      />
                      <Text style={styles.insightTitle}>Spending Insights</Text>
                    </View>
                    {aiInsights.spending_insights.map(
                      (insight: string, index: number) => (
                        <View key={index} style={styles.insightPoint}>
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={20}
                            color="#9C27B0"
                          />
                          <Text style={styles.insightPointText}>{insight}</Text>
                        </View>
                      )
                    )}
                  </View>
                )}

              <TouchableOpacity
                style={styles.refreshInsightsButton}
                onPress={fetchAIInsights}
                disabled={loadingInsights}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#6C63FF" />
                <Text style={styles.refreshInsightsText}>Refresh Insights</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Income Card */}
        <View style={styles.incomeSection}>
          <View style={styles.incomeCard}>
            <MaterialCommunityIcons
              name="trending-up"
              size={40}
              color="#4CAF50"
            />
            <View style={styles.incomeContent}>
              <Text style={styles.incomeLabel}>Total Income</Text>
              <Text style={styles.incomeAmount}>
                ₹{summary.income.toFixed(2)}
              </Text>
              <Text style={styles.incomeSubtext}>Current month earnings</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.summaryCards}>
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

            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="wallet" size={32} color="#6C63FF" />
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={[styles.summaryValue, { color: '#6C63FF' }]}>
                ₹{summary.balance.toFixed(2)}
              </Text>
            </View>
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
  pocketMoneySection: {
    padding: 20,
    paddingBottom: 0,
  },
  pocketMoneyCard: {
    backgroundColor: '#6C63FF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pocketMoneyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pocketMoneyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 12,
  },
  pocketMoneyAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  pocketMoneySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  dailySpendableCard: {
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
  dailySpendableLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  dailySpendableAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  dailySpendableSubtext: {
    fontSize: 12,
    color: '#999',
  },
  incomeSection: {
    padding: 20,
    paddingBottom: 0,
  },
  incomeCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeContent: {
    marginLeft: 16,
    flex: 1,
  },
  incomeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  incomeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  incomeSubtext: {
    fontSize: 12,
    color: '#66BB6A',
  },
  aiSection: {
    padding: 20,
    paddingBottom: 0,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  getInsightsButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  getInsightsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  healthScoreCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  healthScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 16,
  },
  healthScoreBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  healthScoreFill: {
    height: '100%',
    borderRadius: 6,
  },
  insightCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  insightContent: {
    gap: 12,
  },
  payoffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  payoffLabel: {
    fontSize: 14,
    color: '#666',
  },
  payoffValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  savingOpportunity: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  savingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  savingCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  savingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  savingTip: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  savingTipText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  recommendationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  projectionItem: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  projectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  projectionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  insightPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightPointText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 8,
  },
  refreshInsightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6C63FF',
    gap: 8,
  },
  refreshInsightsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
});
