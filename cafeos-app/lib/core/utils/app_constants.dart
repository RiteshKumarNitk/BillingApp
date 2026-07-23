/// API base URL — set at build/run time via `--dart-define=API_BASE_URL=...`, replacing the
/// hardcoded-URL-with-a-commented-out-alternate-line pattern mobile-app/ used. Defaults to the
/// local billing-web dev server so `flutter run` works out of the box during development.
class AppConstants {
  AppConstants._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/mobile',
  );

  static const String appName = 'CafeOS';
  static const String appTagline = 'Great cafes, right where you are.';

  static const String secureStorageTokenKey = 'cafeos_customer_token';
  static const String prefsOnboardingSeenKey = 'cafeos_onboarding_seen';

  static const Duration networkTimeout = Duration(seconds: 20);
}
