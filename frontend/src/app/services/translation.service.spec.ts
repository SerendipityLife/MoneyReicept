import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService, TranslationResult, BatchTranslationResult } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TranslationService]
    });
    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should translate text', () => {
    const mockResponse: TranslationResult = {
      originalText: 'コーヒー',
      translatedText: '커피',
      sourceLanguage: 'ja',
      targetLanguage: 'ko',
      confidence: 0.95
    };

    service.translateText('コーヒー', 'ja', 'ko').subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/translate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      text: 'コーヒー',
      sourceLanguage: 'ja',
      targetLanguage: 'ko'
    });
    req.flush({ success: true, data: mockResponse });
  });

  it('should batch translate texts', () => {
    const mockResponse: BatchTranslationResult = {
      translations: [
        {
          originalText: 'コーヒー',
          translatedText: '커피',
          sourceLanguage: 'ja',
          targetLanguage: 'ko',
          confidence: 0.95
        },
        {
          originalText: 'パン',
          translatedText: '빵',
          sourceLanguage: 'ja',
          targetLanguage: 'ko',
          confidence: 0.98
        }
      ],
      totalCount: 2,
      successCount: 2,
      failedCount: 0
    };

    service.batchTranslate(['コーヒー', 'パン'], 'ja', 'ko').subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/translate/batch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      texts: ['コーヒー', 'パン'],
      sourceLanguage: 'ja',
      targetLanguage: 'ko'
    });
    req.flush({ success: true, data: mockResponse });
  });

  it('should check if text needs translation', () => {
    expect(service.needsTranslation('コーヒー', 'ja', 'ko')).toBe(true);
    expect(service.needsTranslation('coffee', 'ja', 'ko')).toBe(false);
    expect(service.needsTranslation('', 'ja', 'ko')).toBe(false);
    expect(service.needsTranslation('test', 'ko', 'ko')).toBe(false);
  });

  it('should return cached translation', () => {
    const cachedTranslation: TranslationResult = {
      originalText: 'コーヒー',
      translatedText: '커피',
      sourceLanguage: 'ja',
      targetLanguage: 'ko',
      confidence: 0.95
    };

    // First call should make HTTP request
    service.translateText('コーヒー', 'ja', 'ko').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/translate');
    req.flush({ success: true, data: cachedTranslation });

    // Second call should return cached result
    service.translateText('コーヒー', 'ja', 'ko').subscribe(result => {
      expect(result.cached).toBe(true);
      expect(result.translatedText).toBe('커피');
    });

    // No additional HTTP request should be made
    httpMock.expectNone('http://localhost:3000/api/translate');
  });
});