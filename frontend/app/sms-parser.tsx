import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SMS from 'expo-sms';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

export default function SMSParser() {
  const [smsText, setSmsText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleParseSMS = async () => {
    if (!smsText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter SMS text',
      });
      return;
    }

    setLoading(true);
    setParsedData(null);
    setSaved(false);

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API_URL}/api/parse/sms`, {
        body: smsText,
        date: new Date().toISOString().split('T')[0],
      });

      if (response.data.isTransaction) {
        setParsedData(response.data);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'SMS parsed successfully!',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Not a Transaction',
          text2: 'This SMS does not appear to be a banking transaction',
        });
      }
    } catch (error: any) {
      console.error('Error parsing SMS:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'Failed to parse SMS',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!parsedData) return;

    setLoading(true);

    try {
      const axios = (await import('axios')).default;
      
      // Check if it's UPI payment
      if (parsedData.isUPI) {
        // Save as UPI payment
        await axios.post(`${API_URL}/api/upi-payments`, {
          amount: parsedData.amount,
          recipient: parsedData.merchant,
          upiId: 'N/A',
          date: parsedData.date,
          status: 'completed',
        });
      } else {
        // Save as regular transaction
        await axios.post(`${API_URL}/api/transactions`, {
          type: parsedData.type,
          amount: parsedData.amount,
          category: parsedData.category || 'Bills',
          description: `SMS: ${parsedData.merchant}`,
          date: parsedData.date,
        });
      }

      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: parsedData.isUPI ? 'UPI payment saved!' : 'Transaction saved!',
      });

      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save transaction',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleSMS = () => {
    const samples = [
      'Your A/c X1234 is debited by Rs.2,500.00 on 06-11-24. UPI Ref No: 432165489723. Amazon Pay',
      'Rs 1,250.00 credited to A/c XX5678 on 06-11-2024 by a/c linked to VPA merchant@paytm. UPI Ref: 987654321',
      'Your Credit Card XX9876 has been charged with Rs.5,430.50 at RELIANCE DIGITAL on 06-11-2024',
    ];
    
    Alert.alert(
      'Sample SMS',
      'Select a sample SMS message',
      samples.map((sample, index) => ({
        text: `Sample ${index + 1}`,
        onPress: () => setSmsText(sample),
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SMS Parser</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            Paste your banking SMS message below to automatically extract transaction details.
            Works with debit, credit, and UPI transactions.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>SMS Text</Text>
            <TouchableOpacity onPress={loadSampleSMS}>
              <Text style={styles.sampleLink}>Load Sample</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textArea}
            value={smsText}
            onChangeText={setSmsText}
            placeholder="Paste your banking SMS here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.parseButton, loading && styles.parseButtonDisabled]}
          onPress={handleParseSMS}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="auto-fix" size={20} color="#FFF" />
              <Text style={styles.parseButtonText}>Parse SMS</Text>
            </>
          )}
        </TouchableOpacity>

        {parsedData && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons
                name={parsedData.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={32}
                color={parsedData.type === 'income' ? '#4CAF50' : '#FF6B6B'}
              />
              <Text style={styles.resultTitle}>Transaction Details</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Type:</Text>
              <View
                style={[
                  styles.typeBadge,
                  parsedData.type === 'income' ? styles.incomeBadge : styles.expenseBadge,
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {parsedData.type === 'income' ? 'Credit' : 'Debit'}
                </Text>
              </View>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Amount:</Text>
              <Text style={styles.resultValue}>₹{parsedData.amount.toFixed(2)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Merchant:</Text>
              <Text style={styles.resultValue}>{parsedData.merchant}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Date:</Text>
              <Text style={styles.resultValue}>{parsedData.date}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Category:</Text>
              <Text style={styles.resultValue}>{parsedData.category}</Text>
            </View>

            {parsedData.isUPI && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Payment Method:</Text>
                <View style={styles.upiB badge}>
                  <MaterialCommunityIcons name="bank-transfer" size={16} color="#6C63FF" />
                  <Text style={styles.upiBadgeText}>UPI</Text>
                </View>
              </View>
            )}

            {!saved && (
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSaveTransaction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>
                      Save {parsedData.isUPI ? 'UPI Payment' : 'Transaction'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {saved && (
              <View style={styles.savedIndicator}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.savedText}>Saved successfully!</Text>
              </View>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0EEFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sampleLink: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
  },
  parseButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  parseButtonDisabled: {
    opacity: 0.6,
  },
  parseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  incomeBadge: {
    backgroundColor: '#E8F5E9',
  },
  expenseBadge: {
    backgroundColor: '#FFEBEE',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EEFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upiBadgeText: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
    marginLeft: 6,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  savedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
