import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { DownloadIcon, CheckIcon, StarIcon } from './Icons';

export interface PDFDocumentItem {
  id: string;
  mtid?: string;
  title: string;
  unitCode: string;
  unitName?: string;
  school?: string;
  fileUrl: string;
  pages?: string;
  author?: string;
  summary?: string;
  sampleText?: string;
  downloads?: number | string;
  ratingScore?: number;
  starCount?: number;
}

interface PDFViewerModalProps {
  visible: boolean;
  document: PDFDocumentItem | null;
  onClose: () => void;
  onDownload: (doc: PDFDocumentItem) => void;
}

export function formatCount(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  visible,
  document,
  onClose,
  onDownload
}) => {
  if (!document) return null;

  const [activePage, setActivePage] = useState(1);
  const [downloaded, setDownloaded] = useState(false);

  const handleSave = () => {
    onDownload(document);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {document.unitCode} - {document.title}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
              Lightning PDF Reader • {document.pages || 'PDF Document'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.downloadIconBtn, downloaded && styles.downloadIconBtnSuccess]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            {downloaded ? (
              <CheckIcon color="#ffffff" size={18} />
            ) : (
              <DownloadIcon color="#ffffff" size={18} />
            )}
          </TouchableOpacity>
        </View>

        {/* Instant PDF Preview Container */}
        <View style={styles.bodyContainer}>
          {Platform.OS === 'web' && document.fileUrl && !document.fileUrl.includes('cloudinary.com/mconnect') ? (
            <View style={styles.webViewerWrapper}>
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={document.title}
              />
            </View>
          ) : (
            <ScrollView style={styles.readerScroll} contentContainerStyle={styles.readerContent}>
              {/* Document Cover & Header Card */}
              <View style={styles.docHeaderCard}>
                <View style={styles.docTagRow}>
                  <View style={styles.docCodeBadge}>
                    <Text style={styles.docCodeText}>{document.unitCode}</Text>
                  </View>
                  {!!document.mtid && (
                    <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '800' }}>mtid: {document.mtid}</Text>
                    </View>
                  )}
                  <Text style={styles.docSchool}>{document.school || 'Moi University'}</Text>
                </View>

                <Text style={styles.docMainTitle}>{document.title}</Text>
                {!!document.author && <Text style={styles.docAuthor}>Author: {document.author}</Text>}

                {!!document.summary && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Document Summary:</Text>
                    <Text style={styles.summaryText}>{document.summary}</Text>
                  </View>
                )}
              </View>

              {/* Fast Simulated PDF Page Preview */}
              <View style={styles.pagePreviewContainer}>
                <View style={styles.pageHeader}>
                  <Text style={styles.pageHeaderTitle}>PAGE {activePage} OF 12</Text>
                  <View style={styles.pageControls}>
                    <TouchableOpacity
                      disabled={activePage <= 1}
                      onPress={() => setActivePage((p) => Math.max(1, p - 1))}
                      style={[styles.pageBtn, activePage <= 1 && styles.pageBtnDisabled]}
                    >
                      <Text style={styles.pageBtnText}>‹ Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={activePage >= 12}
                      onPress={() => setActivePage((p) => Math.min(12, p + 1))}
                      style={[styles.pageBtn, activePage >= 12 && styles.pageBtnDisabled]}
                    >
                      <Text style={styles.pageBtnText}>Next ›</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Read-Only PDF Paper Sheet */}
                <View style={styles.paperSheet}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.paperCodeHeader}>MOI UNIVERSITY • {document.unitCode}</Text>
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b' }}>🔒 READ-ONLY PREVIEW</Text>
                    </View>
                  </View>
                  <Text style={styles.paperTitleHeader}>{document.title}</Text>
                  <View style={styles.paperDivider} />

                  <Text style={styles.paperHeading}>1. READ-ONLY PDF PREVIEW CONTENT (Page {activePage})</Text>
                  <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginVertical: 8, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#15803d' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803d', marginBottom: 4 }}>
                      📄 Read-Only Document Excerpt (Testing Mode):
                    </Text>
                    <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
                      {document.sampleText || `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quick test preview words line for ${document.title} (${document.unitCode}).`}
                    </Text>
                  </View>

                  <Text style={styles.paperBodyText}>
                    1.1 Key Concepts: Definition and fundamental principles of {document.unitName || document.unitCode}.{'\n'}
                    1.2 Solved Examples: Worked problem steps and formula applications for semester exams.{'\n'}
                    1.3 Quick Revision: High yield notes compiled for test evaluation and quick review.
                  </Text>

                  <View style={styles.paperNotesBox}>
                    <Text style={styles.paperNotesTitle}>📌 Read-Only Notice:</Text>
                    <Text style={styles.paperNotesBody}>
                      This document is presented in read-only mode for instant preview. Tap the download icon in the header to save offline.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Quick Download CTA */}
              <TouchableOpacity style={styles.bottomDownloadBanner} onPress={handleSave} activeOpacity={0.88}>
                <DownloadIcon color="#ffffff" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.bottomDownloadText}>Download Full PDF Document ({document.pages || 'PDF'})</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 2
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 20
  },
  headerSub: {
    fontSize: 11,
    color: '#dcfce7',
    fontWeight: '500',
    marginTop: 1
  },
  downloadIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4ade80'
  },
  downloadIconBtnSuccess: {
    backgroundColor: '#16a34a'
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  webViewerWrapper: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  readerScroll: {
    flex: 1
  },
  readerContent: {
    padding: 16,
    gap: 16
  },
  docHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  docTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  docCodeBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  docCodeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  docSchool: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  docMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 6
  },
  docAuthor: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    marginBottom: 10
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2
  },
  summaryText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  pagePreviewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden'
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  pageHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5
  },
  pageControls: {
    flexDirection: 'row',
    gap: 8
  },
  pageBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  pageBtnDisabled: {
    opacity: 0.4
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  paperSheet: {
    padding: 20,
    backgroundColor: '#ffffff'
  },
  paperCodeHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1
  },
  paperTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    marginBottom: 12
  },
  paperDivider: {
    height: 2,
    backgroundColor: '#15803d',
    width: 60,
    marginBottom: 16
  },
  paperHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8
  },
  paperBodyText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 16
  },
  paperNotesBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  paperNotesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4
  },
  paperNotesBody: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18
  },
  bottomDownloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10
  },
  bottomDownloadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  }
});
