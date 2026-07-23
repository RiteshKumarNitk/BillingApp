import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Auto-advancing hero carousel with dot indicators — Home's top banner, built from real cafe
/// cover images (not stock/fabricated promotional art).
class ImageCarousel extends StatefulWidget {
  final List<Widget Function(BuildContext)> slideBuilders;
  final double height;
  final Duration autoAdvance;

  const ImageCarousel({super.key, required this.slideBuilders, this.height = 180, this.autoAdvance = const Duration(seconds: 5)});

  @override
  State<ImageCarousel> createState() => _ImageCarouselState();
}

class _ImageCarouselState extends State<ImageCarousel> {
  late final PageController _controller;
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    if (widget.slideBuilders.length > 1) {
      _timer = Timer.periodic(widget.autoAdvance, (_) {
        if (!mounted) return;
        final next = (_index + 1) % widget.slideBuilders.length;
        _controller.animateToPage(next, duration: const Duration(milliseconds: 500), curve: Curves.easeInOutCubic);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.slideBuilders.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: widget.height,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: widget.slideBuilders.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) => ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: widget.slideBuilders[i](context),
            ),
          ),
          if (widget.slideBuilders.length > 1)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(widget.slideBuilders.length, (i) {
                  final active = i == _index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: active ? 0.95 : 0.5),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

class CarouselCoverImage extends StatelessWidget {
  final String? imageUrl;
  final Widget overlay;
  const CarouselCoverImage({super.key, required this.imageUrl, required this.overlay});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        imageUrl != null
            ? CachedNetworkImage(imageUrl: imageUrl!, fit: BoxFit.cover)
            : Container(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2)),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black.withValues(alpha: 0.65)],
            ),
          ),
        ),
        Padding(padding: const EdgeInsets.all(16), child: Align(alignment: Alignment.bottomLeft, child: overlay)),
      ],
    );
  }
}
