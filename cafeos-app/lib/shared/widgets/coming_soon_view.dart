import 'package:flutter/material.dart';

/// One shared "this feature lands in the next milestone" view, used by every tab/screen this
/// pass intentionally stubs out (Orders, Profile, Scanner) — honest placeholders, not silently
/// broken buttons, matching the plan's staged build order.
class ComingSoonView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const ComingSoonView({super.key, required this.icon, required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).textTheme.bodySmall?.color;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: muted),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(message, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: muted), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
