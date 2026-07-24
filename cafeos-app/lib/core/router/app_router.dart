import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../features/addresses/domain/entities/customer_address.dart';
import '../../features/addresses/presentation/pages/address_form_page.dart';
import '../../features/addresses/presentation/pages/addresses_page.dart';
import '../../features/authentication/presentation/cubit/auth_cubit.dart';
import '../../features/authentication/presentation/cubit/auth_state.dart';
import '../../features/authentication/presentation/pages/forgot_password_page.dart';
import '../../features/authentication/presentation/pages/login_page.dart';
import '../../features/authentication/presentation/pages/register_page.dart';
import '../../features/authentication/presentation/pages/reset_password_page.dart';
import '../../features/cafe_details/presentation/pages/cafe_details_page.dart';
import '../../features/cafes/domain/entities/cafe.dart';
import '../../features/cafes/presentation/cubit/cafes_cubit.dart';
import '../../features/cafes/presentation/pages/cafes_list_page.dart';
import '../../features/cart/presentation/pages/cart_page.dart';
import '../../features/checkout/presentation/pages/checkout_page.dart';
import '../../features/checkout/presentation/pages/order_success_page.dart';
import '../../features/favorites/presentation/pages/favorites_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/menu/presentation/pages/menu_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/orders/presentation/pages/order_detail_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/scanner/presentation/pages/scanner_page.dart';
import '../../features/search/presentation/pages/search_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/welcome/presentation/pages/welcome_page.dart';
import '../di/service_locator.dart';
import '../storage/local_storage_service.dart';
import 'go_router_refresh_stream.dart';
import 'home_shell.dart';

const _preHomeLocations = {'/splash', '/onboarding', '/welcome', '/login', '/register'};
// Guest checkout only exists on the cookie-based website path (see the backend audit this app was
// built against) — the mobile app always requires a logged-in customer to place an order.
const _requiresLoginLocations = {'/checkout'};

GoRouter buildAppRouter(AuthCubit authCubit) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshStream(authCubit.stream),
    redirect: (context, state) {
      final authState = authCubit.state;
      final location = state.matchedLocation;

      if (authState.status == AuthStatus.unknown) {
        return location == '/splash' ? null : '/splash';
      }

      final isLoggedInOrGuest = authState.status == AuthStatus.authenticated || authState.status == AuthStatus.guest;
      if (isLoggedInOrGuest) {
        // Already past the door — don't let a stale deep link or back-navigation show onboarding/
        // welcome/login/register again. (A logged-in customer choosing to view /login is an edge
        // case not worth special-casing.)
        if (_preHomeLocations.contains(location)) return '/home';
        if (authState.status == AuthStatus.guest && _requiresLoginLocations.contains(location)) return '/login';
        return null;
      }

      // status == unauthenticated: only /splash itself gets redirected (to onboarding or welcome
      // depending on whether they've seen it before) — every other route (including /home,
      // /cafes, /login, /register) stays freely reachable, matching "guests can browse without an
      // account, only checkout requires login."
      if (location == '/splash') {
        final hasSeenOnboarding = sl<LocalStorageService>().hasSeenOnboarding;
        return hasSeenOnboarding ? '/welcome' : '/onboarding';
      }
      if (_requiresLoginLocations.contains(location)) return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
      GoRoute(path: '/welcome', builder: (context, state) => const WelcomePage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterPage()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(path: '/reset-password', builder: (context, state) => ResetPasswordPage(email: state.extra as String?)),
      GoRoute(path: '/addresses', builder: (context, state) => const AddressesPage()),
      GoRoute(path: '/addresses/new', builder: (context, state) => const AddressFormPage()),
      GoRoute(path: '/addresses/:id/edit', builder: (context, state) => AddressFormPage(existing: state.extra as CustomerAddress?)),
      GoRoute(path: '/scan', builder: (context, state) => const ScannerPage()),
      GoRoute(
        path: '/cafes/:id',
        builder: (context, state) => CafeDetailsPage(cafe: state.extra as Cafe),
      ),
      GoRoute(
        path: '/cafes/:id/menu',
        builder: (context, state) => MenuPage(cafe: state.extra as Cafe),
      ),
      GoRoute(path: '/cart', builder: (context, state) => const CartPage()),
      GoRoute(path: '/checkout', builder: (context, state) => const CheckoutPage()),
      GoRoute(path: '/order-success', builder: (context, state) => OrderSuccessPage(args: state.extra as OrderSuccessArgs)),
      GoRoute(path: '/orders/:id', builder: (context, state) => OrderDetailPage(orderId: state.pathParameters['id']!)),
      GoRoute(path: '/favorites', builder: (context, state) => const FavoritesPage()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsPage()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsPage()),
      GoRoute(path: '/search', builder: (context, state) => const SearchPage()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/cafes',
              builder: (context, state) => BlocProvider(create: (_) => sl<CafesCubit>(), child: const CafesListPage()),
            ),
          ]),
          StatefulShellBranch(routes: [GoRoute(path: '/orders', builder: (context, state) => const OrdersPage())]),
          StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (context, state) => const ProfilePage())]),
        ],
      ),
    ],
  );
}
