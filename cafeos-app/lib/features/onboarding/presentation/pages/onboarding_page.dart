import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/di/service_locator.dart';

class _OnboardSlide {
  final IconData icon;
  final String title;
  final String description;
  const _OnboardSlide({required this.icon, required this.title, required this.description});
}

const _slides = [
  _OnboardSlide(
    icon: Icons.explore_outlined,
    title: 'Discover Cafes',
    description: 'Find great cafes nearby, or browse every cafe on CafeOS.',
  ),
  _OnboardSlide(
    icon: Icons.qr_code_scanner_rounded,
    title: 'Order with QR',
    description: 'Scan a table\'s QR code and start ordering in seconds — no app hunting required.',
  ),
  _OnboardSlide(
    icon: Icons.receipt_long_outlined,
    title: 'Track Orders',
    description: 'Follow your order from placed to ready, right from your phone.',
  ),
  _OnboardSlide(
    icon: Icons.bolt_rounded,
    title: 'Fast Checkout',
    description: 'Save your details once, order everywhere on CafeOS in a couple of taps.',
  ),
];

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageController = PageController();
  int _index = 0;

  void _finish() async {
    await sl<LocalStorageService>().setOnboardingSeen();
    if (mounted) context.go('/welcome');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _index == _slides.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 12, top: 4),
                child: TextButton(onPressed: _finish, child: const Text('Skip')),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  final slide = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 36),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                          child: Icon(slide.icon, size: 52, color: AppColors.primary),
                        ),
                        const SizedBox(height: 36),
                        Text(slide.title, style: Theme.of(context).textTheme.displayMedium, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        Text(slide.description, style: Theme.of(context).textTheme.bodyLarge, textAlign: TextAlign.center),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (i) {
                final active = i == _index;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active ? AppColors.primary : AppColors.primary.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLast ? _finish : () => _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut),
                  child: Text(isLast ? 'Get Started' : 'Next'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
