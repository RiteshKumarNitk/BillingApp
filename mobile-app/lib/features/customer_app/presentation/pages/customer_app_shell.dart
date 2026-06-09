import 'package:flutter/material.dart';
import 'customer_bottom_nav.dart';

class CustomerAppShell extends StatelessWidget {
  final Widget child;
  const CustomerAppShell({super.key, required this.child});

  static const Color brandBg = Color(0xFFFFFDF5);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: brandBg,
      body: child,
      bottomNavigationBar: const CustomerBottomNav(),
    );
  }
}
