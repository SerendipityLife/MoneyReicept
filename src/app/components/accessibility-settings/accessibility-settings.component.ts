import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonToggle, IonSelect, IonSelectOption, IonIcon, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent,
  IonButtons, IonBackButton, IonButton, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  accessibilityOutline, textOutline, contrastOutline, eyeOutline,
  volumeHighOutline, handLeftOutline, radioButtonOnOutline, chatbubbleOutline
} from 'ionicons/icons';
import { AccessibilityService, AccessibilitySettings } from '../../services/accessibility.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-accessibility-settings',
  templateUrl: './accessibility-settings.component.html',
  styleUrls: ['./accessibility-settings.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
    IonToggle, IonSelect, IonSelectOption, IonIcon, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent,
    IonButtons, IonBackButton, IonButton, CommonModule, FormsModule
  ]
})
export class AccessibilitySettingsComponent implements OnInit {
  settings: AccessibilitySettings;
  
  fontSizeOptions = [
    { value: 'small', label: 'accessibility.fontSize.small' },
    { value: 'medium', label: 'accessibility.fontSize.medium' },
    { value: 'large', label: 'accessibility.fontSize.large' },
    { value: 'extra-large', label: 'accessibility.fontSize.extraLarge' }
  ];

  constructor(
    private accessibilityService: AccessibilityService,
    private i18nService: I18nService,
    private toastController: ToastController
  ) {
    addIcons({
      accessibilityOutline, textOutline, contrastOutline, eyeOutline,
      volumeHighOutline, handLeftOutline, radioButtonOnOutline, chatbubbleOutline
    });
    
    this.settings = this.accessibilityService.getSettings();
  }

  ngOnInit() {
    this.i18nService.setPageTitle('accessibility.title');
    
    // Subscribe to settings changes
    this.accessibilityService.settings$.subscribe(settings => {
      this.settings = settings;
    });
  }

  onFontSizeChange() {
    this.accessibilityService.updateSetting('fontSize', this.settings.fontSize);
    this.showToast('accessibility.fontSizeUpdated');
    this.announceChange('Font size changed to ' + this.settings.fontSize);
  }

  onHighContrastToggle() {
    this.accessibilityService.updateSetting('highContrast', this.settings.highContrast);
    this.showToast(this.settings.highContrast ? 'accessibility.highContrastEnabled' : 'accessibility.highContrastDisabled');
    this.announceChange(this.settings.highContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
  }

  onReducedMotionToggle() {
    this.accessibilityService.updateSetting('reducedMotion', this.settings.reducedMotion);
    this.showToast(this.settings.reducedMotion ? 'accessibility.reducedMotionEnabled' : 'accessibility.reducedMotionDisabled');
    this.announceChange(this.settings.reducedMotion ? 'Reduced motion enabled' : 'Reduced motion disabled');
  }

  onScreenReaderToggle() {
    this.accessibilityService.updateSetting('screenReaderSupport', this.settings.screenReaderSupport);
    this.showToast(this.settings.screenReaderSupport ? 'accessibility.screenReaderEnabled' : 'accessibility.screenReaderDisabled');
    this.announceChange(this.settings.screenReaderSupport ? 'Screen reader support enabled' : 'Screen reader support disabled');
  }

  onVoiceOverToggle() {
    this.accessibilityService.updateSetting('voiceOverEnabled', this.settings.voiceOverEnabled);
    this.showToast(this.settings.voiceOverEnabled ? 'accessibility.voiceOverEnabled' : 'accessibility.voiceOverDisabled');
    this.announceChange(this.settings.voiceOverEnabled ? 'Voice over enabled' : 'Voice over disabled');
  }

  onLargeButtonsToggle() {
    this.accessibilityService.updateSetting('largeButtons', this.settings.largeButtons);
    this.showToast(this.settings.largeButtons ? 'accessibility.largeButtonsEnabled' : 'accessibility.largeButtonsDisabled');
    this.announceChange(this.settings.largeButtons ? 'Large buttons enabled' : 'Large buttons disabled');
  }

  onFocusIndicatorsToggle() {
    this.accessibilityService.updateSetting('focusIndicators', this.settings.focusIndicators);
    this.showToast(this.settings.focusIndicators ? 'accessibility.focusIndicatorsEnabled' : 'accessibility.focusIndicatorsDisabled');
    this.announceChange(this.settings.focusIndicators ? 'Focus indicators enabled' : 'Focus indicators disabled');
  }

  onAnnouncementsToggle() {
    this.accessibilityService.updateSetting('announcements', this.settings.announcements);
    this.showToast(this.settings.announcements ? 'accessibility.announcementsEnabled' : 'accessibility.announcementsDisabled');
    this.announceChange(this.settings.announcements ? 'Announcements enabled' : 'Announcements disabled');
  }

  resetToDefaults() {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReaderSupport: true,
      voiceOverEnabled: false,
      largeButtons: false,
      focusIndicators: true,
      announcements: true
    };

    Object.keys(defaultSettings).forEach(key => {
      this.accessibilityService.updateSetting(
        key as keyof AccessibilitySettings,
        defaultSettings[key as keyof AccessibilitySettings]
      );
    });

    this.showToast('accessibility.resetToDefaults');
    this.announceChange('Accessibility settings reset to defaults');
  }

  private async showToast(messageKey: string) {
    const message = this.i18nService.translate(messageKey);
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private announceChange(message: string) {
    if (this.settings.announcements) {
      this.accessibilityService.announceToScreenReader(message);
    }
  }

  translate(key: string): string {
    return this.i18nService.translate(key);
  }

  getFontSizeLabel(value: string): string {
    const option = this.fontSizeOptions.find(opt => opt.value === value);
    return option ? this.translate(option.label) : value;
  }
}