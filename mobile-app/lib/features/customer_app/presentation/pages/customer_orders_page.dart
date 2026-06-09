import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_orders_bloc.dart';
import '../../data/models/customer_order_model.dart';

class CustomerOrdersPage extends StatefulWidget {
  const CustomerOrdersPage({super.key});

  @override
  State<CustomerOrdersPage> createState() => _CustomerOrdersPageState();
}

class _CustomerOrdersPageState extends State<CustomerOrdersPage> {
  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);
  String _activeTab = 'ALL';
  String? _expandedOrder;

  @override
  void initState() {
    super.initState();
    context.read<CustomerOrdersBloc>().add(LoadCustomerOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFDF5),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('My Orders', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
                  const SizedBox(height: 4),
                  Text('Track all your order requests', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: ['ALL', 'PENDING', 'COMPLETED', 'REJECTED'].map((tab) {
                    final isActive = _activeTab == tab;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _activeTab = tab),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isActive ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: isActive ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
                          ),
                          child: Center(child: Text(tab, style: GoogleFonts.inter(
                            fontSize: 11, fontWeight: FontWeight.w700,
                            color: isActive ? brandDark : Colors.grey[500],
                          ))),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: BlocBuilder<CustomerOrdersBloc, CustomerOrdersState>(
                builder: (context, state) {
                  if (state is CustomerOrdersLoading) return const Center(child: CircularProgressIndicator());
                  if (state is CustomerOrdersError) return Center(child: Text(state.message));
                  if (state is CustomerOrdersLoaded) {
                    final filtered = _activeTab == 'ALL'
                        ? state.orders
                        : state.orders.where((o) => o.status == _activeTab).toList();
                    if (filtered.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.shopping_bag_outlined, size: 48, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('No orders yet', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: brandDark)),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => context.go('/customer-app/stores'),
                        child: Text('Browse stores', style: GoogleFonts.inter(fontSize: 12, color: brandYellow, fontWeight: FontWeight.w700)),
                      ),
                    ]));
                    return RefreshIndicator(
                      onRefresh: () async { context.read<CustomerOrdersBloc>().add(RefreshCustomerOrders()); },
                      color: brandYellow,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) => _buildOrderCard(filtered[i]),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(CustomerOrder order) {
    final isExpanded = _expandedOrder == order.id;
    final statusConfig = {
      'PENDING': {'color': Colors.amber, 'label': 'Pending'},
      'APPROVED': {'color': Colors.blue, 'label': 'Approved'},
      'COMPLETED': {'color': Colors.green, 'label': 'Completed'},
      'REJECTED': {'color': Colors.red, 'label': 'Rejected'},
    };
    final config = statusConfig[order.status] ?? {'color': Colors.grey, 'label': order.status};
    final statusColor = config['color'] as Color;

    return GestureDetector(
      onTap: () => setState(() => _expandedOrder = isExpanded ? null : order.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isExpanded ? statusColor.withValues(alpha: 0.3) : Colors.grey[100]!, width: isExpanded ? 1.5 : 1),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.receipt_long, color: statusColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.storeName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
                    Text('#${order.id.substring(0, 8)}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                  ],
                )),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹${order.netAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: brandDark)),
                    Text(_formatDate(order.createdAt), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                  ],
                ),
                const SizedBox(width: 8),
                Icon(isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: Colors.grey[400]),
              ]),
            ),
            if (isExpanded) _buildExpandedContent(order, config),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedContent(CustomerOrder order, Map<String, dynamic> config) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
            child: Column(children: order.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${item.name} × ${item.quantity}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700])),
                  Text('₹${item.itemTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: brandDark)),
                ],
              ),
            )).toList()),
          ),
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Subtotal', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
            Text('₹${order.totalAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
          ]),
          if (order.taxAmount > 0) Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Tax', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
            Text('₹${order.taxAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
          ]),
          const Divider(),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Total', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: brandDark)),
            Text('₹${order.netAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: brandDark)),
          ]),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.go('/customer-app/stores'),
              style: ElevatedButton.styleFrom(
                backgroundColor: brandYellow, foregroundColor: brandDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: Text('Reorder from ${order.storeName}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.month - 1]}';
  }
}
