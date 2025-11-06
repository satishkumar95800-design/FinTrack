import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

export default function EmailParser() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleParseEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both subject and body',
      });
      return;
    }

    setLoading(true);
    setParsedData(null);
    setSaved(false);

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API_URL}/api/parse/email`, {
        subject: subject,
        body: body,
        date: new Date().toISOString().split('T')[0],
      });

      if (response.data.isBill) {
        setParsedData(response.data);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Email parsed successfully!',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Not a Bill',
          text2: 'This email does not appear to be a credit card bill',
        });
      }
    } catch (error: any) {
      console.error('Error parsing email:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'Failed to parse email',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBill = async () => {
    if (!parsedData) return;

    setLoading(true);

    try {
      const axios = (await import('axios')).default;
      
      await axios.post(`${API_URL}/api/bills`, {
        name: parsedData.billName,
        amount: parsedData.amount,
        dueDate: parsedData.dueDate,
        isPaid: false,
        category: 'Credit Card',
        reminderSet: false,
        source: 'email',
        isRecurring: false,
      });

      setSaved(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Bill saved successfully!',
      });

      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving bill:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save bill',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleEmail = () => {
    Alert.alert(
      'Sample Email',
      'Load a sample credit card statement email?',
      [
        {
          text: 'Load Sample',
          onPress: () => {
            setSubject('Your Chase Credit Card Statement is Ready');
            setBody(`Dear Customer,

Your Chase Sapphire Credit Card statement for January 2025 is now available.

Statement Summary:
- Previous Balance: $842.50
- New Charges: $1,234.75
- Payments Received: $842.50
- Current Balance: $1,234.75

Minimum Payment Due: $25.00
Payment Due Date: February 15, 2025

To avoid interest charges, please pay the full balance by the due date.

Thank you for being a Chase customer.`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Parser</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            Paste your credit card statement email below to automatically extract bill details
            and set payment reminders.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Email Subject</Text>
            <TouchableOpacity onPress={loadSampleEmail}>
              <Text style={styles.sampleLink}>Load Sample</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Credit card statement subject..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Email Body</Text>
          <TextInput
            style={styles.textArea}
            value={body}
            onChangeText={setBody}
            placeholder="Paste email content here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.parseButton, loading && styles.parseButtonDisabled]}
          onPress={handleParseEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="email-search" size={20} color="#FFF" />
              <Text style={styles.parseButtonText}>Parse Email</Text>
            </>
          )}
        </TouchableOpacity>

        {parsedData && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons
                name="credit-card"
                size={32}
                color="#FF6B6B"
              />
              <Text style={styles.resultTitle}>Bill Details</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Bill Name:</Text>
              <Text style={styles.resultValue}>{parsedData.billName}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Amount:</Text>
              <Text style={[styles.resultValue, styles.amountText]}>
                ₹{parsedData.amount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Due Date:</Text>
              <Text style={styles.resultValue}>{parsedData.dueDate}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Category:</Text>
              <Text style={styles.resultValue}>Credit Card</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Status:</Text>
              <View style={styles.unpaidBadge}>
                <Text style={styles.unpaidBadgeText}>Unpaid</Text>
              </View>
            </View>

            {!saved && (
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSaveBill}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save Bill & Set Reminder</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {saved && (
              <View style={styles.savedIndicator}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.savedText}>Bill saved successfully!</Text>
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
    marginBottom: 8,
  },
  sampleLink: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
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
    minHeight: 200,
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
  amountText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  unpaidBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unpaidBadgeText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
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
