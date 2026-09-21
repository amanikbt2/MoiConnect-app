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
import { ChevronDownIcon, TrashIcon, BookIcon, ShieldCheckIcon } from '../src/components/Icons';

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
    answer: 'MoiConnect provides two simple methods to request the deletion of your account and personal data:\n\n1. In-App Deletion (Instant):\nOpen the Profile tab in the app -> scroll to the bottom -> tap "Delete Account" next to Sign Out -> confirm deletion. Your account profile, saved items, and credentials will be immediately purged.\n\n2. Email Request:\nIf you cannot access the app, send an email to amanikbt1@gmail.com with the subject "Account Deletion Request" from your registered email address. Please include your full name and registered phone number. All email deletion requests are processed within 5 business days.',
    iconTag: '🗑️'
  },
  {
    id: 'what_data_deleted',
    category: 'Account & Data Privacy',
    question: 'What user data is deleted or retained upon request?',
    answer: 'Upon receiving your account deletion request, the following data is permanently purged from our database:\n\n• Personal Profile: Name, registered email address, phone number, and password hashes.\n• User Content: Profile picture, saved offline bookmarks, and private landlord message history.\n• Verification Records: Landlord application details and identity documents.\n\nNote: Publicly uploaded academic past papers/notes will remain on the platform to maintain community access, but will be completely anonymized to disassociate your identity.',
    iconTag: '🔒'
  },
  {
    id: 'revision_notes',
    category: 'Academic Resources',
    question: 'How do I access and download past papers or notes?',
    answer: 'Navigate to the Academics tab or click Quick Access cards (Notes PDF, Past Papers, CAT Papers) on the Home Screen. You can search by unit code (e.g. COM 310, STA 210) and read materials instantly in the lightning PDF viewer or tap Download to save them for offline access.',
    iconTag: '📚'
  },
  {
    id: 'offline_downloads',
    category: 'Downloads & Storage',
    question: 'Where are my downloaded materials saved?',
    answer: 'All downloaded past papers and lecture summaries appear in the Downloads tab. You can view real-time download progress, pin important papers to the top of your list, or tap the 3-dots menu (⋮) -> "Wipe from Device Storage" to completely clear files and free up phone space.',
    iconTag: '⚡'
  },
  {
    id: 'rewards_points',
    category: 'Rewards & Contributions',
    question: 'How do student reward points work?',
    answer: 'You receive +5 bonus points upon account registration. You can earn +10 points for every approved past paper or study guide you upload. Points can be tracked on your profile and redeemed for campus benefits.',
    iconTag: '🌟'
  },
  {
    id: 'hostel_bookings',
    category: 'Rental Marketplace',
    question: 'How do I contact landlords for Kesses hostels?',
    answer: 'Browse available rentals under the Rentals tab, view room pricing, amenities, and location details. Tap "Call Landlord" or "WhatsApp Landlord" to communicate directly with verified property owners.',
    iconTag: '🏠'
  }
];

export default function FAQScreen() {
  const router = useAppNavigation();
  const [expandedId, setExpandedId] = useState<string | null>('delete_account');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconCircle}>
            <Text style={{ fontSize: 28 }}>❓</Text>
          </View>
          <Text style={styles.appTitle}>MoiConnect Support</Text>
          <Text style={styles.pageTitle}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>
            Find quick answers on account management, data deletion, downloads, and campus services.
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
            <Text style={styles.deletionBannerTitle}>Need to Delete Your Account?</Text>
          </View>
          <Text style={styles.deletionBannerText}>
            Go to Profile → tap "Delete Account" next to Sign Out, or tap here to read step-by-step instructions.
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

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
    padding: 22,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
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
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  deletionBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#dc2626'
  },
  deletionBannerText: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18
  },
  faqList: {
    gap: 12
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  faqCardExpanded: {
    borderColor: '#bfdbfe',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  questionText: {
    fontSize: 15,
    fontWeight: '800',
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
    lineHeight: 21
  },
  backButton: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
