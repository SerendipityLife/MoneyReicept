import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderSupport: boolean;
  voiceOverEnabled: boolean;
  largeButtons: boolean;
  focusIndicators: boolean;
  announcements: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private settingsSubject = new BehaviorSubject<AccessibilitySettings>({
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReaderSupport: true,
    voiceOverEnabled: false,
    largeButtons: false,
    focusIndicators: true,
    announcements: true
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
    this.initializeAccessibility();
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.settingsSubject.next({ ...this.settingsSubject.value, ...settings });
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }

    // Detect system preferences
    this.detectSystemPreferences();
  }

  private detectSystemPreferences(): void {
    const current = this.settingsSubject.value;
    let updated = false;

    // Detect reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.reducedMotion = true;
      updated = true;
    }

    // Detect high contrast preference
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      current.highContrast = true;
      updated = true;
    }

    // Listen for changes in system preferences
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.updateSetting('reducedMotion', e.matches);
      });

      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        this.updateSetting('highContrast', e.matches);
      });
    }

    if (updated) {
      this.settingsSubject.next(current);
      this.saveSettings();
    }
  }

  private initializeAccessibility(): void {
    this.settings$.subscribe(settings => {
      this.applyFontSize(settings.fontSize);
      this.applyHighContrast(settings.highContrast);
      this.applyReducedMotion(settings.reducedMotion);
      this.applyLargeButtons(settings.largeButtons);
      this.applyFocusIndicators(settings.focusIndicators);
    });
  }

  public updateSetting<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ): void {
    const current = this.settingsSubject.value;
    const updated = { ...current, [key]: value };
    this.settingsSubject.next(updated);
    this.saveSettings();
  }

  public getSettings(): AccessibilitySettings {
    return this.settingsSubject.value;
  }

  private saveSettings(): void {
    localStorage.setItem('accessibility-settings', JSON.stringify(this.settingsSubject.value));
  }

  private applyFontSize(fontSize: AccessibilitySettings['fontSize']): void {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${fontSize}`);
    
    // Set CSS custom property for dynamic scaling
    const sizeMap = {
      'small': '0.875',
      'medium': '1',
      'large': '1.125',
      'extra-large': '1.25'
    };
    root.style.setProperty('--font-scale', sizeMap[fontSize]);
  }

  private applyHighContrast(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  private applyReducedMotion(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  private applyLargeButtons(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('large-buttons');
    } else {
      root.classList.remove('large-buttons');
    }
  }

  private applyFocusIndicators(enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }
  }

  // Screen reader and voice over support
  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.settingsSubject.value.announcements) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  public setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  public setAriaDescribedBy(element: HTMLElement, describedById: string): void {
    element.setAttribute('aria-describedby', describedById);
  }

  public setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  public setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  public setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }

  public setAriaHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute('aria-hidden', hidden.toString());
  }

  public setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }

  public setTabIndex(element: HTMLElement, index: number): void {
    element.setAttribute('tabindex', index.toString());
  }

  // Focus management
  public focusElement(element: HTMLElement): void {
    element.focus();
    
    // Announce focus change to screen readers
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  element.textContent || 
                  'Element focused';
    this.announceToScreenReader(`Focused: ${label}`);
  }

  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Touch and gesture accessibility
  public makeTouchAccessible(element: HTMLElement, action: () => void): void {
    // Ensure minimum touch target size (44px x 44px)
    const style = window.getComputedStyle(element);
    const width = parseInt(style.width);
    const height = parseInt(style.height);
    
    if (width < 44 || height < 44) {
      element.style.minWidth = '44px';
      element.style.minHeight = '44px';
    }

    // Add touch event listeners
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      element.classList.add('touch-active');
    });

    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      element.classList.remove('touch-active');
      action();
    });

    element.addEventListener('touchcancel', () => {
      element.classList.remove('touch-active');
    });
  }

  // Color contrast helpers
  public checkColorContrast(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation (would need more robust implementation)
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      const { r, g, b } = rgb;
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Keyboard navigation helpers
  public handleArrowNavigation(
    elements: HTMLElement[], 
    currentIndex: number, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): number {
    let newIndex = currentIndex;
    
    switch (direction) {
      case 'up':
      case 'left':
        newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        break;
      case 'down':
      case 'right':
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        break;
    }
    
    elements[newIndex].focus();
    return newIndex;
  }

  // Voice over support (iOS specific)
  public enableVoiceOverSupport(): void {
    if (!this.settingsSubject.value.voiceOverEnabled) return;
    
    // Add VoiceOver specific attributes
    document.body.setAttribute('data-voiceover', 'true');
    
    // Listen for VoiceOver gestures
    document.addEventListener('touchstart', this.handleVoiceOverGestures.bind(this));
  }

  private handleVoiceOverGestures(event: TouchEvent): void {
    // Handle VoiceOver specific touch gestures
    if (event.touches.length === 1) {
      // Single finger gestures for VoiceOver navigation
      const touch = event.touches[0];
      // Implementation would depend on specific VoiceOver gesture patterns
    }
  }
}