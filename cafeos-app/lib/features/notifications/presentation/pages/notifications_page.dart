import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';
import '../../domain/entities/app_notification.dart';
import '../cubit/notifications_cubit.dart';
import '../cubit/notifications_state.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthCubit>().state;
    if (authState.status != AuthStatus.authenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: const EmptyStateView(
          icon: Icons.notifications_none_rounded,
          title: 'Sign in to see notifications',
          message: 'Order updates and news from your cafes will show up here once you sign in.',
        ),
      );
    }

    return BlocProvider(
      create: (_) => sl<NotificationsCubit>()..loadNotifications(),
      child: const _NotificationsView(),
    );
  }
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          BlocBuilder<NotificationsCubit, NotificationsState>(
            builder: (context, state) => state.unreadCount > 0
                ? TextButton(
                    onPressed: () => context.read<NotificationsCubit>().markAllRead(),
                    child: const Text('Mark all read'),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
      body: BlocBuilder<NotificationsCubit, NotificationsState>(
        builder: (context, state) {
          if (state.status == NotificationsStatus.loading || state.status == NotificationsStatus.initial) {
            return AppShimmer(
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, __) => ShimmerBox(height: 76, borderRadius: BorderRadius.circular(16)),
              ),
            );
          }
          if (state.status == NotificationsStatus.error) {
            return ErrorStateView(message: state.errorMessage ?? 'Could not load notifications', onRetry: () => context.read<NotificationsCubit>().loadNotifications());
          }
          if (state.notifications.isEmpty) {
            return const EmptyStateView(icon: Icons.notifications_none_rounded, title: 'No notifications', message: 'Order updates and news from your cafes will show up here.');
          }
          return RefreshIndicator(
            onRefresh: () => context.read<NotificationsCubit>().loadNotifications(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _NotificationTile(notification: state.notifications[i]),
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  const _NotificationTile({required this.notification});

  IconData get _icon {
    switch (notification.type) {
      case NotificationType.orderStatus:
        return Icons.receipt_long_rounded;
      case NotificationType.promotion:
        return Icons.local_offer_rounded;
      case NotificationType.general:
      case NotificationType.unknown:
        return Icons.campaign_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        context.read<NotificationsCubit>().markRead(notification.id);
        if (notification.orderId != null) context.push('/orders/${notification.orderId}');
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: notification.isRead ? theme.colorScheme.surface : theme.colorScheme.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(_icon, size: 18, color: theme.colorScheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(notification.title, style: theme.textTheme.titleMedium?.copyWith(fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(notification.message, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  Text(DateFormat('MMM d, h:mm a').format(notification.createdAt), style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            if (!notification.isRead)
              Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 4), decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle)),
          ],
        ),
      ),
    );
  }
}
