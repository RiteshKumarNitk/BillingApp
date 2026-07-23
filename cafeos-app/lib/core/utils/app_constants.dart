/// API base URL — set at build/run time via `--dart-define=API_BASE_URL=...`, replacing the
/// hardcoded-URL-with-a-commented-out-alternate-line pattern mobile-app/ used. Defaults to the
/// local billing-web dev server so `flutter run` works out of the box during development.
class AppConstants {
  AppConstants._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/mobile',
  );

  /// The QR-table validator (`GET /api/website/table`) lives outside `/api/mobile/customer/*` —
  /// it's the same public endpoint the website itself uses to check a scanned table QR, so the
  /// app calls it directly rather than duplicating it under the mobile-customer prefix.
  static String get websiteApiBaseUrl => apiBaseUrl.replaceFirst(RegExp(r'/api/mobile$'), '/api/website');

  static const String appName = 'CafeOS';
  static const String appTagline = 'Great cafes, right where you are.';
  static const String appVersion = '1.0.0';

  static const String secureStorageTokenKey = 'cafeos_customer_token';
  static const String prefsOnboardingSeenKey = 'cafeos_onboarding_seen';
  static const String prefsCartKey = 'cafeos_cart';
  static const String prefsRecentSearchesKey = 'cafeos_recent_searches';
  static const String prefsRecentlyViewedKey = 'cafeos_recently_viewed';
  static const String prefsThemeModeKey = 'cafeos_theme_mode';
  static const String prefsPushEnabledKey = 'cafeos_push_enabled';

  static const Duration networkTimeout = Duration(seconds: 20);
}
