import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/order_queue_bloc.dart';
import '../../data/models/order_request_model.dart';

class OrderQueuePage extends StatefulWidget {
  const OrderQueuePage({super.key});

  @override
  State<OrderQueuePage> createState() => _OrderQueuePageState();
}

class _OrderQueuePageState extends State<OrderQueuePage> {
  static const Color primaryColor = Color(0xFF6366F1);
  static const Color brandDark = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    context.read<OrderQueueBloc>().add(LoadOrders());
  }

  void _showOrderDetail(OrderRequest order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _OrderDetailSheet(
        order: order,
        onApprove: () {
          Navigator.pop(context);
          context.read<OrderQueueBloc>().add(ApproveOrder(orderId: order.id));
        },
        onReject: () {
          Navigator.pop(context);
          _confirmReject(order);
        },
      ),
    );
  }

  void _confirmReject(OrderRequest order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Reject Order?', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
        content: Text('This will notify the customer that their order has been rejected.',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600])),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter())),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<OrderQueueBloc>().add(RejectOrder(orderId: order.id));
            },
            child: Text('Reject', style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: BlocConsumer<OrderQueueBloc, OrderQueueState>(
        listener: (context, state) {
          if (state is OrderQueueError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
            );
          }
        },
        builder: (context, state) {
          if (state is OrderQueueLoading) return const Center(child: CircularProgressIndicator());
          if (state is OrderQueueError) return Center(child: Text(state.message, style: GoogleFonts.inter(color: Colors.grey[600])));
          if (state is OrderQueueLoaded) return _buildContent(state);
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildContent(OrderQueueLoaded state) {
    final tabs = [
      {'key': 'PENDING', 'label': 'Pending', 'icon': Icons.access_time},
      {'key': 'COMPLETED', 'label': 'Completed', 'icon': Icons.check_circle},
      {'key': 'REJECTED', 'label': 'Rejected', 'icon': Icons.cancel},
    ];

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 8, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Order Requests', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
              const SizedBox(height: 4),
              Text('Manage online orders from customers', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
              const SizedBox(height: 12),
            ],
          ),
        ),
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Row(
            children: tabs.map((tab) {
              final isActive = state.activeStatus == tab['key'];
              final count = state.statusCounts[tab['key']] ?? 0;
              return Expanded(
                child: GestureDetector(
                  onTap: () => context.read<OrderQueueBloc>().add(LoadOrders(status: tab['key'] as String)),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isActive ? primaryColor : Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isActive ? primaryColor : Colors.grey[200]!),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(tab['icon'] as IconData, size: 14, color: isActive ? Colors.white : Colors.grey[500]),
                        const SizedBox(width: 6),
                        Text(tab['label'] as String, style: GoogleFonts.inter(
                          fontSize: 12, fontWeight: FontWeight.w700,
                          color: isActive ? Colors.white : Colors.grey[600],
                        )),
                        if (count > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isActive ? Colors.white.withValues(alpha: 0.2) : Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('$count', style: GoogleFonts.inter(
                              fontSize: 10, fontWeight: FontWeight.w800,
                              color: isActive ? Colors.white : Colors.grey[600],
                            )),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: state.orders.isEmpty
              ? Center(child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.shopping_bag, size: 48, color: Colors.grey[300]),
                    const SizedBox(height: 12),
                    Text('No ${state.activeStatus.toLowerCase()} orders', style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey[500],
                    )),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: () async => context.read<OrderQueueBloc>().add(LoadOrders(status: state.activeStatus)),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: state.orders.length,
                    itemBuilder: (context, i) => _buildOrderCard(state.orders[i], state.processingOrderId),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildOrderCard(OrderRequest order, String? processingOrderId) {
    final statusColor = order.status == 'PENDING'
        ? Colors.amber
        : order.status == 'COMPLETED' ? Colors.green : Colors.red;
    final isProcessing = processingOrderId == order.id;

    return GestureDetector(
      onTap: () => order.status == 'PENDING' ? _showOrderDetail(order) : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[100]!),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Icon(order.status == 'PENDING' ? Icons.access_time : order.status == 'COMPLETED' ? Icons.check_circle : Icons.cancel,
                        size: 18, color: statusColor),
                  ),
                  const SizedBox(width: 10),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('#${order.id.substring(0, 8)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: brandDark)),
                    Text(order.customerName ?? 'Guest', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                  ]),
                ]),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('₹${order.netAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900, color: brandDark)),
                  Text(_formatTime(order.createdAt), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                ]),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
              child: Column(children: [
                ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text('${item.name} × ${item.quantity.toInt()}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700]))),
                      Text('₹${item.itemTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: brandDark)),
                    ],
                  ),
                )),
                if (order.notes != null && order.notes!.isNotEmpty) ...[
                  const Divider(height: 12),
                  Text('Note: ${order.notes}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[500], fontStyle: FontStyle.italic)),
                ],
              ]),
            ),
            if (order.status == 'PENDING') ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: GestureDetector(
                    onTap: isProcessing ? null : () {
                      context.read<OrderQueueBloc>().add(ApproveOrder(orderId: order.id));
                    },
                    child: Opacity(
                      opacity: isProcessing ? 0.5 : 1.0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(12)),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          if (isProcessing)
                            const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          else ...[
                            const Icon(Icons.check, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                          ],
                          Text('Approve', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
                        ]),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: isProcessing ? null : () => _confirmReject(order),
                  child: Opacity(
                    opacity: isProcessing ? 0.5 : 1.0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.close, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text('Reject', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey[600])),
                      ]),
                    ),
                  ),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _OrderDetailSheet extends StatelessWidget {
  static const Color brandDark = Color(0xFF1E293B);

  final OrderRequest order;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _OrderDetailSheet({required this.order, required this.onApprove, required this.onReject});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(
        children: [
          Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Text('Order #${order.id.substring(0, 8)}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: brandDark)),
              const Spacer(),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ]),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.indigo.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.indigo.withValues(alpha: 0.1),
                child: Text((order.customerName ?? 'G')[0].toUpperCase(),
                    style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: Colors.indigo)),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(order.customerName ?? 'Guest', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: brandDark)),
                if (order.customerPhone != null) Text(order.customerPhone!, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
              ])),
            ]),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                Text('ITEMS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey[400])),
                const SizedBox(height: 8),
                ...order.items.map((item) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(item.name, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: brandDark)),
                      Text('₹${item.salePrice.toStringAsFixed(0)} × ${item.quantity.toInt()}', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                    ])),
                    Text('₹${item.itemTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: brandDark)),
                  ]),
                )),
                if (order.notes != null && order.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      Icon(Icons.note, size: 16, color: Colors.amber[700]),
                      const SizedBox(width: 8),
                      Expanded(child: Text(order.notes!, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700]))),
                    ]),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey[100]!))),
            child: Column(children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Total', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
                Text('₹${order.netAmount.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: brandDark)),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: onApprove,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green, foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.check, size: 18),
                      const SizedBox(width: 8),
                      Text('Approve & Invoice', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
                    ]),
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: onReject,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[100], foregroundColor: Colors.grey[700],
                    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Reject', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                ),
              ]),
            ]),
          ),
        ],
      ),
    );
  }
}
