import React from 'react';
import { View } from 'react-native';

type PDFWebViewerProps = {
  url: string;
  base64?: string | null;
  title: string;
  loading: boolean;
  onPageCount: (count: number) => void;
  onReady: () => void;
  onError: (error: unknown) => void;
};

// Native builds render PDFs in the app's WebView; the canvas renderer is web-only.
export function PDFWebViewer(_props: PDFWebViewerProps) {
  return <View style={{ flex: 1 }} />;
}
