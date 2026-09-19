import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { ShieldCheckIcon } from '../src/components/Icons';

export default function PrivacyPolicyScreen() {
  const router = useAppNavigation();
  const contactEmail = 'amanikbt1@gmail.com';
  const lastUpdated = 'September 19, 2026';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.iconCircle}>
            <ShieldCheckIcon color="#15803d" size={32} />
          </View>
          <Text style={styles.appTitle}>MoiConnect</Text>
          <Text style={styles.pageTitle}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
        </View>

        {/* Policy Body */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to MoiConnect ("we", "our", or "us"). We are committed to protecting the privacy and personal data of our users ("students", "landlords", or "visitors"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information that you voluntarily provide to us when creating an account, browsing resources, or contacting landlords:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Personal Identification:</Text> Name, email address ({contactEmail}), school/department, and role (Student, Landlord, Admin).</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Academic Submissions:</Text> Course codes, unit titles, exam year, and past papers uploaded for academic sharing.</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Rental & Booking Data:</Text> Rental house preferences, hostel booking requests, and messaging communications.</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Technical & Usage Data:</Text> IP address, device identifiers, and offline cache storage parameters.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your information is used strictly to provide, maintain, and improve app functionality, including:
          </Text>
          <Text style={styles.bulletPoint}>• Verifying student and landlord accounts.</Text>
          <Text style={styles.bulletPoint}>• Facilitating academic revision material downloads and uploads.</Text>
          <Text style={styles.bulletPoint}>• Connecting students with verified hostel landlords.</Text>
          <Text style={styles.bulletPoint}>• Enabling community forum chats and message notifications.</Text>
          <Text style={styles.bulletPoint}>• Preventing fraud, unauthorized access, and maintaining campus safety.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>4. Data Sharing & Third Parties</Text>
          <Text style={styles.paragraph}>
            We do <Text style={styles.bold}>NOT</Text> sell, rent, or trade your personal information to third parties or advertisers. Information is shared only in the following limited circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• With landlords when a student explicitly submits a house booking request.</Text>
          <Text style={styles.bulletPoint}>• To comply with legal obligations or enforce our community guidelines.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>5. Data Security & Storage</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security practices including JWT authentication, HTTPS encryption, and secure local token storage to protect your data against unauthorized access, loss, or alteration.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>6. Your Rights & Account Deletion</Text>
          <Text style={styles.paragraph}>
            You have the right to access, update, or request the complete deletion of your account and personal data at any time. To request account deletion or data export, please email us directly at <Text style={styles.linkText}>{contactEmail}</Text>.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>7. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions, concerns, or inquiries regarding this Privacy Policy or data protection practices, please contact our Data Protection Administrator:
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Data Protection Officer / Admin:</Text>
            <Text style={styles.contactEmail}>{contactEmail}</Text>
            <Text style={styles.contactSub}>Moi University Student Services & Platform Support</Text>
          </View>
        </View>

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>← Back to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  container: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 8
  },
  bulletPoint: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    marginLeft: 4,
    marginBottom: 6
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a'
  },
  linkText: {
    fontWeight: '700',
    color: '#15803d'
  },
  contactCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4
  },
  contactSub: {
    fontSize: 12,
    color: '#15803d'
  },
  backButton: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
