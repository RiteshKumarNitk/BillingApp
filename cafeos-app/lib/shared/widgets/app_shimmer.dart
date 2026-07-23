import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Shared skeleton-loading wrapper — the "premium production-ready" bar means loading states are
/// shaped placeholders, not a bare spinner. Colors adapt to light/dark automatically.
class AppShimmer extends StatelessWidget {
  final Widget child;
  const AppShimmer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? const Color(0xFF23232C) : const Color(0xFFEDE9E4),
      highlightColor: isDark ? const Color(0xFF2E2E3A) : const Color(0xFFF7F4F1),
      child: child,
    );
  }
}

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerBox({super.key, this.width = double.infinity, required this.height, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: Colors.white, borderRadius: borderRadius ?? BorderRadius.circular(12)),
    );
  }
}
