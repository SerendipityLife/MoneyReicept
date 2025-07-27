import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';
import { I18nService } from './services/i18n.service';
import { AccessibilityService } from './services/accessibility.service';
import { OfflineService } from './services/offline.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, OfflineIndicatorComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private i18nService: I18nService,
    private accessibilityService: AccessibilityService,
    private offlineService: OfflineService
  ) {}

  ngOnInit() {
    // Initialize services
    this.initializeApp();
  }

  private initializeApp() {
    // Set initial page title
    this.i18nService.setPageTitle('navigation.home');
    
    // Initialize accessibility features
    this.accessibilityService.enableVoiceOverSupport();
    
    // Add skip link for keyboard navigation
    this.addSkipLink();
  }

  private addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = this.i18nService.translate('accessibility.skipToContent');
    skipLink.setAttribute('aria-label', this.i18nService.translate('accessibility.skipToContent'));
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}
