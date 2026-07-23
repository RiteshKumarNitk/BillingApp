import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../features/authentication/presentation/cubit/auth_cubit.dart';
import '../../features/authentication/presentation/cubit/auth_state.dart';
import '../../features/authentication/presentation/pages/login_page.dart';
import '../../features/authentication/presentation/pages/register_page.dart';
import '../../features/cafe_details/presentation/pages/cafe_details_page.dart';
import '../../features/cafe_details/presentation/pages/menu_placeholder_page.dart';
import '../../features/cafes/domain/entities/cafe.dart';
import '../../features/cafes/presentation/cubit/cafes_cubit.dart';
import '../../features/cafes/presentation/pages/cafes_list_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/scanner/presentation/pages/scanner_placeholder_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/welcome/presentation/pages/welcome_page.dart';
import '../di/service_locator.dart';
import '../storage/local_storage_service.dart';
import 'go_router_refresh_stream.dart';
import 'home_shell.dart';

const _preHomeLocations = {'/splash', '/onboarding', '/welcome', '/login', '/register'};

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
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
      GoRoute(path: '/welcome', builder: (context, state) => const WelcomePage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterPage()),
      GoRoute(path: '/scan', builder: (context, state) => const ScannerPlaceholderPage()),
      GoRoute(
        path: '/cafes/:id',
        builder: (context, state) => CafeDetailsPage(cafe: state.extra as Cafe),
      ),
      GoRoute(
        path: '/cafes/:id/menu',
        builder: (context, state) => MenuPlaceholderPage(cafe: state.extra as Cafe),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => BlocProvider(create: (_) => sl<CafesCubit>(), child: const HomePage()),
            ),
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
