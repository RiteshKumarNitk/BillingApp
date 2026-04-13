import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Billing App',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withValues(alpha: 0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.0,
              ),
              delegate: SliverChildListDelegate([
                _DashboardCard(
                  icon: Icons.qr_code_scanner,
                  title: 'Scan Bill',
                  subtitle: 'Start new billing',
                  color: AppTheme.primaryColor,
                  onTap: () => context.go('/'),
                ),
                _DashboardCard(
                  icon: Icons.analytics,
                  title: 'Reports',
                  subtitle: 'Sales history',
                  color: Colors.orange,
                  onTap: () => context.push('/sales-history'),
                ),
                _DashboardCard(
                  icon: Icons.inventory_2,
                  title: 'Products',
                  subtitle: 'Manage inventory',
                  color: Colors.teal,
                  onTap: () => context.push('/products'),
                ),
                _DashboardCard(
                  icon: Icons.people,
                  title: 'Customers',
                  subtitle: 'Customer list',
                  color: Colors.blue,
                  onTap: () => context.push('/customers'),
                ),
                _DashboardCard(
                  icon: Icons.local_offer,
                  title: 'Discounts',
                  subtitle: 'Offers & deals',
                  color: Colors.purple,
                  onTap: () => context.push('/discounts'),
                ),
                _DashboardCard(
                  icon: Icons.warning_amber,
                  title: 'Expiry Alerts',
                  subtitle: 'Stock expiry',
                  color: Colors.red,
                  onTap: () => context.push('/expiry-alerts'),
                ),
                _DashboardCard(
                  icon: Icons.settings,
                  title: 'Settings',
                  subtitle: 'Configuration',
                  color: Colors.grey[700]!,
                  onTap: () => context.push('/settings'),
                ),
                _DashboardCard(
                  icon: Icons.document_scanner,
                  title: 'Bulk Import',
                  subtitle: 'OCR Scan',
                  color: Colors.cyan,
                  onTap: () => context.push('/products/bulk-import'),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _DashboardCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.15),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: color, size: 28),
                ),
                const SizedBox(height: 14),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
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
