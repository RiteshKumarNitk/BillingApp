import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/theme/theme_mode_controller.dart';
import '../../../../core/utils/app_constants.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';
import '../../../authentication/presentation/cubit/auth_state.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late bool _pushEnabled = sl<LocalStorageService>().pushEnabled;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = context.watch<AuthCubit>().state;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Appearance', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          ValueListenableBuilder<ThemeMode>(
            valueListenable: sl<ThemeModeController>(),
            builder: (context, mode, _) => Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: theme.colorScheme.outline),
              ),
              child: Column(
                children: [
                  _ThemeModeOption(label: 'System default', icon: Icons.brightness_auto_rounded, mode: ThemeMode.system, current: mode),
                  const Divider(height: 1),
                  _ThemeModeOption(label: 'Light', icon: Icons.light_mode_rounded, mode: ThemeMode.light, current: mode),
                  const Divider(height: 1),
                  _ThemeModeOption(label: 'Dark', icon: Icons.dark_mode_rounded, mode: ThemeMode.dark, current: mode),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text('Notifications', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: SwitchListTile(
              value: _pushEnabled,
              onChanged: (value) {
                setState(() => _pushEnabled = value);
                sl<LocalStorageService>().setPushEnabled(value);
              },
              title: const Text('Push Notifications'),
              subtitle: const Text('Order updates — push delivery is coming soon; in-app notifications always work'),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
          ),
          if (authState.status == AuthStatus.authenticated) ...[
            const SizedBox(height: 28),
            Text('Account', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: theme.colorScheme.outline),
              ),
              child: ListTile(
                leading: const Icon(Icons.logout_rounded),
                title: const Text('Log Out'),
                onTap: () {
                  context.read<AuthCubit>().logout();
                  context.go('/home');
                },
              ),
            ),
          ],
          const SizedBox(height: 28),
          Text('About', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: Row(
              children: [
                Icon(Icons.local_cafe_rounded, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AppConstants.appName, style: theme.textTheme.titleMedium),
                      Text('Version ${AppConstants.appVersion}', style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ThemeModeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final ThemeMode mode;
  final ThemeMode current;
  const _ThemeModeOption({required this.label, required this.icon, required this.mode, required this.current});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = mode == current;
    return ListTile(
      leading: Icon(icon, color: selected ? theme.colorScheme.primary : null),
      title: Text(label),
      trailing: selected ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary) : null,
      onTap: () => sl<ThemeModeController>().setThemeMode(mode),
    );
  }
}
