import 'package:flutter/material.dart';

/// Rounded pill +/- stepper used on Menu product cards, the product detail sheet, and Cart line
/// items. Animates size/opacity of the count so increments feel tactile instead of an instant
/// text swap.
class QuantityStepper extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;
  final bool compact;

  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 99,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = compact ? 28.0 : 34.0;

    return Container(
      height: size,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            size: size,
            onTap: value > min ? () => onChanged(value - 1) : null,
          ),
          SizedBox(
            width: compact ? 22 : 28,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
              child: Text(
                '$value',
                key: ValueKey(value),
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: theme.colorScheme.onPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: compact ? 13 : 14,
                ),
              ),
            ),
          ),
          _StepButton(
            icon: Icons.add_rounded,
            size: size,
            onTap: value < max ? () => onChanged(value + 1) : null,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final double size;
  final VoidCallback? onTap;
  const _StepButton({required this.icon, required this.size, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: size,
        height: size,
        child: Icon(icon, size: size * 0.5, color: onTap == null ? onPrimary.withValues(alpha: 0.4) : onPrimary),
      ),
    );
  }
}
