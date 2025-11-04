import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            FinTrack ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.subTitle}>Financial Data</Text>
          <Text style={styles.paragraph}>
            • Transaction records (income and expenses){'\n'}
            • Bill information and payment status{'\n'}
            • Budget and financial goals{'\n'}
            • Category-based spending data{'\n'}
            • Receipt images (processed locally with AI)
          </Text>

          <Text style={styles.subTitle}>Device Information</Text>
          <Text style={styles.paragraph}>
            • Device type and operating system{'\n'}
            • App usage analytics{'\n'}
            • Crash reports and error logs
          </Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            • To provide expense tracking and budget management features{'\n'}
            • To generate financial analytics and insights{'\n'}
            • To send bill payment reminders{'\n'}
            • To improve app functionality and user experience{'\n'}
            • To process receipt images using AI for transaction data extraction
          </Text>

          <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            • All financial data is stored securely on our encrypted servers{'\n'}
            • Receipt images are processed using AI and can be deleted anytime{'\n'}
            • We use industry-standard encryption for data transmission{'\n'}
            • Your data is never shared with third parties without consent{'\n'}
            • We do not sell your personal or financial information
          </Text>

          <Text style={styles.sectionTitle}>5. Permissions</Text>
          <Text style={styles.subTitle}>Camera</Text>
          <Text style={styles.paragraph}>
            Used to scan receipts and extract transaction information using AI. You can deny this permission and add transactions manually.
          </Text>

          <Text style={styles.subTitle}>Notifications</Text>
          <Text style={styles.paragraph}>
            Used to send bill payment reminders. You can disable notifications in your device settings.
          </Text>

          <Text style={styles.subTitle}>Storage</Text>
          <Text style={styles.paragraph}>
            Used to save receipt images temporarily for processing. Images are deleted after extraction unless you choose to keep them.
          </Text>

          <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We use OpenAI's GPT-4 Vision API for receipt scanning and transaction data extraction. Receipt images are processed securely and not stored by the AI service.
          </Text>

          <Text style={styles.sectionTitle}>7. Your Rights</Text>
          <Text style={styles.paragraph}>
            • Access your personal data{'\n'}
            • Request data deletion{'\n'}
            • Export your financial data{'\n'}
            • Opt-out of notifications{'\n'}
            • Withdraw consent at any time
          </Text>

          <Text style={styles.sectionTitle}>8. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your financial data for as long as your account is active. You can request complete data deletion by contacting us or using the delete account feature in the app.
          </Text>

          <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            FinTrack is not intended for users under 13 years of age. We do not knowingly collect personal information from children.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app with an updated "Last Updated" date.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:{'\n\n'}
            Email: support@fintrack.app{'\n'}
            Address: [Your Company Address]
          </Text>

          <Text style={styles.sectionTitle}>12. Compliance</Text>
          <Text style={styles.paragraph}>
            FinTrack complies with applicable data protection regulations including GDPR and CCPA where applicable.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using FinTrack, you agree to this Privacy Policy.
            </Text>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    marginTop: 32,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '600',
  },
});
