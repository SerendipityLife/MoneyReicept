import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
  cached?: boolean;
}

export interface BatchTranslationResult {
  translations: TranslationResult[];
  totalCount: number;
  successCount: number;
  failedCount: number;
}

export interface TranslationFeedback {
  originalText: string;
  correctedTranslation: string;
  sourceLanguage: string;
  targetLanguage: string;
  rating?: number;
  comment?: string;
}

export interface TranslationStats {
  totalTranslations: number;
  cacheHitRate: number;
  averageConfidence: number;
  languagePairs: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private apiUrl = 'http://localhost:3000/api/translate';
  private translationCacheSubject = new BehaviorSubject<Map<string, TranslationResult>>(new Map());
  public translationCache$ = this.translationCacheSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Translate a single text
   */
  translateText(
    text: string, 
    sourceLanguage: string = 'ja', 
    targetLanguage: string = 'ko'
  ): Observable<TranslationResult> {
    const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
    const cache = this.translationCacheSubject.value;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cachedResult = cache.get(cacheKey)!;
      return new Observable(observer => {
        observer.next({ ...cachedResult, cached: true });
        observer.complete();
      });
    }

    return this.http.post<{success: boolean, data: TranslationResult}>(`${this.apiUrl}`, {
      text,
      sourceLanguage,
      targetLanguage
    }).pipe(
      map(response => response.data),
      tap(result => {
        // Update cache
        const newCache = new Map(cache);
        newCache.set(cacheKey, result);
        this.translationCacheSubject.next(newCache);
      })
    );
  }

  /**
   * Translate multiple texts in batch
   */
  batchTranslate(
    texts: string[], 
    sourceLanguage: string = 'ja', 
    targetLanguage: string = 'ko'
  ): Observable<BatchTranslationResult> {
    return this.http.post<{success: boolean, data: BatchTranslationResult}>(`${this.apiUrl}/batch`, {
      texts,
      sourceLanguage,
      targetLanguage
    }).pipe(
      map(response => response.data),
      tap(result => {
        // Update cache with batch results
        const cache = this.translationCacheSubject.value;
        const newCache = new Map(cache);
        
        result.translations.forEach(translation => {
          const cacheKey = `${translation.originalText}_${sourceLanguage}_${targetLanguage}`;
          newCache.set(cacheKey, translation);
        });
        
        this.translationCacheSubject.next(newCache);
      })
    );
  }

  /**
   * Submit translation correction/feedback
   */
  submitTranslationFeedback(feedback: TranslationFeedback): Observable<{success: boolean, message: string}> {
    return this.http.put<{success: boolean, message: string}>(`${this.apiUrl}/correction`, feedback).pipe(
      tap(() => {
        // Update cache with corrected translation
        const cache = this.translationCacheSubject.value;
        const cacheKey = `${feedback.originalText}_${feedback.sourceLanguage}_${feedback.targetLanguage}`;
        
        if (cache.has(cacheKey)) {
          const newCache = new Map(cache);
          const existing = cache.get(cacheKey)!;
          newCache.set(cacheKey, {
            ...existing,
            translatedText: feedback.correctedTranslation
          });
          this.translationCacheSubject.next(newCache);
        }
      })
    );
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): Observable<TranslationStats> {
    return this.http.get<{success: boolean, data: TranslationStats}>(`${this.apiUrl}/stats`)
      .pipe(map(response => response.data));
  }

  /**
   * Clear translation cache
   */
  clearCache(olderThanDays?: number): Observable<{success: boolean, message: string}> {
    const params: Record<string, string> = {};
    if (olderThanDays) {
      params['olderThanDays'] = olderThanDays.toString();
    }
    
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/cache`, { params }).pipe(
      tap(() => {
        // Clear local cache as well
        this.translationCacheSubject.next(new Map());
      })
    );
  }

  /**
   * Get cached translation if available
   */
  getCachedTranslation(text: string, sourceLanguage: string = 'ja', targetLanguage: string = 'ko'): TranslationResult | null {
    const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
    const cache = this.translationCacheSubject.value;
    return cache.get(cacheKey) || null;
  }

  /**
   * Check if text needs translation
   */
  needsTranslation(text: string, sourceLanguage: string = 'ja', targetLanguage: string = 'ko'): boolean {
    if (!text || text.trim() === '') return false;
    if (sourceLanguage === targetLanguage) return false;
    
    // Simple heuristic: if text contains Japanese characters, it likely needs translation
    if (sourceLanguage === 'ja') {
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      return japaneseRegex.test(text);
    }
    
    return true;
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.translationCacheSubject.value.size;
  }

  /**
   * Translate text to multiple target languages
   */
  translateToMultipleLanguages(
    text: string, 
    sourceLanguage: string = 'ja', 
    targetLanguages: string[] = ['ko', 'en', 'zh']
  ): Observable<{ [language: string]: TranslationResult }> {
    return this.http.post<{success: boolean, data: { [language: string]: TranslationResult }}>(`${this.apiUrl}/multi`, {
      text,
      sourceLanguage,
      targetLanguages
    }).pipe(
      map(response => response.data),
      tap(results => {
        // Update cache with all results
        const cache = this.translationCacheSubject.value;
        const newCache = new Map(cache);
        
        Object.keys(results).forEach(targetLang => {
          const cacheKey = `${text}_${sourceLanguage}_${targetLang}`;
          newCache.set(cacheKey, results[targetLang]);
        });
        
        this.translationCacheSubject.next(newCache);
      })
    );
  }
}