import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/billing/presentation/pages/home_page.dart';
import '../../../../features/product/presentation/pages/product_list_page.dart';
import '../../../../features/billing/presentation/pages/sales_history_page.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const ProductListPage(),
    const SalesHistoryPage(),
    const _MenuPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.point_of_sale),
            label: 'Billing',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2),
            label: 'Products',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics),
            label: 'Reports',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu),
            label: 'Menu',
          ),
        ],
      ),
    );
  }
}

class _MenuPage extends StatelessWidget {
  const _MenuPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('More Options', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildMenuCategory(context, 'Business', [
            _MenuItem(icon: Icons.shopping_bag, title: 'Order Requests', route: '/order-queue', color: Colors.indigo),
            _MenuItem(icon: Icons.store, title: 'Shop Details', route: '/shop', color: Colors.brown),
            _MenuItem(icon: Icons.qr_code_2, title: 'Digital Menu QR', route: '/digital-menu', color: Colors.green),
            _MenuItem(icon: Icons.people, title: 'Customers', route: '/customers', color: Colors.blue),
            _MenuItem(icon: Icons.local_offer, title: 'Discounts', route: '/discounts', color: Colors.purple),
          ]),
          const SizedBox(height: 16),
          _buildMenuCategory(context, 'Inventory Tools', [
            _MenuItem(icon: Icons.qr_code, title: 'Barcode Labels', route: '/barcode-labels', color: Colors.teal),
            _MenuItem(icon: Icons.warning_amber, title: 'Expiry Alerts', route: '/expiry-alerts', color: Colors.red),
            _MenuItem(icon: Icons.document_scanner, title: 'Bulk Import', route: '/products/bulk-import', color: Colors.cyan),
          ]),
          const SizedBox(height: 16),
          _buildMenuCategory(context, 'Team Management', [
            _MenuItem(icon: Icons.group, title: 'Users (Web Auth)', route: '/users', color: Colors.indigo),
            _MenuItem(icon: Icons.badge, title: 'Employees (App PIN)', route: '/employees', color: Colors.blueGrey),
            _MenuItem(icon: Icons.shield, title: 'Roles', route: '/roles', color: Colors.deepPurple),
          ]),
          const SizedBox(height: 16),
          _buildMenuCategory(context, 'System', [
            _MenuItem(icon: Icons.settings, title: 'Settings', route: '/settings', color: Colors.grey[700]!),
          ]),
        ],
      ),
    );
  }

  Widget _buildMenuCategory(BuildContext context, String title, List<_MenuItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final isLast = entry.key == items.length - 1;
              final item = entry.value;
              return Column(
                children: [
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: item.color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(item.icon, color: item.color, size: 20),
                    ),
                    title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
                    onTap: () => context.push(item.route),
                  ),
                  if (!isLast) const Divider(height: 1, indent: 56),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String route;
  final Color color;

  _MenuItem({required this.icon, required this.title, required this.route, required this.color});
}
