import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_shimmer.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';
import '../../domain/entities/customer_address.dart';
import '../cubit/addresses_cubit.dart';
import '../cubit/addresses_state.dart';

class AddressesPage extends StatelessWidget {
  const AddressesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthCubit>().state;
    if (authState.status != AuthStatus.authenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Manage Addresses')),
        body: const EmptyStateView(
          icon: Icons.location_on_outlined,
          title: 'Sign in to manage addresses',
          message: 'Save addresses to your account so they\'re ready for you.',
        ),
      );
    }

    return BlocProvider(
      create: (_) => sl<AddressesCubit>()..loadAddresses(),
      child: const _AddressesView(),
    );
  }
}

class _AddressesView extends StatelessWidget {
  const _AddressesView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final saved = await context.push<bool>('/addresses/new');
          if (saved == true && context.mounted) context.read<AddressesCubit>().loadAddresses();
        },
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Address'),
      ),
      body: BlocConsumer<AddressesCubit, AddressesState>(
        listener: (context, state) {
          if (state.status == AddressesStatus.error && state.errorMessage != null) {
            AppToast.error(context, state.errorMessage!);
          }
        },
        builder: (context, state) {
          if (state.status == AddressesStatus.loading || state.status == AddressesStatus.initial) {
            return AppShimmer(
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 3,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => ShimmerBox(height: 104, borderRadius: BorderRadius.circular(16)),
              ),
            );
          }
          if (state.status == AddressesStatus.error && state.addresses.isEmpty) {
            return ErrorStateView(message: state.errorMessage ?? 'Could not load your addresses', onRetry: () => context.read<AddressesCubit>().loadAddresses());
          }
          if (state.addresses.isEmpty) {
            return const EmptyStateView(
              icon: Icons.location_on_outlined,
              title: 'No saved addresses',
              message: 'Add an address to have it ready for whenever delivery becomes available.',
            );
          }
          return RefreshIndicator(
            onRefresh: () => context.read<AddressesCubit>().loadAddresses(),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: state.addresses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _AddressCard(address: state.addresses[i]),
            ),
          );
        },
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final CustomerAddress address;
  const _AddressCard({required this.address});

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete address?'),
        content: Text('Remove "${address.label ?? address.fullAddress}" from your saved addresses?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final failure = await context.read<AddressesCubit>().deleteAddress(address.id);
    if (!context.mounted) return;
    if (failure != null) AppToast.error(context, failure.message);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: address.isDefault ? theme.colorScheme.primary : theme.colorScheme.outline, width: address.isDefault ? 1.5 : 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.location_on_rounded, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(address.label?.isNotEmpty == true ? address.label! : 'Address', style: theme.textTheme.titleMedium),
                    if (address.isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                        child: Text('Default', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(address.fullAddress, style: theme.textTheme.bodyMedium),
                if (address.landmark?.isNotEmpty == true) Text(address.landmark!, style: theme.textTheme.bodySmall),
                if (address.cityStateLine.isNotEmpty) Text(address.cityStateLine, style: theme.textTheme.bodySmall),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (!address.isDefault)
                      TextButton(
                        onPressed: () => context.read<AddressesCubit>().setDefault(address.id),
                        style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                        child: const Text('Set as default'),
                      ),
                    TextButton(
                      onPressed: () async {
                        final saved = await context.push<bool>('/addresses/${address.id}/edit', extra: address);
                        if (saved == true && context.mounted) context.read<AddressesCubit>().loadAddresses();
                      },
                      style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                      child: const Text('Edit'),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => _confirmDelete(context),
                      style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32), foregroundColor: theme.colorScheme.error),
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
