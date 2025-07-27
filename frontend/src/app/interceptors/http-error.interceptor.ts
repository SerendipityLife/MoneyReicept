import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(1), // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `클라이언트 오류: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = '잘못된 요청입니다.';
              break;
            case 401:
              errorMessage = '인증이 필요합니다.';
              break;
            case 403:
              errorMessage = '접근 권한이 없습니다.';
              break;
            case 404:
              errorMessage = '요청한 리소스를 찾을 수 없습니다.';
              break;
            case 500:
              errorMessage = '서버 내부 오류가 발생했습니다.';
              break;
            default:
              errorMessage = `서버 오류: ${error.status} ${error.message}`;
          }
        }
        
        console.error('HTTP Error:', errorMessage, error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}