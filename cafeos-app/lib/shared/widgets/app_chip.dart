import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Category/filter pill — Menu's category rail, Search filters, Orders/Cafes/Map tabs. Animates
/// its own selected state (color + border) instead of a jump-cut.
///
/// Unselected chips render as a solid surface-colored pill with a soft shadow (matching the app's
/// card language) rather than a transparent fill + hairline border — the old border color
/// (`lightBorder #F0EBE6`) sat almost on top of the page background (`lightBackground #FAF8F6`,
/// ~3% luminance apart), so unselected chips were nearly invisible. This was a real bug, not just
/// low-contrast text.
class AppChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  const AppChip({super.key, required this.label, required this.selected, required this.onTap, this.icon});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primary = theme.colorScheme.primary;
    final unselectedFg = theme.colorScheme.onSurface;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? primary : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(999),
          border: selected
              ? null
              : Border.all(color: isDark ? theme.colorScheme.outline : Colors.transparent, width: 1),
          boxShadow: selected
              ? [BoxShadow(color: primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 3))]
              : isDark
                  ? null
                  : [BoxShadow(color: AppColors.lightCardShadow, blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 15, color: selected ? theme.colorScheme.onPrimary : unselectedFg),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? theme.colorScheme.onPrimary : unselectedFg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
