import 'package:flutter/material.dart';

/// Floating, rounded snackbars for success/error feedback (item added to cart, order placed,
/// favourite toggled, network error) — one consistent look instead of the default Material
/// snackbar bar.
class AppToast {
  AppToast._();

  static void success(BuildContext context, String message) => _show(context, message, icon: Icons.check_circle_rounded, color: const Color(0xFF2E9E5B));

  static void error(BuildContext context, String message) => _show(context, message, icon: Icons.error_rounded, color: const Color(0xFFE5484D));

  static void _show(BuildContext context, String message, {required IconData icon, required Color color}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: color,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
          ],
        ),
      ),
    );
  }
}
