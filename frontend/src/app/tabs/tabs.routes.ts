import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'receipts',
        loadComponent: () =>
          import('../receipts/receipts.page').then((m) => m.ReceiptsPage),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'product-gallery',
        loadComponent: () =>
          import('../product-gallery/product-gallery.page').then((m) => m.ProductGalleryPage),
      },
      {
        path: 'popular-products',
        loadComponent: () =>
          import('../popular-products/popular-products.page').then((m) => m.PopularProductsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/receipts',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/receipts',
    pathMatch: 'full',
  },
];
