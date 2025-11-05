import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../../store/budgetStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';

export default function Bills() {
  const { bills, fetchBills, updateBill, deleteBill, addBill } = useBudgetStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    isRecurring: false,
    recurringDay: new Date().getDate(),
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Common bill names
  const commonBillNames = [
    'Electricity Bill',
    'Water Bill',
    'Gas Bill',
    'Internet Bill',
    'Mobile Bill',
    'DTH/Cable Bill',
    'House Rent',
    'Apartment Maintenance',
    'Car EMI',
    'Home Loan EMI',
    'Personal Loan EMI',
    'Credit Card Bill',
    'Insurance Premium',
    'School/College Fee',
    'Gym Membership',
    'Netflix Subscription',
    'Amazon Prime',
    'Spotify Premium',
  ];

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    await fetchBills();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBills();
    setRefreshing(false);
  };

  const handleTogglePaid = async (bill: any) => {
    try {
      await updateBill(bill._id, {
        ...bill,
        isPaid: !bill.isPaid,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update bill');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(id);
            Toast.show({
              type: 'success',
              text1: 'Deleted',
              text2: 'Bill deleted successfully',
            });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to delete bill',
            });
          }
        },
      },
    ]);
  };

  const handleBillNameChange = (text: string) => {
    setNewBill({ ...newBill, name: text });
    
    if (text.length > 0) {
      // Get unique bill names from existing bills
      const existingBillNames = [...new Set(bills.map(b => b.name))];
      
      // Combine common names and existing names
      const allSuggestions = [...commonBillNames, ...existingBillNames];
      
      // Filter based on input
      const filtered = allSuggestions.filter(name =>
        name.toLowerCase().includes(text.toLowerCase())
      );
      
      // Remove duplicates and limit to 5 suggestions
      const uniqueFiltered = [...new Set(filtered)].slice(0, 5);
      
      setFilteredSuggestions(uniqueFiltered);
      setShowSuggestions(uniqueFiltered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setNewBill({ ...newBill, name: suggestion });
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const handleAddBill = async () => {
    if (!newBill.name || !newBill.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addBill({
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        dueDate: newBill.dueDate,
        isPaid: false,
        category: 'Bills',
        reminderSet: false,
        source: 'manual',
        isRecurring: newBill.isRecurring,
        recurringDay: newBill.isRecurring ? newBill.recurringDay : null,
        parentBillId: null,
      });
      setModalVisible(false);
      setNewBill({
        name: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringDay: new Date().getDate(),
      });
      Alert.alert(
        'Success',
        newBill.isRecurring 
          ? 'Recurring bill added successfully! It will auto-generate every month.' 
          : 'Bill added successfully'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add bill');
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bills</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Unpaid Bills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unpaid Bills</Text>
          {unpaidBills.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color="#4CAF50"
              />
              <Text style={styles.emptyStateText}>All bills paid!</Text>
            </View>
          ) : (
            unpaidBills.map((bill) => {
              const daysUntilDue = getDaysUntilDue(bill.dueDate);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

              return (
                <View
                  key={bill._id}
                  style={[
                    styles.billCard,
                    isOverdue && styles.billCardOverdue,
                    isDueSoon && styles.billCardDueSoon,
                  ]}
                >
                  <View style={styles.billIcon}>
                    <MaterialCommunityIcons
                      name="receipt"
                      size={32}
                      color={isOverdue ? '#F44336' : isDueSoon ? '#FF9800' : '#6C63FF'}
                    />
                  </View>

                  <View style={styles.billDetails}>
                    <Text style={styles.billName}>{bill.name}</Text>
                    <Text style={styles.billAmount}>₹{bill.amount.toFixed(2)}</Text>
                    <Text
                      style={[
                        styles.billDueDate,
                        isOverdue && { color: '#F44336' },
                        isDueSoon && { color: '#FF9800' },
                      ]}
                    >
                      {isOverdue
                        ? `Overdue by ${Math.abs(daysUntilDue)} days`
                        : isDueSoon
                        ? `Due in ${daysUntilDue} days`
                        : `Due: ${format(new Date(bill.dueDate), 'MMM dd, yyyy')}`}
                    </Text>
                  </View>

                  <View style={styles.billActions}>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handleTogglePaid(bill)}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => handleDelete(bill._id!)}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={20}
                        color="#F44336"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Paid Bills */}
        {paidBills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paid Bills</Text>
            {paidBills.map((bill) => (
              <View key={bill._id} style={[styles.billCard, styles.billCardPaid]}>
                <View style={styles.billIcon}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={32}
                    color="#4CAF50"
                  />
                </View>

                <View style={styles.billDetails}>
                  <Text style={[styles.billName, { color: '#999' }]}>
                    {bill.name}
                  </Text>
                  <Text style={[styles.billAmount, { color: '#999' }]}>
                    ₹{bill.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.billDueDate}>
                    Paid on {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteIconButton}
                  onPress={() => handleDelete(bill._id!)}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Bill Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Bill Name</Text>
              <TextInput
                style={styles.input}
                value={newBill.name}
                onChangeText={handleBillNameChange}
                placeholder="e.g., Electricity Bill"
                placeholderTextColor="#CCC"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(suggestion)}
                    >
                      <MaterialCommunityIcons
                        name="lightbulb-outline"
                        size={16}
                        color="#6C63FF"
                      />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                value={newBill.amount}
                onChangeText={(text) => setNewBill({ ...newBill, amount: text })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#CCC"
              />

              <Text style={styles.inputLabel}>Due Date</Text>
              <TextInput
                style={styles.input}
                value={newBill.dueDate}
                onChangeText={(text) => setNewBill({ ...newBill, dueDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#CCC"
              />

              <View style={styles.recurringContainer}>
                <View style={styles.recurringLabelContainer}>
                  <MaterialCommunityIcons name="repeat" size={20} color="#6C63FF" />
                  <Text style={styles.recurringLabel}>Recurring Monthly Bill</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    newBill.isRecurring && styles.toggleActive,
                  ]}
                  onPress={() =>
                    setNewBill({ ...newBill, isRecurring: !newBill.isRecurring })
                  }
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      newBill.isRecurring && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {newBill.isRecurring && (
                <View>
                  <Text style={styles.inputLabel}>Recurring Day of Month</Text>
                  <TextInput
                    style={styles.input}
                    value={newBill.recurringDay.toString()}
                    onChangeText={(text) =>
                      setNewBill({
                        ...newBill,
                        recurringDay: parseInt(text) || 1,
                      })
                    }
                    keyboardType="number-pad"
                    placeholder="1-31"
                    placeholderTextColor="#CCC"
                  />
                  <Text style={styles.helperText}>
                    This bill will auto-generate on day {newBill.recurringDay} of every month
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddBill}
              >
                <Text style={styles.submitButtonText}>Add Bill</Text>
              </TouchableOpacity>
            </View>
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
  addButton: {
    backgroundColor: '#6C63FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  billCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  billCardDueSoon: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  billCardPaid: {
    opacity: 0.6,
  },
  billIcon: {
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 4,
  },
  billDueDate: {
    fontSize: 12,
    color: '#999',
  },
  billActions: {
    flexDirection: 'row',
    gap: 8,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
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
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recurringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F0EEFF',
    padding: 16,
    borderRadius: 12,
  },
  recurringLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6C63FF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  helperText: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
