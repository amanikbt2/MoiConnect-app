import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useAppNavigation } from '../src/utils/navigation';
import { ChevronDownIcon, TrashIcon, ArrowLeftIcon } from '../src/components/Icons';

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  iconTag?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'delete_account',
    category: 'Account & Data Privacy',
    question: 'How do I request deletion of my account and associated data?',
    answer: 'MConnect provides two convenient methods to request the deletion of your account and personal data:\n\n1. In-App Deletion (Instant):\nOpen the Profile tab in the app -> tap the three-dot menu (⋮) in the top-right corner -> choose "Delete account" -> confirm deletion. Your account profile, saved items, and credentials will be immediately purged.\n\n2. Email Request:\nIf you cannot access the app, send an email to amanikbt1@gmail.com with the subject "Account Deletion Request" from your registered email address. All email deletion requests are processed within 5 business days.',
    iconTag: '🗑️'
  },
  {
    id: 'delete_specific_data',
    category: 'Account & Data Privacy',
    question: 'Can I delete specific data without deleting my entire account?',
    answer: 'Yes! You have full control over individual data items without needing to delete your account:\n\n• Clear Downloaded Papers: Go to Downloads tab -> tap options (⋮) on any file -> select "Delete" to free up device space.\n• Remove Favorites: Simply un-favorite any saved exam paper or hostel to remove it from your records.\n• Landlord Listings: Landlords can edit or delete specific room listings and property photos anytime.\n• Profile Updates: Update your name, phone number, and academic details anytime from the Profile screen.\n• Specific Removal Requests: Email amanikbt1@gmail.com with details of any specific file or comment you want deleted.',
    iconTag: '⚙️'
  },
  {
    id: 'what_data_deleted',
    category: 'Account & Data Privacy',
    question: 'What user data is deleted or retained upon request?',
    answer: 'Upon receiving your account deletion request, the following data is permanently purged from our database:\n\n• Personal Profile: Name, registered email address, phone number, and password hashes.\n• Media Assets: User profile avatar photos stored on cloud servers.\n• Direct Messages: 1-on-1 private messaging history between students and landlords.\n• Booking Records: Rental house booking inquiries and landlord property listings.\n• Device Tokens: Push notification tokens and session authorization tokens.\n\nNote: Publicly uploaded academic past papers/notes remain available to the student community to maintain educational continuity, but will be completely anonymized to disassociate your identity.',
    iconTag: '🔒'
  },
  {
    id: 'permissions',
    category: 'Security & Permissions',
    question: 'Why does MConnect ask for Camera and Microphone permissions?',
    answer: 'Camera and Microphone access are used strictly for optional real-time communication:\n\n• Camera: Optional real-time video calls with landlords or classmates, and taking profile photos or document pictures.\n• Microphone: Optional real-time voice calls and audio notes.\n\nGuarantee: All voice and video calls are streamed live via encrypted WebRTC connections (LiveKit) and are NEVER recorded, listened to, or stored on our servers.',
    iconTag: '📹'
  },
  {
    id: 'data_security',
    category: 'Security & Permissions',
    question: 'How is user data encrypted and protected?',
    answer: 'All communications between MConnect and our backend servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS). Passwords are cryptographically salted and hashed using standard bcrypt algorithms before database storage. We strictly do NOT sell or share personal student information with advertisers or data brokers.',
    iconTag: '🛡️'
  },
  {
    id: 'revision_notes',
    category: 'Academic Resources',
    question: 'How do I access and download past papers or notes?',
    answer: 'Navigate to the Academics tab or click Quick Access cards (Notes PDF, Past Papers, CAT Papers) on the Home Screen. You can search by unit code (e.g. COM 310, STA 210, BBM 101) and read materials instantly in the lightning PDF viewer or tap Download to save them for offline access.',
    iconTag: '📚'
  },
  {
    id: 'offline_downloads',
    category: 'Downloads & Storage',
    question: 'Where are my downloaded materials saved?',
    answer: 'All downloaded past papers and lecture summaries appear in the Downloads tab. You can view real-time download progress, pin important papers to the top of your list, or tap the 3-dots menu (⋮) -> "Delete" to remove saved files from the device.',
    iconTag: '⚡'
  },
  {
    id: 'hostel_bookings',
    category: 'Rental Marketplace',
    question: 'How do I contact landlords for Kesses hostels?',
    answer: 'Browse available rentals under the Rentals tab, view room pricing, amenities, and location details. Tap "Call Landlord" or "WhatsApp Landlord" to communicate directly with verified property owners.',
    iconTag: '🏠'
  },
  {
    id: 'rewards_points',
    category: 'Rewards & Contributions',
    question: 'How do student reward points work?',
    answer: 'You receive bonus points upon account registration. Each approved past paper or study guide earns reward points. Points can be tracked on your profile and may unlock student rewards at published milestones.',
    iconTag: '🌟'
  }
];

export default function FAQScreen() {
  const router = useAppNavigation();
  const [expandedId, setExpandedId] = useState<string | null>('delete_account');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header Bar */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity style={styles.topBackBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeftIcon color="#0f172a" size={20} />
          <Text style={styles.topBackBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconCircle}>
            <Text style={{ fontSize: 28 }}>❓</Text>
          </View>
          <Text style={styles.appTitle}>MConnect Support</Text>
          <Text style={styles.pageTitle}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>
            Find official guidance on account management, data privacy, sensitive permissions, downloads, and campus services.
          </Text>
        </View>

        {/* Highlighted Account Deletion Quick Banner */}
        <TouchableOpacity
          style={styles.deletionBanner}
          onPress={() => setExpandedId('delete_account')}
          activeOpacity={0.88}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <TrashIcon color="#dc2626" size={20} />
            <Text style={styles.deletionBannerTitle}>Need to Delete Your Account or Data?</Text>
          </View>
          <Text style={styles.deletionBannerText}>
            Go to Profile -&gt; tap the three-dot menu in the top-right corner -&gt; choose "Delete account", or tap here to read step-by-step instructions.
          </Text>
        </TouchableOpacity>

        {/* Accordion FAQ Items */}
        <View style={styles.faqList}>
          {FAQ_DATA.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View style={[styles.faqCard, isExpanded && styles.faqCardExpanded]} key={item.id}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                    {!!item.iconTag && <Text style={{ fontSize: 18 }}>{item.iconTag}</Text>}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                      <Text style={styles.questionText}>{item.question}</Text>
                    </View>
                  </View>
                  <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                    <ChevronDownIcon color="#64748b" size={20} />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Support Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need assistance?</Text>
          <Text style={styles.contactText}>
            Our student platform team is here to assist you with account verification, study material uploads, or privacy queries.
          </Text>
          <Text style={styles.contactEmail}>amanikbt1@gmail.com</Text>
        </View>

        {/* Bottom Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
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
  topHeaderBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  topBackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  container: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  appTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  },
  deletionBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  deletionBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d'
  },
  deletionBannerText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18
  },
  faqList: {
    marginBottom: 16
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  faqCardExpanded: {
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  answerText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  contactText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d'
  },
  backButton: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
