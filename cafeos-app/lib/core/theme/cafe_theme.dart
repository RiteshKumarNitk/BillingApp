import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';
import 'cafe_appearance.dart';

/// Builds a ThemeData from a specific cafe's own WebsiteConfig-shaped appearance data — used only
/// inside that cafe's screens (menu/cafe-details/cart/checkout). Falls back to CafeOS's own
/// defaults field-by-field when a cafe hasn't customized something (or has no website at all),
/// exactly like billing-web's ThemeLayoutShell does with `config.appearance?.colors?.primary ||
/// defaults.colors?.primary`.
class CafeTheme {
  CafeTheme._();

  static ThemeData build(CafeAppearance appearance, {Brightness brightness = Brightness.light}) {
    final primary = _parseColor(appearance.primaryColor) ?? AppColors.primary;
    final background = _parseColor(appearance.backgroundColor) ?? AppColors.lightBackground;
    final text = _parseColor(appearance.textColor) ?? AppColors.lightText;
    final accent = _parseColor(appearance.accentColor) ?? _parseColor(appearance.secondaryColor) ?? primary;
    final isDarkBg = _isDark(background);

    final colorScheme = ColorScheme(
      brightness: isDarkBg ? Brightness.dark : Brightness.light,
      primary: primary,
      onPrimary: _contrastColor(primary),
      secondary: accent,
      onSecondary: _contrastColor(accent),
      surface: background,
      onSurface: text,
      error: AppColors.error,
      onError: Colors.white,
      outline: isDarkBg ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.1),
    );

    final headingFont = _resolveGoogleFont(appearance.headingFont) ?? GoogleFonts.plusJakartaSans();
    final bodyBase = GoogleFonts.interTextTheme(isDarkBg ? ThemeData.dark().textTheme : ThemeData.light().textTheme);

    return ThemeData(
      useMaterial3: true,
      brightness: colorScheme.brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: background,
      textTheme: bodyBase.copyWith(
        displayLarge: headingFont.copyWith(fontSize: 30, fontWeight: FontWeight.w700, color: text),
        headlineLarge: headingFont.copyWith(fontSize: 22, fontWeight: FontWeight.w700, color: text),
        headlineMedium: headingFont.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: text),
        titleMedium: headingFont.copyWith(fontSize: 16, fontWeight: FontWeight.w600, color: text),
        bodyLarge: bodyBase.bodyLarge?.copyWith(color: text),
        bodyMedium: bodyBase.bodyMedium?.copyWith(color: text),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: text,
        elevation: 0,
        titleTextStyle: headingFont.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: text),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: _contrastColor(primary),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          elevation: 0,
        ),
      ),
    );
  }

  static Color? _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var value = hex.trim().replaceFirst('#', '');
    if (value.length == 6) value = 'FF$value';
    final parsed = int.tryParse(value, radix: 16);
    return parsed == null ? null : Color(parsed);
  }

  static bool _isDark(Color color) => color.computeLuminance() < 0.5;

  static Color _contrastColor(Color color) => _isDark(color) ? Colors.white : Colors.black;

  /// A theme's `headingFont` comes as a CSS font-family string, e.g.
  /// `"'Playfair Display', Georgia, serif"` — take the first family name and hand it to
  /// google_fonts, which happens to already cover every font used across billing-web's themes
  /// (Playfair Display, Quicksand, Cormorant Garamond, ...). Falls back gracefully if not found.
  static TextStyle? _resolveGoogleFont(String? cssFontFamily) {
    if (cssFontFamily == null || cssFontFamily.isEmpty) return null;
    final firstFamily = cssFontFamily.split(',').first.trim().replaceAll("'", '').replaceAll('"', '');
    try {
      return GoogleFonts.getFont(firstFamily);
    } catch (_) {
      return null;
    }
  }
}
