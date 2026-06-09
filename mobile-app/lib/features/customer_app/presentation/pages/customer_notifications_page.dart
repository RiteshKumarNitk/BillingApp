import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_notifications_bloc.dart';
import '../../data/models/customer_notification_model.dart';

class CustomerNotificationsPage extends StatefulWidget {
  const CustomerNotificationsPage({super.key});

  @override
  State<CustomerNotificationsPage> createState() => _CustomerNotificationsPageState();
}

class _CustomerNotificationsPageState extends State<CustomerNotificationsPage> {
  static const Color brandDark = Color(0xFF2D2D2D);
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    context.read<CustomerNotificationsBloc>().add(LoadCustomerNotifications());
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.month - 1]}';
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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notifications', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
                      BlocBuilder<CustomerNotificationsBloc, CustomerNotificationsState>(
                        builder: (context, state) {
                          if (state is CustomerNotificationsLoaded) {
                            return Text(
                              state.unreadCount > 0 ? '${state.unreadCount} unread' : "You're all caught up",
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ],
                  ),
                  BlocBuilder<CustomerNotificationsBloc, CustomerNotificationsState>(
                    builder: (context, state) {
                      if (state is CustomerNotificationsLoaded && state.unreadCount > 0) {
                        return TextButton.icon(
                          onPressed: () => context.read<CustomerNotificationsBloc>().add(MarkAllNotificationsRead()),
                          icon: const Icon(Icons.done_all, size: 16),
                          label: Text('Mark all read', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                          style: TextButton.styleFrom(foregroundColor: Colors.indigo),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: ['all', 'unread'].map((f) {
                    final isActive = _filter == f;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _filter = f),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isActive ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: isActive ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
                          ),
                          child: Center(child: Text(f.toUpperCase(), style: GoogleFonts.inter(
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
              child: BlocBuilder<CustomerNotificationsBloc, CustomerNotificationsState>(
                builder: (context, state) {
                  if (state is CustomerNotificationsLoading) return const Center(child: CircularProgressIndicator());
                  if (state is CustomerNotificationsError) return Center(child: Text(state.message));
                  if (state is CustomerNotificationsLoaded) {
                    var items = state.notifications;
                    if (_filter == 'unread') items = items.where((n) => !n.isRead).toList();
                    if (items.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.notifications_none, size: 48, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text(_filter == 'unread' ? 'No unread notifications' : 'No notifications yet',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: brandDark)),
                    ]));
                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: items.length,
                      itemBuilder: (context, i) => _buildNotificationCard(items[i]),
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

  Widget _buildNotificationCard(CustomerNotification notif) {
    final typeConfig = {
      'ORDER_APPROVED': {'icon': Icons.check_circle, 'color': Colors.green},
      'ORDER_REJECTED': {'icon': Icons.cancel, 'color': Colors.red},
      'ORDER_PENDING': {'icon': Icons.access_time, 'color': Colors.amber},
      'ORDER_STATUS': {'icon': Icons.shopping_bag, 'color': Colors.indigo},
    };
    final config = typeConfig[notif.type] ?? {'icon': Icons.notifications, 'color': Colors.grey};
    final color = config['color'] as Color;
    final icon = config['icon'] as IconData;

    return GestureDetector(
      onTap: () => context.read<CustomerNotificationsBloc>().add(MarkNotificationRead(notificationId: notif.id)),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: notif.isRead ? Colors.white : Colors.indigo.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: notif.isRead ? Colors.grey[100]! : Colors.indigo.withValues(alpha: 0.2)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(notif.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w800, color: brandDark))),
                if (!notif.isRead) Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.indigo, shape: BoxShape.circle)),
              ]),
              const SizedBox(height: 2),
              Text(notif.message, style: GoogleFonts.inter(fontSize: 11, color: notif.isRead ? Colors.grey[400] : Colors.grey[600]), maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Row(children: [
                Text(_timeAgo(notif.createdAt), style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                if (notif.orderId != null) ...[
                  const SizedBox(width: 8),
                  Text('Order #${notif.orderId!.substring(0, 8)}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                ],
              ]),
            ],
          )),
        ]),
      ),
    );
  }
}
