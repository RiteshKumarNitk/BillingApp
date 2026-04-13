import 'package:go_router/go_router.dart';
import '../../features/billing/presentation/pages/splash_screen.dart';
import '../../features/billing/presentation/pages/dashboard_screen.dart';
import '../../features/billing/presentation/pages/home_page.dart';
import '../../features/billing/presentation/pages/sales_history_page.dart';
import '../../features/product/presentation/pages/product_list_page.dart';
import '../../features/product/presentation/pages/add_product_page.dart';
import '../../features/product/presentation/pages/edit_product_page.dart';
import '../../features/product/presentation/pages/bulk_import_page.dart';
import '../../features/shop/presentation/pages/shop_details_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/billing/presentation/pages/scanner_page.dart';
import '../../features/billing/presentation/pages/checkout_page.dart';
import '../../features/customer/presentation/pages/customer_list_page.dart';
import '../../features/customer/presentation/pages/add_customer_page.dart';
import '../../features/discount/presentation/pages/discount_list_page.dart';
import '../../features/discount/presentation/pages/add_discount_page.dart';
import '../../features/product/presentation/pages/expiry_alert_page.dart';
import '../../features/product/domain/entities/product.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
      routes: [
        GoRoute(
          path: 'scanner',
          builder: (context, state) => const ScannerPage(),
        ),
        GoRoute(
          path: 'checkout',
          builder: (context, state) => const CheckoutPage(),
        ),
      ],
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
    ),
    GoRoute(
      path: '/sales-history',
      builder: (context, state) => const SalesHistoryPage(),
    ),
    GoRoute(
      path: '/products',
      builder: (context, state) => const ProductListPage(),
      routes: [
        GoRoute(
          path: 'add',
          builder: (context, state) => const AddProductPage(),
        ),
        GoRoute(
          path: 'bulk-import',
          builder: (context, state) => const BulkImportPage(),
        ),
        GoRoute(
          path: 'edit/:id',
          builder: (context, state) {
            final product = state.extra as Product?;
            if (product == null) {
              return const ProductListPage();
            }
            return EditProductPage(product: product);
          },
        ),
      ],
    ),
    GoRoute(
      path: '/shop',
      builder: (context, state) => const ShopDetailsPage(),
    ),
    GoRoute(
      path: '/customers',
      builder: (context, state) => const CustomerListPage(),
      routes: [
        GoRoute(
          path: 'add',
          builder: (context, state) => const AddCustomerPage(),
        ),
      ],
    ),
    GoRoute(
      path: '/discounts',
      builder: (context, state) => const DiscountListPage(),
      routes: [
        GoRoute(
          path: 'add',
          builder: (context, state) => const AddDiscountPage(),
        ),
      ],
    ),
    GoRoute(
      path: '/expiry-alerts',
      builder: (context, state) => const ExpiryAlertListPage(),
    ),
  ],
);
