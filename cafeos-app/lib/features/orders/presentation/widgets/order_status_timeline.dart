import 'package:flutter/material.dart';
import '../../domain/entities/order.dart';

const _happyPath = [OrderStatus.pending, OrderStatus.accepted, OrderStatus.preparing, OrderStatus.ready, OrderStatus.completed];
const _stepLabels = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Completed'];
const _stepIcons = [
  Icons.receipt_long_rounded,
  Icons.thumb_up_rounded,
  Icons.soup_kitchen_rounded,
  Icons.check_circle_rounded,
  Icons.done_all_rounded,
];

/// Vertical progress timeline for order tracking. A REJECTED/CANCELLED order gets a distinct
/// terminal banner instead of a partially-filled happy-path timeline, since it never continues.
class OrderStatusTimeline extends StatelessWidget {
  final OrderStatus status;
  const OrderStatusTimeline({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (status == OrderStatus.rejected || status == OrderStatus.cancelled) {
      final isRejected = status == OrderStatus.rejected;
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: theme.colorScheme.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            Icon(isRejected ? Icons.cancel_rounded : Icons.block_rounded, color: theme.colorScheme.error),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isRejected ? 'This order was rejected by the cafe.' : 'This order was cancelled.',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      );
    }

    final currentIndex = _happyPath.indexOf(status).clamp(0, _happyPath.length - 1);

    return Column(
      children: List.generate(_happyPath.length, (i) {
        final reached = i <= currentIndex;
        final isLast = i == _happyPath.length - 1;
        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: reached ? theme.colorScheme.primary : theme.colorScheme.outline.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_stepIcons[i], size: 15, color: reached ? theme.colorScheme.onPrimary : theme.textTheme.bodySmall?.color),
                  ),
                  if (!isLast)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: 2,
                        color: i < currentIndex ? theme.colorScheme.primary : theme.colorScheme.outline.withValues(alpha: 0.3),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24, top: 4),
                  child: Text(
                    _stepLabels[i],
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontSize: 14,
                      color: reached ? null : theme.textTheme.bodySmall?.color,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
