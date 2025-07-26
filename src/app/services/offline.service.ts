import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export interface OfflineData {
  receipts: any[];
  receiptItems: any[];
  settings: any;
  lastSync: Date;
}

export interface PendingAction {
  id: string;
  type: 'upload' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: number;
  syncInProgress: boolean;
  syncError: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private readonly STORAGE_KEY = 'offline-data';
  private readonly PENDING_ACTIONS_KEY = 'pending-actions';
  private readonly SYNC_STATUS_KEY = 'sync-status';

  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingActions: 0,
    syncInProgress: false,
    syncError: null
  });

  public isOnline$ = this.isOnlineSubject.asObservable();
  public syncStatus$ = this.syncStatusSubject.asObservable();

  private pendingActions: PendingAction[] = [];
  private offlineData: OfflineData | null = null;

  constructor(private http: HttpClient) {
    this.initializeOfflineSupport();
    this.loadOfflineData();
    this.loadPendingActions();
    this.setupNetworkListeners();
  }

  private initializeOfflineSupport(): void {
    // Register service worker for offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registered successfully:', registration);
        },
        (error) => {
          console.log('Service Worker registration failed:', error);
        }
      );
    }
  }

  private setupNetworkListeners(): void {
    // Listen for online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        distinctUntilChanged(),
        tap(isOnline => {
          this.isOnlineSubject.next(isOnline);
          this.updateSyncStatus({ isOnline });
          
          if (isOnline) {
            this.syncPendingActions();
          }
        })
      )
      .subscribe();
  }

  private loadOfflineData(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.offlineData = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    }
  }

  private saveOfflineData(): void {
    if (this.offlineData) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData));
    }
  }

  private loadPendingActions(): void {
    const stored = localStorage.getItem(this.PENDING_ACTIONS_KEY);
    if (stored) {
      try {
        this.pendingActions = JSON.parse(stored);
        this.updateSyncStatus({ pendingActions: this.pendingActions.length });
      } catch (error) {
        console.error('Error loading pending actions:', error);
      }
    }
  }

  private savePendingActions(): void {
    localStorage.setItem(this.PENDING_ACTIONS_KEY, JSON.stringify(this.pendingActions));
    this.updateSyncStatus({ pendingActions: this.pendingActions.length });
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const current = this.syncStatusSubject.value;
    this.syncStatusSubject.next({ ...current, ...updates });
  }

  // Public API methods
  public isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }

  // Offline data management
  public storeOfflineData(type: keyof OfflineData, data: any[]): void {
    if (!this.offlineData) {
      this.offlineData = {
        receipts: [],
        receiptItems: [],
        settings: null,
        lastSync: new Date()
      };
    }

    this.offlineData[type] = data;
    this.offlineData.lastSync = new Date();
    this.saveOfflineData();
  }

  public getOfflineData(type: keyof OfflineData): any[] | null {
    return this.offlineData ? this.offlineData[type] : null;
  }

  public clearOfflineData(): void {
    this.offlineData = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Pending actions management
  public addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): void {
    const pendingAction: PendingAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0
    };

    this.pendingActions.push(pendingAction);
    this.savePendingActions();
  }

  public removePendingAction(id: string): void {
    this.pendingActions = this.pendingActions.filter(action => action.id !== id);
    this.savePendingActions();
  }

  public getPendingActions(): PendingAction[] {
    return [...this.pendingActions];
  }

  public clearPendingActions(): void {
    this.pendingActions = [];
    this.savePendingActions();
  }

  // Sync operations
  public async syncPendingActions(): Promise<void> {
    if (!this.isOnline() || this.pendingActions.length === 0) {
      return;
    }

    this.updateSyncStatus({ syncInProgress: true, syncError: null });

    const actionsToSync = [...this.pendingActions];
    let successCount = 0;
    let errorCount = 0;

    for (const action of actionsToSync) {
      try {
        await this.executeAction(action);
        this.removePendingAction(action.id);
        successCount++;
      } catch (error) {
        console.error('Error syncing action:', error);
        action.retryCount++;
        
        // Remove action if retry limit exceeded
        if (action.retryCount >= 3) {
          this.removePendingAction(action.id);
        }
        
        errorCount++;
      }
    }

    this.updateSyncStatus({
      syncInProgress: false,
      lastSync: new Date(),
      syncError: errorCount > 0 ? `${errorCount} actions failed to sync` : null
    });

    this.savePendingActions();
  }

  private async executeAction(action: PendingAction): Promise<any> {
    switch (action.type) {
      case 'upload':
        return this.http.post(action.endpoint, action.data).toPromise();
      case 'update':
        return this.http.put(action.endpoint, action.data).toPromise();
      case 'delete':
        return this.http.delete(action.endpoint).toPromise();
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Offline-first HTTP methods
  public offlinePost(endpoint: string, data: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.post(endpoint, data).pipe(
        tap(() => {
          // Update offline cache on successful request
          this.updateOfflineCache(endpoint, data);
        })
      );
    } else {
      // Store action for later sync
      this.addPendingAction({
        type: 'upload',
        endpoint,
        data
      });
      
      // Return mock response for offline mode
      return of({ success: true, offline: true, data });
    }
  }

  public offlinePut(endpoint: string, data: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.put(endpoint, data).pipe(
        tap(() => {
          this.updateOfflineCache(endpoint, data);
        })
      );
    } else {
      this.addPendingAction({
        type: 'update',
        endpoint,
        data
      });
      
      return of({ success: true, offline: true, data });
    }
  }

  public offlineDelete(endpoint: string): Observable<any> {
    if (this.isOnline()) {
      return this.http.delete(endpoint).pipe(
        tap(() => {
          this.removeFromOfflineCache(endpoint);
        })
      );
    } else {
      this.addPendingAction({
        type: 'delete',
        endpoint,
        data: null
      });
      
      return of({ success: true, offline: true });
    }
  }

  public offlineGet(endpoint: string, fallbackData?: any): Observable<any> {
    if (this.isOnline()) {
      return this.http.get(endpoint).pipe(
        tap((data) => {
          // Cache successful GET responses
          this.cacheGetResponse(endpoint, data);
        })
      );
    } else {
      // Return cached data if available
      const cached = this.getCachedResponse(endpoint);
      if (cached) {
        return of(cached);
      } else if (fallbackData) {
        return of(fallbackData);
      } else {
        return of({ error: 'No cached data available', offline: true });
      }
    }
  }

  private updateOfflineCache(endpoint: string, data: any): void {
    // Update relevant offline data based on endpoint
    if (endpoint.includes('/receipts')) {
      const receipts = this.getOfflineData('receipts') || [];
      receipts.push(data);
      this.storeOfflineData('receipts', receipts);
    }
  }

  private removeFromOfflineCache(endpoint: string): void {
    // Remove from offline cache based on endpoint
    if (endpoint.includes('/receipts/')) {
      const id = endpoint.split('/').pop();
      const receipts = this.getOfflineData('receipts') || [];
      const filtered = receipts.filter((receipt: any) => receipt.id !== id);
      this.storeOfflineData('receipts', filtered);
    }
  }

  private cacheGetResponse(endpoint: string, data: any): void {
    const cacheKey = `cache-${endpoint}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  }

  private getCachedResponse(endpoint: string): any {
    const cacheKey = `cache-${endpoint}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if cache is not too old (24 hours)
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      } catch (error) {
        console.error('Error parsing cached response:', error);
      }
    }
    
    return null;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Storage management
  public getStorageUsage(): { used: number; available: number } {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      });
    }
    
    // Fallback estimation
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    return {
      used: used * 2, // Rough estimate (UTF-16)
      available: 5 * 1024 * 1024 // 5MB typical limit
    };
  }

  public clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache-')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Network quality detection
  public getNetworkQuality(): 'slow' | 'fast' | 'unknown' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType) {
        return ['slow-2g', '2g'].includes(connection.effectiveType) ? 'slow' : 'fast';
      }
    }
    return 'unknown';
  }
}