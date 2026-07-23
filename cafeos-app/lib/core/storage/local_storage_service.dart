import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_constants.dart';

/// Non-sensitive local state only (onboarding flag, cart JSON, recent searches, theme
/// preference) — never tokens or anything else that needs to be encrypted-at-rest; see
/// SecureStorageService for that.
class LocalStorageService {
  final SharedPreferences _prefs;

  LocalStorageService(this._prefs);

  static Future<LocalStorageService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return LocalStorageService(prefs);
  }

  bool get hasSeenOnboarding => _prefs.getBool(AppConstants.prefsOnboardingSeenKey) ?? false;
  Future<void> setOnboardingSeen() => _prefs.setBool(AppConstants.prefsOnboardingSeenKey, true);

  String? get cartJson => _prefs.getString(AppConstants.prefsCartKey);
  Future<void> setCartJson(String? json) =>
      json == null ? _prefs.remove(AppConstants.prefsCartKey) : _prefs.setString(AppConstants.prefsCartKey, json);

  List<String> get recentSearches => _prefs.getStringList(AppConstants.prefsRecentSearchesKey) ?? const [];
  Future<void> setRecentSearches(List<String> searches) => _prefs.setStringList(AppConstants.prefsRecentSearchesKey, searches);

  List<String> get recentlyViewedCafeIds => _prefs.getStringList(AppConstants.prefsRecentlyViewedKey) ?? const [];
  Future<void> setRecentlyViewedCafeIds(List<String> ids) => _prefs.setStringList(AppConstants.prefsRecentlyViewedKey, ids);

  /// 'light' | 'dark' | 'system'
  String get themeMode => _prefs.getString(AppConstants.prefsThemeModeKey) ?? 'light';
  Future<void> setThemeMode(String mode) => _prefs.setString(AppConstants.prefsThemeModeKey, mode);

  bool get pushEnabled => _prefs.getBool(AppConstants.prefsPushEnabledKey) ?? true;
  Future<void> setPushEnabled(bool enabled) => _prefs.setBool(AppConstants.prefsPushEnabledKey, enabled);
}
