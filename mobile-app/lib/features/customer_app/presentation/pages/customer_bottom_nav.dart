import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomerBottomNav extends StatelessWidget {
  const CustomerBottomNav({super.key});

  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);

  @override
  Widget build(BuildContext context) {
    final items = [
      {'icon': Icons.home, 'label': 'Home', 'route': '/customer-app/dashboard'},
      {'icon': Icons.store, 'label': 'Stores', 'route': '/customer-app/stores'},
      {'icon': Icons.shopping_bag, 'label': 'Orders', 'route': '/customer-app/orders'},
      {'icon': Icons.notifications, 'label': 'Alerts', 'route': '/customer-app/notifications'},
      {'icon': Icons.person, 'label': 'Profile', 'route': '/customer-app/profile'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: items.map((item) {
            final currentPath = GoRouterState.of(context).uri.toString();
            final isActive = currentPath.startsWith(item['route'] as String);
            return GestureDetector(
              onTap: () => context.go(item['route'] as String),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item['icon'] as IconData, size: 22, color: isActive ? brandYellow : Colors.grey[400]),
                    const SizedBox(height: 2),
                    Text(
                      item['label'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 10, fontWeight: isActive ? FontWeight.w900 : FontWeight.w600,
                        color: isActive ? brandDark : Colors.grey[400],
                      ),
                    ),
                    if (isActive) ...[
                      const SizedBox(height: 2),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(color: brandYellow, shape: BoxShape.circle)),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
