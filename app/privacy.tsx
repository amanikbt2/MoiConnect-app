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
import { useTheme } from '../src/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { isDark, colors } = useTheme();
  const router = useAppNavigation();
  const contactEmail = 'amanikbt1@gmail.com';
  const lastUpdated = 'October 30, 2026';

  return (
    <SafeAreaView style={[styles.safeContainer, isDark && { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.container, isDark && { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={[styles.headerCard, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.iconCircle}>
            <ShieldCheckIcon color="#15803d" size={32} />
          </View>
          <Text style={[styles.appBadge, isDark && { color: colors.text }]}>Official Privacy Document</Text>
          <Text style={[styles.appTitle, isDark && { color: colors.text }]}>MConnect</Text>
          <Text style={[styles.packageId, isDark && { color: colors.text }]}>com.amanikbt1.moiconnect</Text>
          <Text style={[styles.lastUpdated, isDark && { color: colors.text }]}>Last Updated: {lastUpdated}</Text>
        </View>

        {/* 1. Introduction */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>1. Introduction & Developer Identity</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            Welcome to <Text style={[styles.bold, isDark && { color: colors.text }]}>MConnect</Text> ("we", "our", or "us"), an academic resource sharing, student housing connection, and campus collaboration platform developed for university students. We are fully committed to protecting your privacy in compliance with Google Play Developer Policies and applicable data protection regulations (including the Kenya Data Protection Act, 2019 and GDPR standards).
          </Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            This Privacy Policy explains what information we collect, why we collect it, how sensitive device permissions are utilized, our strict data sharing policies, and the transparent mechanisms provided to manage or permanently delete your account and personal data.
          </Text>
        </View>

        {/* 2. Information We Collect */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>2. Information We Collect</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            We collect only the minimum personal and usage data necessary to deliver core platform services:
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Account Credentials & Profile Details:</Text> Full name, student or landlord email address, phone number (used for rental house inquiry contact), role selection (Student or Landlord), and secure cryptographically hashed passwords.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Google Sign-In Profile Data:</Text> When you authenticate via Google Sign-In, we receive your verified Google account email, display name, and avatar link provided by Google Identity Services to streamline authentication.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Academic Resources & Study Content:</Text> Course codes, unit names, exam year, and user-submitted revision past papers or Continuous Assessment Tests (CATs) uploaded to assist campus peers.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Rental Housing & Booking Data:</Text> Hostel booking inquiries, housing preferences, landlord property listings (room details, amenities, pricing, property photos), and verification records.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>In-App Messages & Community Discussion:</Text> Direct messaging between students and verified landlords, and public campus community discussion posts.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Technical & Diagnostics Data:</Text> Network connection status, device model, operating system version, and anonymous crash telemetry used exclusively to maintain stability and performance.
          </Text>
        </View>

        {/* 3. Sensitive Permissions & Hardware Access */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>3. Sensitive Permissions & Hardware Access</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            In accordance with Google Play's Sensitive Permissions Policy, we explicitly disclose why each sensitive hardware permission is requested and how the data is handled:
          </Text>
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, isDark && { color: colors.text }]}>CAMERA (Camera Access)</Text>
            <Text style={[styles.permissionDesc, isDark && { color: colors.text }]}>
              Used for real-time video calls with verified landlords or study groups, capturing user profile pictures, and taking photos of revision documents or rental listings. <Text style={[styles.bold, isDark && { color: colors.text }]}>Video streams are transmitted live via WebRTC and are NEVER recorded, monitored, or stored on our servers.</Text>
            </Text>
          </View>
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, isDark && { color: colors.text }]}>RECORD_AUDIO & AUDIO SETTINGS (Microphone)</Text>
            <Text style={[styles.permissionDesc, isDark && { color: colors.text }]}>
              Used for real-time voice calls and audio notes, as well as routing audio dynamically to speakerphones, earpieces, or connected Bluetooth headsets. <Text style={[styles.bold, isDark && { color: colors.text }]}>Voice call audio is streamed in real-time and is NEVER recorded, listened to, or stored.</Text>
            </Text>
          </View>
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, isDark && { color: colors.text }]}>POST_NOTIFICATIONS (Push Notifications)</Text>
            <Text style={[styles.permissionDesc, isDark && { color: colors.text }]}>
              Delivers instant alerts for incoming voice/video calls, new direct messages from landlords or classmates, and critical academic updates. Can be disabled at any time in system settings.
            </Text>
          </View>
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, isDark && { color: colors.text }]}>SYSTEM_ALERT_WINDOW (Incoming Call Banner)</Text>
            <Text style={[styles.permissionDesc, isDark && { color: colors.text }]}>
              Displays an incoming call alert overlay banner on the screen when a call is received while using other apps.
            </Text>
          </View>
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, isDark && { color: colors.text }]}>INTERNET & NETWORK STATE</Text>
            <Text style={[styles.permissionDesc, isDark && { color: colors.text }]}>
              Enables secure API communication over HTTPS/TLS, real-time messaging, and downloading approved academic papers.
            </Text>
          </View>
          <View style={styles.subNoteBox}>
            <Text style={[styles.subNoteText, isDark && { color: colors.text }]}>
              <Text style={[styles.bold, isDark && { color: colors.text }]}>Note on Storage:</Text> MConnect does NOT request broad external storage access. All photo and document selections are handled safely through the native Android system file and media pickers.
            </Text>
          </View>
        </View>

        {/* 4. How We Use Information */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>4. How We Use Information</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            Your information is processed strictly for legitimate operational purposes:
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• Authenticating accounts, preventing fraudulent signups, and maintaining platform security.</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• Enabling students to search, view, and download academic past papers and revision notes.</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• Connecting students with verified hostel landlords and facilitating direct property inquiries.</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• Delivering real-time voice and video communication and instant messaging.</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• Distributing push notifications for important messages and incoming calls.</Text>
        </View>

        {/* 5. Third-Party Services & SDKs */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>5. Third-Party SDKs & Service Providers</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            MConnect integrates trusted third-party service providers strictly to deliver core technical functions:
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Google Identity & Play Services:</Text> Secure Google Sign-In authentication and base mobile services.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>LiveKit Cloud (WebRTC):</Text> Real-time peer-to-peer and relayed audio and video calling. Call media is ephemeral and end-to-end encrypted in transit.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Cloudinary:</Text> Secure cloud storage for user-uploaded profile avatars, document assets, and landlord house photos.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Socket.io:</Text> Real-time chat messaging, presence indicators, and call signaling.
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>
            • <Text style={[styles.bold, isDark && { color: colors.text }]}>Expo Application Services (EAS):</Text> Mobile application packaging and secure update delivery.
          </Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            We do not allow any third-party SDK partner to access or utilize student data for cross-service profiling, advertising, or marketing.
          </Text>
        </View>

        {/* 6. Zero Sale of Personal Data */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>6. Zero Sale of Personal Data</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            <Text style={[styles.bold, isDark && { color: colors.text }]}>MConnect does NOT sell, rent, monetize, or trade your personal information</Text> with data brokers, advertisers, or third-party marketing companies. We do not participate in cross-app behavioral tracking or serve personalized targeted advertisements.
          </Text>
        </View>

        {/* 7. Data Security Practices */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>7. Data Security Practices</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            We implement industry-standard administrative, physical, and technical security measures to protect user data:
          </Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• <Text style={[styles.bold, isDark && { color: colors.text }]}>Encryption in Transit:</Text> All communications between the app and our servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• <Text style={[styles.bold, isDark && { color: colors.text }]}>Password Hashing:</Text> Passwords are cryptographically salted and hashed using standard bcrypt algorithms before database storage.</Text>
          <Text style={[styles.bulletPoint, isDark && { color: colors.text }]}>• <Text style={[styles.bold, isDark && { color: colors.text }]}>Stateless Token Authentication:</Text> User sessions are authorized using secure JSON Web Tokens (JWT) stored in protected device storage.</Text>
        </View>

        {/* 8. Account Deletion & User Data Rights */}
        <View style={[styles.section, styles.highlightBox, isDark && { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text style={[styles.highlightHeading, isDark && { color: colors.text }]}>8. Account Deletion & User Data Rights</Text>
          <Text style={[styles.highlightParagraph, isDark && { color: colors.text }]}>
            In strict compliance with Google Play's Account Deletion Policy, users have the complete right to permanently delete their account and associated personal data at any time. We provide two easy methods:
          </Text>

          <Text style={[styles.subHeading, isDark && { color: colors.text }]}>Method 1: In-App Account Deletion (Instant)</Text>
          <Text style={[styles.stepText, isDark && { color: colors.text }]}>1. Open the MConnect app and sign in.</Text>
          <Text style={[styles.stepText, isDark && { color: colors.text }]}>2. Navigate to the Profile tab.</Text>
          <Text style={[styles.stepText, isDark && { color: colors.text }]}>3. Tap the three dots (⋮) menu in the top-right corner.</Text>
          <Text style={[styles.stepText, isDark && { color: colors.text }]}>4. Select "Delete account".</Text>
          <Text style={[styles.stepText, isDark && { color: colors.text }]}>5. Confirm your decision. Your account and personal records are instantly and permanently purged from our database.</Text>

          <Text style={[styles.subHeading, { marginTop: 14 }]}>Method 2: Web & Email Deletion Request</Text>
          <Text style={[styles.highlightParagraph, isDark && { color: colors.text }]}>
            If you have uninstalled the app or cannot log in, send an email to <Text style={[styles.bold, isDark && { color: colors.text }]}>{contactEmail}</Text> with the subject line "Account Deletion Request" from your registered email address. Requests are validated and permanently executed within 5 business days.
          </Text>

          <Text style={[styles.subHeading, { marginTop: 14 }]}>What Data is Permanently Deleted:</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• Personal identity details (Full Name, Email address, Phone number, and Password hashes).</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• User profile avatar images stored on cloud servers.</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• Landlord property listings, rooms, pricing, and uploaded property images.</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• Private direct chat messages, call records, and conversation history.</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• Hostel booking requests, inquiries, and saved favorites.</Text>
          <Text style={[styles.bulletPointDark, isDark && { color: colors.text }]}>• Push notification device tokens.</Text>

          <Text style={[styles.subHeading, { marginTop: 14 }]}>Data Retention / Community Anonymization:</Text>
          <Text style={[styles.highlightParagraph, isDark && { color: colors.text }]}>
            Academic revision documents (past papers and CAT notes) uploaded for public student study access remain available to the campus community to maintain academic continuity; however, all personal author identifiers are permanently detached and anonymized so that the content is completely disassociated from your identity.
          </Text>
        </View>

        {/* 9. Children's Privacy */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>9. Children's Privacy (Under 13 / Minors)</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            MConnect is designed and intended strictly for higher education university and college students (typically aged 18 and older, and no younger than 13). We do not knowingly collect, request, or maintain personal information from children under the age of 13. If we become aware that personal data from a child under 13 has been collected, we will take prompt steps to immediately purge such information from our records.
          </Text>
        </View>

        {/* 10. Regulatory Compliance */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>10. Regulatory Compliance & User Rights</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            Depending on your location, you hold statutory privacy rights including the Right to Access, Right to Rectification (update profile anytime), Right to Erasure (instant account deletion), and Right to Data Portability under the Kenya Data Protection Act, 2019 and GDPR standards.
          </Text>
        </View>

        {/* 11. Contact Us */}
        <View style={[styles.section, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, isDark && { color: colors.text }]}>11. Contact Information</Text>
          <Text style={[styles.paragraph, isDark && { color: colors.text }]}>
            For any inquiries, feedback, privacy concerns, or data rights requests, please contact our designated Data Protection Administrator:
          </Text>
          <View style={[styles.contactCard, isDark && { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.contactLabel, isDark && { color: colors.text }]}>Data Protection & Platform Administrator:</Text>
            <Text style={[styles.contactEmail, isDark && { color: colors.text }]}>{contactEmail}</Text>
            <Text style={[styles.contactSub, isDark && { color: colors.text }]}>MConnect Platform Administration · Moi University Campus</Text>
          </View>
        </View>

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.backButtonText, isDark && { color: colors.text }]}>← Back to App</Text>
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
    marginBottom: 10
  },
  appBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  packageId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
    marginBottom: 4
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
  highlightBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0'
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  highlightHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 10
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 8
  },
  highlightParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#166534',
    marginBottom: 8
  },
  bulletPoint: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    marginLeft: 4,
    marginBottom: 6
  },
  bulletPointDark: {
    fontSize: 13,
    lineHeight: 20,
    color: '#166534',
    marginLeft: 4,
    marginBottom: 6
  },
  stepText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#166534',
    marginLeft: 6,
    marginBottom: 4,
    fontWeight: '500'
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a'
  },
  permissionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  permissionDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569'
  },
  subNoteBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginTop: 6
  },
  subNoteText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#92400e'
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
