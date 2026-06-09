import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_dashboard_bloc.dart';
import '../bloc/customer_auth_bloc.dart';
import '../../data/models/customer_dashboard_model.dart';

class CustomerDashboardPage extends StatefulWidget {
  const CustomerDashboardPage({super.key});

  @override
  State<CustomerDashboardPage> createState() => _CustomerDashboardPageState();
}

class _CustomerDashboardPageState extends State<CustomerDashboardPage> {
  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);
  static const Color brandBg = Color(0xFFFFFDF5);

  @override
  void initState() {
    super.initState();
    context.read<CustomerDashboardBloc>().add(LoadCustomerDashboard());
  }

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return Scaffold(
      backgroundColor: brandBg,
      body: BlocBuilder<CustomerAuthBloc, CustomerAuthState>(
        builder: (context, authState) {
          final name = authState is CustomerAuthAuthenticated ? authState.user.name.split(' ').first : 'Customer';
          return SafeArea(
            child: RefreshIndicator(
              onRefresh: () async { context.read<CustomerDashboardBloc>().add(LoadCustomerDashboard()); },
              color: brandYellow,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(greeting, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey[500])),
                            Text('$name 👋', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: brandDark)),
                          ],
                        ),
                        IconButton(
                          onPressed: () { context.read<CustomerAuthBloc>().add(CustomerAuthLogout()); context.go('/customer-app/login'); },
                          icon: Icon(Icons.logout, color: Colors.grey[400]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _buildSectionTitle('Quick Actions'),
                    const SizedBox(height: 12),
                    _buildQuickActions(),
                    const SizedBox(height: 24),
                    BlocBuilder<CustomerDashboardBloc, CustomerDashboardState>(
                      builder: (context, state) {
                        if (state is CustomerDashboardLoading) return const Center(child: CircularProgressIndicator());
                        if (state is CustomerDashboardLoaded) return _buildStats(state.data.stats);
                        if (state is CustomerDashboardError) return Center(child: Text(state.message));
                        return const SizedBox.shrink();
                      },
                    ),
                    const SizedBox(height: 24),
                    BlocBuilder<CustomerDashboardBloc, CustomerDashboardState>(
                      builder: (context, state) {
                        if (state is CustomerDashboardLoaded && state.data.stores.isNotEmpty) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionTitle('Your Stores', trailing: GestureDetector(
                                onTap: () => context.go('/customer-app/stores'),
                                child: Text('View All →', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: brandYellow)),
                              )),
                              const SizedBox(height: 12),
                              ...state.data.stores.take(3).map((store) => _buildStoreCard(store)),
                            ],
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                    BlocBuilder<CustomerDashboardBloc, CustomerDashboardState>(
                      builder: (context, state) {
                        if (state is CustomerDashboardLoaded && state.data.recentOrders.isNotEmpty) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              _buildSectionTitle('Recent Orders', trailing: GestureDetector(
                                onTap: () => context.go('/customer-app/orders'),
                                child: Text('View All →', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: brandYellow)),
                              )),
                              const SizedBox(height: 12),
                              ...state.data.recentOrders.take(3).map((order) => _buildOrderCard(order)),
                            ],
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title, {Widget? trailing}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900, color: brandDark)),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {'icon': Icons.store, 'label': 'Stores', 'route': '/customer-app/stores', 'color': Colors.blue},
      {'icon': Icons.shopping_bag, 'label': 'Orders', 'route': '/customer-app/orders', 'color': Colors.green},
      {'icon': Icons.notifications, 'label': 'Alerts', 'route': '/customer-app/notifications', 'color': Colors.orange},
      {'icon': Icons.person, 'label': 'Profile', 'route': '/customer-app/profile', 'color': Colors.purple},
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: actions.map((a) => GestureDetector(
        onTap: () => context.go(a['route'] as String),
        child: Column(children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [(a['color'] as Color), (a['color'] as Color).withValues(alpha: 0.8)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(a['icon'] as IconData, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 6),
          Text(a['label'] as String, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: brandDark)),
        ]),
      )).toList(),
    );
  }

  Widget _buildStats(CustomerDashboardStats stats) {
    return Row(
      children: [
        _buildStatChip('${stats.totalOrders}', 'Orders', Icons.shopping_bag, Colors.indigo),
        const SizedBox(width: 8),
        _buildStatChip('${stats.loyaltyPoints}', 'Points', Icons.star, Colors.amber),
        const SizedBox(width: 8),
        _buildStatChip('₹${stats.totalSpent.round()}', 'Spent', Icons.trending_up, Colors.green),
      ],
    );
  }

  Widget _buildStatChip(String value, String label, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey[100]!)),
        child: Column(children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
          Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey[500])),
        ]),
      ),
    );
  }

  Widget _buildStoreCard(CustomerStoreSummary store) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey[100]!)),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: brandYellow.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.store, color: Colors.blue, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(store.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
            Text('${store.orderCount} orders', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
        )),
        const Icon(Icons.chevron_right, color: Colors.grey),
      ]),
    );
  }

  Widget _buildOrderCard(CustomerOrderSummary order) {
    final statusColors = {
      'PENDING': Colors.amber, 'APPROVED': Colors.blue,
      'COMPLETED': Colors.green, 'REJECTED': Colors.red,
    };
    final color = statusColors[order.status] ?? Colors.grey;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey[100]!)),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(Icons.receipt_long, color: color, size: 22),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(order.storeName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
            Text('${order.items.length} items • ${_formatDate(order.createdAt)}', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
        )),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('₹${order.netAmount.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: brandDark)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
              child: Text(order.status, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
            ),
          ],
        ),
      ]),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.month - 1]}';
  }
}
