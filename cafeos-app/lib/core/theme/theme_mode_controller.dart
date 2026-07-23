import 'package:flutter/material.dart';
import '../storage/local_storage_service.dart';

/// A ValueNotifier so CafeOSApp can rebuild its MaterialApp.router's themeMode without a full
/// Cubit — this is pure UI preference state, not a networked/domain concern. Registered as a
/// lazy singleton so SettingsPage and main.dart share the same instance.
class ThemeModeController extends ValueNotifier<ThemeMode> {
  final LocalStorageService _localStorage;

  ThemeModeController(this._localStorage) : super(_parse(_localStorage.themeMode));

  // Defaults to light rather than following the OS — a premium food-ordering app (Zomato/Swiggy/
  // Starbucks) reads as bright and appetite-friendly by default; dark stays fully supported and
  // one tap away in Settings, it's just not what a first launch lands on anymore.
  static ThemeMode _parse(String value) {
    switch (value) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.light;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    value = mode;
    await _localStorage.setThemeMode(mode.name);
  }
}
