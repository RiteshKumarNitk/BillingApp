import 'package:flutter/material.dart';

/// CafeOS's own product brand — used for app chrome (splash, onboarding, auth, discovery, cart,
/// checkout shell). Distinct from any individual cafe's own theme (see CafeTheme), the same way
/// Zomato/Swiggy have their own brand identity independent of any restaurant they list.
class AppColors {
  AppColors._();

  static const Color primary = Color(0xFFFF6B4A); // warm coral-orange — appetite, warmth, premium
  static const Color primaryDark = Color(0xFFE85A3A);
  static const Color secondary = Color(0xFF1A1D29); // deep charcoal-navy

  // Light mode
  static const Color lightBackground = Color(0xFFFFFBF8);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightText = Color(0xFF1A1D29);
  static const Color lightMuted = Color(0xFF6B7280);
  static const Color lightBorder = Color(0xFFEDE7E2);

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
