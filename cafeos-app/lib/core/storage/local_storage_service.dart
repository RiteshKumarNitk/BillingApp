import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_constants.dart';

/// Non-sensitive local state only (onboarding-seen flag, theme mode later) — never tokens or
/// anything else that needs to be encrypted-at-rest; see SecureStorageService for that.
class LocalStorageService {
  final SharedPreferences _prefs;

  LocalStorageService(this._prefs);

  static Future<LocalStorageService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return LocalStorageService(prefs);
  }

  bool get hasSeenOnboarding => _prefs.getBool(AppConstants.prefsOnboardingSeenKey) ?? false;

  Future<void> setOnboardingSeen() => _prefs.setBool(AppConstants.prefsOnboardingSeenKey, true);
}
