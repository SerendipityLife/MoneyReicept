import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonIcon, IonButton, IonBadge, IonProgressBar 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cloudOfflineOutline, cloudDoneOutline, syncOutline, 
  warningOutline, refreshOutline 
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { OfflineService, SyncStatus } from '../../services/offline.service';
import { I18nService } from '../../services/i18n.service';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-offline-indicator',
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonIcon, IonButton, IonBadge, IonProgressBar
  ]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  syncStatus: SyncStatus = {
    isOnline: true,
    lastSync: null,
    pendingActions: 0,
    syncInProgress: false,
    syncError: null
  };

  private subscriptions: Subscription[] = [];
  showIndicator = false;

  constructor(
    private offlineService: OfflineService,
    public i18nService: I18nService,
    private accessibilityService: AccessibilityService
  ) {
    addIcons({
      cloudOfflineOutline, cloudDoneOutline, syncOutline,
      warningOutline, refreshOutline
    });
  }

  ngOnInit() {
    // Subscribe to sync status changes
    const syncStatusSub = this.offlineService.syncStatus$.subscribe(status => {
      const wasOffline = !this.syncStatus.isOnline;
      const isNowOnline = status.isOnline;
      
      this.syncStatus = status;
      this.updateIndicatorVisibility();
      
      // Announce status changes to screen reader
      if (wasOffline && isNowOnline) {
        this.announceStatusChange('Back online. Syncing data...');
      } else if (!wasOffline && !isNowOnline) {
        this.announceStatusChange('You are now offline. Changes will be saved locally.');
      }
    });

    this.subscriptions.push(syncStatusSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateIndicatorVisibility() {
    // Show indicator when offline or when there are pending actions
    this.showIndicator = !this.syncStatus.isOnline || 
                        this.syncStatus.pendingActions > 0 || 
                        this.syncStatus.syncInProgress ||
                        !!this.syncStatus.syncError;
  }

  onRetrySync() {
    if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
      this.offlineService.syncPendingActions();
      this.announceStatusChange('Retrying sync...');
    }
  }

  onDismissError() {
    // This would typically clear the error state
    // For now, we'll just announce the dismissal
    this.announceStatusChange('Error dismissed');
  }

  private announceStatusChange(message: string) {
    this.accessibilityService.announceToScreenReader(
      this.i18nService.translate('offline.statusChange') + ': ' + message
    );
  }

  getStatusIcon(): string {
    if (!this.syncStatus.isOnline) {
      return 'cloud-offline-outline';
    } else if (this.syncStatus.syncInProgress) {
      return 'sync-outline';
    } else if (this.syncStatus.syncError) {
      return 'warning-outline';
    } else if (this.syncStatus.pendingActions > 0) {
      return 'refresh-outline';
    } else {
      return 'cloud-done-outline';
    }
  }

  getStatusMessage(): string {
    if (!this.syncStatus.isOnline) {
      return this.i18nService.translate('offline.message');
    } else if (this.syncStatus.syncInProgress) {
      return this.i18nService.translate('offline.syncing');
    } else if (this.syncStatus.syncError) {
      return this.i18nService.translate('offline.syncError');
    } else if (this.syncStatus.pendingActions > 0) {
      return this.i18nService.translate('offline.pendingSync', {
        count: this.syncStatus.pendingActions.toString()
      });
    } else {
      return this.i18nService.translate('offline.allSynced');
    }
  }

  getStatusColor(): string {
    if (!this.syncStatus.isOnline) {
      return 'warning';
    } else if (this.syncStatus.syncError) {
      return 'danger';
    } else if (this.syncStatus.syncInProgress || this.syncStatus.pendingActions > 0) {
      return 'primary';
    } else {
      return 'success';
    }
  }

  formatLastSync(): string {
    if (!this.syncStatus.lastSync) {
      return this.i18nService.translate('offline.neverSynced');
    }

    const now = new Date();
    const lastSync = new Date(this.syncStatus.lastSync);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return this.i18nService.translate('offline.justNow');
    } else if (diffMins < 60) {
      return this.i18nService.translate('offline.minutesAgo', { 
        minutes: diffMins.toString() 
      });
    } else if (diffHours < 24) {
      return this.i18nService.translate('offline.hoursAgo', { 
        hours: diffHours.toString() 
      });
    } else {
      return this.i18nService.translate('offline.daysAgo', { 
        days: diffDays.toString() 
      });
    }
  }
}