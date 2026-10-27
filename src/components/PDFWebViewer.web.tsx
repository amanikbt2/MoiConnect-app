import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type PDFWebViewerProps = {
  url: string;
  base64?: string | null;
  title: string;
  loading: boolean;
  onPageCount: (count: number) => void;
  onReady: () => void;
  onError: (error: unknown) => void;
};

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

/** PDF.js avoids the browser's native PDF toolbar, which cannot be styled by the app. */
export function PDFWebViewer({ url, base64, title, loading, onPageCount, onReady, onError }: PDFWebViewerProps) {
  const pagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pages = pagesRef.current;
    if (!pages) return;
    pages.replaceChildren();

    const load = async () => {
      try {
        const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
        pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdfjs/pdf.worker.min.js`;
        const source = base64
          ? { data: decodeBase64(base64) }
          : { url, disableRange: true, disableStream: true, disableAutoFetch: true };
        const pdf = await pdfjs.getDocument(source).promise;
        if (cancelled) return;
        onPageCount(pdf.numPages);

        const width = Math.max(320, Math.min(900, pages.clientWidth || window.innerWidth || 680));
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(1.4, (width - 24) / baseViewport.width) });
          const canvas = window.document.createElement('canvas');
          canvas.setAttribute('aria-label', `${title}, page ${pageNumber}`);
          canvas.style.width = `${Math.round(viewport.width)}px`;
          canvas.style.height = `${Math.round(viewport.height)}px`;
          canvas.style.maxWidth = 'calc(100% - 16px)';
          canvas.style.background = '#fff';
          canvas.style.borderRadius = '4px';
          canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,.16)';
          canvas.style.margin = '8px auto';
          canvas.style.display = 'block';
          canvas.width = Math.round(viewport.width * ratio);
          canvas.height = Math.round(viewport.height * ratio);
          pages.appendChild(canvas);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Could not create the PDF page canvas.');
          await page.render({ canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] }).promise;
          if (pageNumber === 1 && !cancelled) onReady();
        }
      } catch (error) {
        if (!cancelled) onError(error);
      }
    };

    void load();
    return () => {
      cancelled = true;
      pages.replaceChildren();
    };
  }, [url, base64, title, onPageCount, onReady, onError]);

  return (
    <View style={styles.wrapper}>
      <View ref={pagesRef as any} style={styles.pages as any} />
      {loading && <View style={styles.loadingHint} pointerEvents="none">
        <ActivityIndicator color="#15803d" />
        <Text style={styles.loadingText}>Preparing pages…</Text>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#e2e8f0', overflow: 'auto' as any },
  pages: { width: '100%', minHeight: '100%', paddingVertical: 8 },
  loadingHint: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.9)' },
  loadingText: { color: '#334155', fontSize: 12, fontWeight: '600' }
});
