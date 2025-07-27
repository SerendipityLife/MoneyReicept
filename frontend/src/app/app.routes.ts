import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'receipt-detail/:id',
    loadComponent: () => import('./receipt-detail/receipt-detail.page').then(m => m.ReceiptDetailPage)
  },
  {
    path: 'travel-plans',
    loadComponent: () => import('./travel-plans/travel-plans.page').then(m => m.TravelPlansPage)
  },
  {
    path: 'product-gallery',
    loadComponent: () => import('./product-gallery/product-gallery.page').then(m => m.ProductGalleryPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'accessibility-settings',
    loadComponent: () => import('./components/accessibility-settings/accessibility-settings.component').then(m => m.AccessibilitySettingsComponent)
  },
];
