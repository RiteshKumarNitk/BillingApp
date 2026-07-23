import 'package:flutter/material.dart';

/// CafeOS's own product brand — used for app chrome (splash, onboarding, auth, discovery, cart,
/// checkout shell). Distinct from any individual cafe's own theme (see CafeTheme), the same way
/// Zomato/Swiggy have their own brand identity independent of any restaurant they list.
class AppColors {
  AppColors._();

  static const Color primary = Color(0xFFFF6B4A); // warm coral-orange — appetite, warmth, premium
  static const Color primaryDark = Color(0xFFE85A3A);
  static const Color secondary = Color(0xFF1A1D29); // deep charcoal-navy

  // Light mode — the default theme (see ThemeModeController). Soft warm-neutral background with
  // pure-white cards floating just above it on shadow, not a border, for the Material 3 /
  // Zomato-Swiggy-Airbnb "bright and appetizing" feel.
  static const Color lightBackground = Color(0xFFFAF8F6);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightText = Color(0xFF1A1D29);
  static const Color lightMuted = Color(0xFF6E7180);
  static const Color lightBorder = Color(0xFFF0EBE6);
  static const Color lightCardShadow = Color(0x14000000);

  // Dark mode
  static const Color darkBackground = Color(0xFF121218);
  static const Color darkSurface = Color(0xFF1C1C24);
  static const Color darkText = Color(0xFFF5F3F0);
  static const Color darkMuted = Color(0xFFA0A0AC);
  static const Color darkBorder = Color(0xFF2C2C36);

  static const Color success = Color(0xFF2E9E5B);
  static const Color warning = Color(0xFFE8A93B);
  static const Color error = Color(0xFFE5484D);
}
