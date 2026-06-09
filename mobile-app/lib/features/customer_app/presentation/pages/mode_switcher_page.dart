import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class ModeSwitcherPage extends StatelessWidget {
  const ModeSwitcherPage({super.key});

  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);
  static const Color brandBg = Color(0xFFFFFDF5);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: brandBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(flex: 2),
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  color: brandDark, borderRadius: BorderRadius.circular(24),
                  boxShadow: [BoxShadow(color: brandDark.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: const Center(child: Icon(Icons.receipt_long, color: brandYellow, size: 40)),
              ),
              const SizedBox(height: 20),
              Text('BillingApp', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w900, color: brandDark)),
              Text('Choose how you want to use the app', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500])),
              const Spacer(flex: 3),
              _buildModeCard(
                context,
                icon: Icons.store_mall_directory,
                title: 'Merchant Mode',
                subtitle: 'Manage your store, billing, inventory & team',
                gradient: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                onTap: () => context.go('/login'),
              ),
              const SizedBox(height: 16),
              _buildModeCard(
                context,
                icon: Icons.shopping_bag,
                title: 'Customer Mode',
                subtitle: 'Browse stores, place orders & track deliveries',
                gradient: [brandYellow, brandYellow],
                titleColor: brandDark,
                onTap: () => context.go('/customer-app/login'),
              ),
              const Spacer(flex: 2),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModeCard(BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> gradient,
    required VoidCallback onTap,
    Color titleColor = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: gradient[0].withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Row(
          children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: titleColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: titleColor)),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: titleColor.withValues(alpha: 0.7))),
              ],
            )),
            Icon(Icons.arrow_forward_ios, color: titleColor.withValues(alpha: 0.5), size: 18),
          ],
        ),
      ),
    );
  }
}
