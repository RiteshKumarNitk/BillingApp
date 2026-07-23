import 'package:flutter/material.dart';
import '../../../../core/theme/cafe_theme.dart';
import '../../../cafes/domain/entities/cafe.dart';

/// Stand-in for the real Menu feature (next milestone — see the plan's build order). Confirms the
/// per-cafe theme carries through and that navigation from Cafe Details works end-to-end, without
/// pretending the ordering flow is built yet.
class MenuPlaceholderPage extends StatelessWidget {
  final Cafe cafe;
  const MenuPlaceholderPage({super.key, required this.cafe});

  @override
  Widget build(BuildContext context) {
    final cafeTheme = CafeTheme.build(cafe.appearance, brightness: MediaQuery.platformBrightnessOf(context));
    return Theme(
      data: cafeTheme,
      child: Scaffold(
        appBar: AppBar(title: Text(cafe.name)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.restaurant_menu_rounded, size: 48, color: cafeTheme.colorScheme.primary),
                const SizedBox(height: 16),
                Text('Menu ordering is next', style: cafeTheme.textTheme.headlineMedium, textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Text(
                  "${cafe.name}'s menu, cart, and checkout are the next build milestone.",
                  style: cafeTheme.textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
