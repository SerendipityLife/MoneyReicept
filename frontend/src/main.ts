import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { inject } from '@angular/core';
import { finalize, retry, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { LoadingService } from './app/services/loading.service';

// Functional interceptors for Angular standalone
const loadingInterceptor = (req: any, next: any) => {
  const loadingService = inject(LoadingService);
  const skipLoading = req.headers.has('X-Skip-Loading');
  
  if (!skipLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.hide();
      }
    })
  );
};

const errorInterceptor = (req: any, next: any) => {
  return next(req).pipe(
    retry(1),
    catchError((error: any) => {
      let errorMessage = '';
      
      if (error.error instanceof ErrorEvent) {
        errorMessage = `클라이언트 오류: ${error.error.message}`;
      } else {
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
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(
      withInterceptors([loadingInterceptor, errorInterceptor])
    ),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
