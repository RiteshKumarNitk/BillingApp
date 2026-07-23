import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/di/service_locator.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_controller.dart';
import 'core/utils/app_constants.dart';
import 'features/authentication/presentation/cubit/auth_cubit.dart';
import 'features/favorites/presentation/cubit/favorites_cubit.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initServiceLocator();
  runApp(const CafeOSApp());
}

class CafeOSApp extends StatelessWidget {
  const CafeOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => sl<AuthCubit>()),
        // App-wide singletons (unlike every feature cubit above the router, which is a fresh
        // instance per screen) — the favourite-heart on a cafe card needs the same state whether
        // it's rendered on Home, Cafes, or Cafe Details.
        BlocProvider.value(value: sl<FavoritesCubit>()),
      ],
      child: Builder(
        builder: (context) {
          final authCubit = context.read<AuthCubit>();
          final router = buildAppRouter(authCubit);
          return ValueListenableBuilder<ThemeMode>(
            valueListenable: sl<ThemeModeController>(),
            builder: (context, themeMode, _) => MaterialApp.router(
              title: AppConstants.appName,
              debugShowCheckedModeBanner: false,
              theme: AppTheme.light,
              darkTheme: AppTheme.dark,
              themeMode: themeMode,
              routerConfig: router,
            ),
          );
        },
      ),
    );
  }
}
