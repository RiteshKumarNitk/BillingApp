import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../authentication/domain/entities/customer.dart';
import '../../../authentication/presentation/cubit/auth_cubit.dart';

class EditProfilePage extends StatefulWidget {
  final Customer customer;
  const EditProfilePage({super.key, required this.customer});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.customer.name);
  late final _phoneController = TextEditingController(text: widget.customer.phone ?? '');
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _changePassword = false;
  bool _obscure = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _isSubmitting = true);
    final failure = await context.read<AuthCubit>().updateProfile(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
          currentPassword: _changePassword ? _currentPasswordController.text : null,
          newPassword: _changePassword ? _newPasswordController.text : null,
        );
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (failure != null) {
      AppToast.error(context, failure.message);
      return;
    }
    AppToast.success(context, 'Profile updated');
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextField(
                controller: _nameController,
                label: 'Full name',
                prefixIcon: Icons.person_outline_rounded,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter your name' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _phoneController,
                label: 'Phone (optional)',
                keyboardType: TextInputType.phone,
                prefixIcon: Icons.phone_outlined,
              ),
              const SizedBox(height: 8),
              Text('Email: ${widget.customer.email}', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 20),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _changePassword,
                onChanged: (v) => setState(() => _changePassword = v),
                title: const Text('Change password'),
              ),
              if (_changePassword) ...[
                const SizedBox(height: 8),
                AppTextField(
                  controller: _currentPasswordController,
                  label: 'Current password',
                  obscureText: _obscure,
                  prefixIcon: Icons.lock_outline_rounded,
                  validator: (v) => _changePassword && (v == null || v.isEmpty) ? 'Enter your current password' : null,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  controller: _newPasswordController,
                  label: 'New password',
                  obscureText: _obscure,
                  prefixIcon: Icons.lock_outline_rounded,
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (v) => _changePassword && (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm new password',
                  obscureText: _obscure,
                  prefixIcon: Icons.lock_outline_rounded,
                  validator: (v) => _changePassword && v != _newPasswordController.text ? 'Passwords do not match' : null,
                ),
              ],
              const SizedBox(height: 24),
              PrimaryButton(label: 'Save Changes', onPressed: _isSubmitting ? null : _submit, isLoading: _isSubmitting),
            ],
          ),
        ),
      ),
    );
  }
}
