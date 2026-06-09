import 'package:go_router/go_router.dart';
import '../../features/billing/presentation/pages/splash_screen.dart';
import '../../features/billing/presentation/pages/dashboard_screen.dart';
import '../../features/billing/presentation/pages/sales_history_page.dart';
import '../../features/product/presentation/pages/product_list_page.dart';
import '../../features/product/presentation/pages/add_product_page.dart';
import '../../features/product/presentation/pages/edit_product_page.dart';
import '../../features/product/presentation/pages/bulk_import_page.dart';
import '../../features/shop/presentation/pages/shop_details_page.dart';
import '../../features/product/presentation/pages/barcode_labels_page.dart';
import '../../features/shop/presentation/pages/digital_menu_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/billing/presentation/pages/scanner_page.dart';
import '../../features/billing/presentation/pages/checkout_page.dart';
import '../../features/customer/presentation/pages/customer_list_page.dart';
import '../../features/customer/presentation/pages/add_customer_page.dart';
import '../../features/discount/presentation/pages/discount_list_page.dart';
import '../../features/discount/presentation/pages/add_discount_page.dart';
import '../../features/product/presentation/pages/expiry_alert_page.dart';
import '../../features/product/domain/entities/product.dart';
import '../../features/users/presentation/pages/user_list_page.dart';
import '../../features/roles/presentation/pages/role_list_page.dart';
import '../../features/employee/presentation/pages/employee_list_page.dart';

import '../../features/auth/presentation/pages/login_page.dart';

// Customer App imports
import '../../features/customer_app/presentation/pages/mode_switcher_page.dart';
import '../../features/customer_app/presentation/pages/customer_login_page.dart';
import '../../features/customer_app/presentation/pages/customer_register_page.dart';
import '../../features/customer_app/presentation/pages/customer_app_shell.dart';
import '../../features/customer_app/presentation/pages/customer_dashboard_page.dart';
import '../../features/customer_app/presentation/pages/customer_stores_page.dart';
import '../../features/customer_app/presentation/pages/customer_orders_page.dart';
import '../../features/customer_app/presentation/pages/customer_notifications_page.dart';
import '../../features/customer_app/presentation/pages/customer_profile_page.dart';
import '../../features/customer_app/presentation/pages/store_menu_page.dart';
import '../../features/customer_app/presentation/pages/qr_scanner_page.dart';
import '../../features/billing/presentation/pages/order_queue_page.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    // Mode Switcher
    GoRoute(
      path: '/mode-switch',
      builder: (context, state) => const ModeSwitcherPage(),
    ),

    // Customer App routes
    GoRoute(
      path: '/customer-app/login',
      builder: (context, state) => const CustomerLoginPage(),
    ),
    GoRoute(
      path: '/customer-app/register',
      builder: (context, state) => const CustomerRegisterPage(),
    ),
    ShellRoute(
      builder: (context, state, child) => CustomerAppShell(child: child),
      routes: [
        GoRoute(path: '/customer-app/dashboard', builder: (context, state) => const CustomerDashboardPage()),
        GoRoute(path: '/customer-app/stores', builder: (context, state) => const CustomerStoresPage()),
        GoRoute(path: '/customer-app/orders', builder: (context, state) => const CustomerOrdersPage()),
        GoRoute(path: '/customer-app/notifications', builder: (context, state) => const CustomerNotificationsPage()),
        GoRoute(path: '/customer-app/profile', builder: (context, state) => const CustomerProfilePage()),
      ],
    ),
    GoRoute(
      path: '/customer-app/menu/:tenantId',
      builder: (context, state) {
        final tenantId = state.pathParameters['tenantId']!;
        return StoreMenuPage(tenantId: tenantId);
      },
    ),
    GoRoute(
      path: '/customer-app/scan',
      builder: (context, state) => const QrScannerPage(),
    ),
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/scanner',
      builder: (context, state) => const ScannerPage(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutPage(),
    ),
    GoRoute(
      path: '/',
      redirect: (context, state) => '/dashboard',
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
      path: '/digital-menu',
      builder: (context, state) => const DigitalMenuPage(),
    ),
    GoRoute(
      path: '/barcode-labels',
      builder: (context, state) => const BarcodeLabelsPage(),
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
    GoRoute(
      path: '/users',
      builder: (context, state) => const UserListPage(),
    ),
    GoRoute(
      path: '/roles',
      builder: (context, state) => const RoleListPage(),
    ),
    GoRoute(
      path: '/employees',
      builder: (context, state) => const EmployeeListPage(),
    ),
    GoRoute(
      path: '/order-queue',
      builder: (context, state) => const OrderQueuePage(),
    ),
  ],
);
