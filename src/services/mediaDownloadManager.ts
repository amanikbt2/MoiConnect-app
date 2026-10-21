import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { saveDownloadedPaper } from './offlineStorage';
import {
  showDownloadProgressNotification,
  showDownloadCompleteNotification,
  dismissDownloadNotification,
  registerDownloadCancelHandler
} from './notificationService';
import { getCloudinaryVideoPreviewUrl } from '../components/SmartMediaThumbnail';

export interface ActiveMediaDownload {
  key: string;
  url: string;
  filename: string;
  title: string;
  type: 'video' | 'image' | 'pdf' | 'doc';
  progress: number; // 0 - 100
  bytesWritten: number;
  bytesTotal: number;
  bytesText: string;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  localUri?: string;
  targetPath?: string;
  startTime: number;
}

export type MediaDownloadListener = (downloads: Record<string, ActiveMediaDownload>) => void;

class MediaDownloadManager {
  private activeTasks = new Map<string, FileSystem.DownloadResumable>();
  private activeDownloads = new Map<string, ActiveMediaDownload>();
  private subscribers = new Set<MediaDownloadListener>();
  private cancelledKeys = new Set<string>();

  private notify() {
    const snapshot: Record<string, ActiveMediaDownload> = {};
    this.activeDownloads.forEach((value, key) => {
      snapshot[key] = { ...value };
    });
    this.subscribers.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.warn('[MediaDownloadManager] Listener error:', err);
      }
    });
  }

  public subscribe(listener: MediaDownloadListener): () => void {
    this.subscribers.add(listener);
    const snapshot: Record<string, ActiveMediaDownload> = {};
    this.activeDownloads.forEach((value, key) => {
      snapshot[key] = { ...value };
    });
    listener(snapshot);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  public getActiveDownload(key: string): ActiveMediaDownload | undefined {
    return this.activeDownloads.get(key);
  }

  public isDownloading(key: string): boolean {
    const item = this.activeDownloads.get(key);
    return Boolean(item && item.status === 'downloading');
  }

  public formatBytes(bytes: number): string {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  public getCleanFilename(file: { name?: string; title?: string; url?: string; type?: string }): { filename: string; cleanTitle: string; fileExt: string } {
    const cleanTitle = (file.title || file.name || 'media_attachment')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    
    let fileExt = (file.name || file.url || '').split('?')[0].split('.').pop() || '';
    if (!fileExt || fileExt.length > 5) {
      fileExt = file.type === 'video' ? 'mp4' : file.type === 'image' ? 'jpg' : 'pdf';
    }
    const filename = `${cleanTitle}.${fileExt}`;
    return { filename, cleanTitle, fileExt };
  }

  /**
   * Starts a download in the background without blocking the UI.
   * Callers can fire and forget, while subscribing to progress.
   */
  public async startDownload(file: {
    url: string;
    name?: string;
    title?: string;
    type?: string;
    thumbnail?: string;
    paperId?: string;
    unitCode?: string;
    unitName?: string;
    school?: string;
    author?: string;
    size?: string;
  }): Promise<string> {
    const downloadKey = file.paperId || file.url;
    if (!file.url) {
      throw new Error('Download URL is required.');
    }

    if (this.isDownloading(downloadKey)) {
      return downloadKey;
    }

    this.cancelledKeys.delete(downloadKey);
    const { filename, cleanTitle, fileExt } = this.getCleanFilename(file);
    const kind: 'video' | 'image' | 'pdf' | 'doc' =
      file.type === 'video' ? 'video' : file.type === 'image' ? 'image' : 'pdf';

    // 1. Web Platform download
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (_) {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return downloadKey;
    }

    // 2. Mobile (Android/iOS) Sandboxed Background Download
    const targetPath = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;

    const downloadState: ActiveMediaDownload = {
      key: downloadKey,
      url: file.url,
      filename,
      title: file.title || file.name || filename,
      type: kind,
      progress: 0,
      bytesWritten: 0,
      bytesTotal: 0,
      bytesText: 'Connecting…',
      status: 'downloading',
      targetPath,
      startTime: Date.now()
    };

    this.activeDownloads.set(downloadKey, downloadState);
    this.notify();

    const downloadTask = FileSystem.createDownloadResumable(
      file.url,
      targetPath,
      {},
      (dp) => {
        if (this.cancelledKeys.has(downloadKey)) return;
        const written = dp.totalBytesWritten || 0;
        const total = dp.totalBytesExpectedToWrite || 0;
        const progress = total > 0 ? Math.round((written / total) * 100) : 50;
        const bytesText = total > 0
          ? `${this.formatBytes(written)} / ${this.formatBytes(total)}`
          : this.formatBytes(written);

        const current = this.activeDownloads.get(downloadKey);
        if (current && current.status === 'downloading') {
          current.progress = progress;
          current.bytesWritten = written;
          current.bytesTotal = total;
          current.bytesText = bytesText;
          this.notify();
          void showDownloadProgressNotification(downloadKey, filename, progress, bytesText);
        }
      }
    );

    this.activeTasks.set(downloadKey, downloadTask);

    // Run async in background without blocking the UI thread
    void (async () => {
      try {
        const result = await downloadTask.downloadAsync();

        if (this.cancelledKeys.has(downloadKey)) {
          await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
          return;
        }

        if (!result?.uri) {
          throw new Error('Download could not be completed.');
        }

        // Save safely into offline materials index
        const paperId = file.paperId || `att_${Date.now()}`;
        const computedThumbnail = file.thumbnail
          || (kind === 'video' ? getCloudinaryVideoPreviewUrl(file.url) : (kind === 'image' ? file.url : undefined));

        await saveDownloadedPaper({
          _id: paperId,
          school: file.school || 'Moi University',
          department: file.unitName || file.unitCode || 'Academic Material',
          courseCode: file.unitCode || 'MOI',
          unitCode: file.unitCode || 'MOI',
          unitName: file.unitName || filename,
          type: kind,
          title: file.title || file.name || filename,
          examYear: 2025,
          fileUrl: file.url,
          localUri: result.uri,
          fileType: fileExt,
          thumbnail: computedThumbnail,
          uploadedBy: { _id: 'moi_student', name: file.author || 'Moi Student' } as any,
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch((err) => {
          console.warn('[MediaDownloadManager] saveDownloadedPaper failed:', err);
        });

        const current = this.activeDownloads.get(downloadKey);
        if (current) {
          current.status = 'completed';
          current.progress = 100;
          current.localUri = result.uri;
          this.notify();
        }

        void showDownloadCompleteNotification(downloadKey, filename);

        // Remove from active list after 3 seconds so completed indicator can be seen
        setTimeout(() => {
          this.activeDownloads.delete(downloadKey);
          this.activeTasks.delete(downloadKey);
          this.notify();
        }, 3000);
      } catch (err: any) {
        if (this.cancelledKeys.has(downloadKey)) {
          await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
          return;
        }

        console.warn('[MediaDownloadManager] Download failed:', err?.message || err);
        await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => {});
        void dismissDownloadNotification(downloadKey);

        const current = this.activeDownloads.get(downloadKey);
        if (current) {
          current.status = 'failed';
          current.error = err?.message || 'Download failed';
          this.notify();
        }

        setTimeout(() => {
          this.activeDownloads.delete(downloadKey);
          this.activeTasks.delete(downloadKey);
          this.notify();
        }, 5000);
      }
    })();

    return downloadKey;
  }

  /**
   * Cancels an ongoing media download, cleans up temporary files and notification.
   */
  public async cancelDownload(key: string): Promise<void> {
    this.cancelledKeys.add(key);

    const task = this.activeTasks.get(key);
    if (task) {
      try {
        await task.cancelAsync();
      } catch (_) {}
      this.activeTasks.delete(key);
    }

    const current = this.activeDownloads.get(key);
    if (current?.targetPath) {
      await FileSystem.deleteAsync(current.targetPath, { idempotent: true }).catch(() => {});
    }

    void dismissDownloadNotification(key);

    if (current) {
      current.status = 'cancelled';
      this.notify();
    }

    setTimeout(() => {
      this.activeDownloads.delete(key);
      this.cancelledKeys.delete(key);
      this.notify();
    }, 600);
  }
}

export const mediaDownloadManager = new MediaDownloadManager();

// Wire notification action Cancel button to media download manager
try {
  registerDownloadCancelHandler((key) => {
    void mediaDownloadManager.cancelDownload(key);
  });
} catch (_) {}
