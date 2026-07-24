import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          if (state.status != AuthStatus.authenticated || state.customer == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.person_outline_rounded, size: 56, color: theme.textTheme.bodySmall?.color),
                    const SizedBox(height: 16),
                    Text('You\'re browsing as a guest', style: theme.textTheme.headlineMedium, textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    Text('Sign in to save favourites and track orders.', style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: 200,
                      child: ElevatedButton(onPressed: () => context.push('/login'), child: const Text('Sign In')),
                    ),
                    const SizedBox(height: 24),
                    const Divider(),
                    const SizedBox(height: 12),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.settings_outlined),
                      title: const Text('Settings'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/settings'),
                    ),
                  ],
                ),
              ),
            );
          }

          final customer = state.customer!;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: Text(
                  customer.name.isNotEmpty ? customer.name[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.primary, fontSize: 28, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 16),
              Text(customer.name, style: theme.textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(customer.email, style: theme.textTheme.bodyMedium),
              if (customer.phone != null) Text(customer.phone!, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 28),
              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.favorite_outline_rounded),
                title: const Text('Favourite Cafes'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/favorites'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.receipt_long_outlined),
                title: const Text('Order History'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.go('/orders'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.location_on_outlined),
                title: const Text('Manage Addresses'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/addresses'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.notifications_outlined),
                title: const Text('Notifications'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/notifications'),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.settings_outlined),
                title: const Text('Settings'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/settings'),
              ),
              const Divider(),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.read<AuthCubit>().logout(),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Log Out'),
              ),
            ],
          );
        },
      ),
    );
  }
}
