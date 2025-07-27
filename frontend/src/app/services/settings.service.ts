import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserSettings, SettingsUpdateRequest, BackupData } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = 'http://localhost:3000/api/settings';
  private settingsSubject = new BehaviorSubject<UserSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.getSettings().subscribe({
      next: (settings) => {
        this.settingsSubject.next(settings);
      },
      error: (error) => {
        console.error('Error loading settings:', error);
      }
    });
  }

  getSettings(userId?: string): Observable<UserSettings> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.get<{success: boolean, data: UserSettings}>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => response.data),
        tap(settings => this.settingsSubject.next(settings))
      );
  }

  updateSettings(settingsId: string, updates: SettingsUpdateRequest): Observable<UserSettings> {
    return this.http.put<{success: boolean, data: UserSettings}>(`${this.apiUrl}/${settingsId}`, updates)
      .pipe(
        map(response => response.data),
        tap(settings => this.settingsSubject.next(settings))
      );
  }

  updateExchangeRate(settingsId: string, rate: number, useManual: boolean): Observable<UserSettings> {
    return this.http.put<{success: boolean, data: UserSettings}>(`${this.apiUrl}/exchange-rate`, {
      settingsId,
      rate,
      useManual
    }).pipe(
      map(response => response.data),
      tap(settings => this.settingsSubject.next(settings))
    );
  }

  updateTranslationSettings(settingsId: string, translationSettings: any): Observable<UserSettings> {
    return this.http.put<{success: boolean, data: UserSettings}>(`${this.apiUrl}/translation`, {
      settingsId,
      ...translationSettings
    }).pipe(
      map(response => response.data),
      tap(settings => this.settingsSubject.next(settings))
    );
  }

  updateNotificationSettings(settingsId: string, notificationSettings: any): Observable<UserSettings> {
    return this.http.put<{success: boolean, data: UserSettings}>(`${this.apiUrl}/notifications`, {
      settingsId,
      ...notificationSettings
    }).pipe(
      map(response => response.data),
      tap(settings => this.settingsSubject.next(settings))
    );
  }

  createBackup(userId?: string): Observable<BackupData> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.post<{success: boolean, data: BackupData}>(`${this.apiUrl}/backup/create`, {}, { params })
      .pipe(map(response => response.data));
  }

  exportBackup(userId?: string): Observable<Blob> {
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.post(`${this.apiUrl}/backup/export`, {}, { 
      params,
      responseType: 'blob'
    }) as Observable<Blob>;
  }

  restoreBackup(file: File, userId?: string): Observable<{success: boolean, message: string}> {
    const formData = new FormData();
    formData.append('backupFile', file);
    
    const params: any = {};
    if (userId) {
      params.userId = userId;
    }
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/backup/restore`, formData, { params });
  }

  getBackupHistory(): Observable<string[]> {
    return this.http.get<{success: boolean, data: string[]}>(`${this.apiUrl}/backup/history`)
      .pipe(map(response => response.data));
  }

  getCurrentSettings(): UserSettings | null {
    return this.settingsSubject.value;
  }

  // Helper methods for specific settings
  getExchangeRate(): number | null {
    const settings = this.getCurrentSettings();
    if (!settings) return null;
    
    if (settings.exchangeRateSettings.useManualRate && settings.exchangeRateSettings.manualRate) {
      return settings.exchangeRateSettings.manualRate;
    }
    
    return null; // Will use automatic rate
  }

  isAutoTranslateEnabled(): boolean {
    const settings = this.getCurrentSettings();
    return settings?.translationSettings.autoTranslateEnabled ?? true;
  }

  getTargetLanguage(): string {
    const settings = this.getCurrentSettings();
    return settings?.translationSettings.targetLanguage ?? 'ko';
  }

  areNotificationsEnabled(type: keyof UserSettings['notificationSettings']): boolean {
    const settings = this.getCurrentSettings();
    return settings?.notificationSettings[type] ?? true;
  }
}