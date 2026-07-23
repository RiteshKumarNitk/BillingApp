import 'package:flutter/material.dart';
import '../../domain/entities/order.dart';

class _StatusStyle {
  final String label;
  final Color color;
  final IconData icon;
  const _StatusStyle(this.label, this.color, this.icon);
}

_StatusStyle _styleFor(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return const _StatusStyle('Pending', Color(0xFFE8A93B), Icons.hourglass_top_rounded);
    case OrderStatus.accepted:
      return const _StatusStyle('Accepted', Color(0xFF3B82C4), Icons.thumb_up_rounded);
    case OrderStatus.preparing:
      return const _StatusStyle('Preparing', Color(0xFF3B82C4), Icons.soup_kitchen_rounded);
    case OrderStatus.ready:
      return const _StatusStyle('Ready', Color(0xFF2E9E5B), Icons.check_circle_rounded);
    case OrderStatus.completed:
      return const _StatusStyle('Completed', Color(0xFF2E9E5B), Icons.done_all_rounded);
    case OrderStatus.rejected:
      return const _StatusStyle('Rejected', Color(0xFFE5484D), Icons.cancel_rounded);
    case OrderStatus.cancelled:
      return const _StatusStyle('Cancelled', Color(0xFFE5484D), Icons.block_rounded);
    case OrderStatus.unknown:
      return const _StatusStyle('Unknown', Color(0xFF6B7280), Icons.help_rounded);
  }
}

class OrderStatusChip extends StatelessWidget {
  final OrderStatus status;
  const OrderStatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final style = _styleFor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: style.color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(style.icon, size: 13, color: style.color),
          const SizedBox(width: 5),
          Text(style.label, style: TextStyle(color: style.color, fontSize: 11, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
