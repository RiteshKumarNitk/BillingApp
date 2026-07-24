import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// CafeOS's own light/dark themes for app chrome. Cafe-specific screens (menu/cart/checkout)
/// switch to CafeTheme.build(...) instead — see cafe_theme.dart. Light is the default (see
/// ThemeModeController) and gets the fuller Material 3 polish pass — soft elevation shadows
/// instead of flat borders, tighter line-height — dark keeps its existing look.
class AppTheme {
  AppTheme._();

  static ThemeData get light => _build(brightness: Brightness.light);
  static ThemeData get dark => _build(brightness: Brightness.dark);

  static ThemeData _build({required Brightness brightness}) {
    final isDark = brightness == Brightness.dark;
    final background = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final surface = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final text = isDark ? AppColors.darkText : AppColors.lightText;
    final muted = isDark ? AppColors.darkMuted : AppColors.lightMuted;
    final border = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.secondary,
      onSecondary: Colors.white,
      surface: surface,
      onSurface: text,
      error: AppColors.error,
      onError: Colors.white,
      outline: border,
    );

    final baseTextTheme = GoogleFonts.interTextTheme(isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme);
    final headingFont = GoogleFonts.plusJakartaSans();

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: background,
      splashFactory: InkSparkle.splashFactory,
      textTheme: baseTextTheme.copyWith(
        displayLarge: headingFont.copyWith(fontSize: 32, fontWeight: FontWeight.w700, color: text, height: 1.2),
        displayMedium: headingFont.copyWith(fontSize: 26, fontWeight: FontWeight.w700, color: text, height: 1.25),
        headlineLarge: headingFont.copyWith(fontSize: 22, fontWeight: FontWeight.w700, color: text, height: 1.25),
        headlineMedium: headingFont.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: text, height: 1.3),
        titleMedium: headingFont.copyWith(fontSize: 16, fontWeight: FontWeight.w600, color: text, height: 1.3),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: text, height: 1.45),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: text, height: 1.4, letterSpacing: 0.1),
        bodySmall: baseTextTheme.bodySmall?.copyWith(color: muted, height: 1.35, letterSpacing: 0.1),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: text,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: headingFont.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: text),
      ),
      cardTheme: isDark
          ? CardThemeData(
              color: surface,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: border)),
              margin: EdgeInsets.zero,
            )
          : CardThemeData(
              color: surface,
              elevation: 3,
              shadowColor: AppColors.lightCardShadow,
              surfaceTintColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              margin: EdgeInsets.zero,
            ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          elevation: isDark ? 0 : 1,
          shadowColor: AppColors.primary.withValues(alpha: 0.35),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: text,
          side: BorderSide(color: border),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? surface : AppColors.lightBackground,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
        hintStyle: TextStyle(color: muted),
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1, space: 1),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
        elevation: isDark ? 0 : 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        elevation: isDark ? 0 : 3,
        shadowColor: isDark ? null : AppColors.lightCardShadow,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primary.withValues(alpha: 0.14),
        // Deliberately darker/heavier than the shared `muted` body-text color (~4.4:1 on white) —
        // that passes accessibility minimums but reads as washed-out on a 5-item bar. Scoped to
        // just the nav bar so other muted-text usage (captions, hints) is unaffected.
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
              fontSize: 11,
              fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w600,
              color: states.contains(WidgetState.selected) ? AppColors.primary : text.withValues(alpha: 0.72),
            )),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
              color: states.contains(WidgetState.selected) ? AppColors.primary : text.withValues(alpha: 0.72),
            )),
      ),
    );
  }
}
