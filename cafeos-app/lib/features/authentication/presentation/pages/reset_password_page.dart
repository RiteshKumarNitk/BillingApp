import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../domain/usecases/reset_password_usecase.dart';

class ResetPasswordPage extends StatefulWidget {
  final String? email;
  const ResetPasswordPage({super.key, this.email});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  late final _emailController = TextEditingController(text: widget.email ?? '');
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isSubmitting = false;
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _isSubmitting = true);
    final result = await sl<ResetPasswordUseCase>()(ResetPasswordParams(
      email: _emailController.text.trim(),
      code: _codeController.text.trim(),
      newPassword: _passwordController.text,
    ));
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    result.match(
      (failure) => AppToast.error(context, failure.message),
      (_) {
        AppToast.success(context, 'Password reset. Please log in with your new password.');
        context.go('/login');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Reset password', style: Theme.of(context).textTheme.displayMedium),
              const SizedBox(height: 6),
              Text('Enter the code we emailed you and choose a new password.', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 28),
              AppTextField(
                controller: _emailController,
                label: 'Email',
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.mail_outline_rounded,
                validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _codeController,
                label: '6-digit code',
                keyboardType: TextInputType.number,
                prefixIcon: Icons.pin_outlined,
                validator: (v) => (v == null || v.trim().length != 6) ? 'Enter the 6-digit code from your email' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _passwordController,
                label: 'New password',
                obscureText: _obscure,
                prefixIcon: Icons.lock_outline_rounded,
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
                validator: (v) => (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _confirmController,
                label: 'Confirm new password',
                obscureText: _obscure,
                prefixIcon: Icons.lock_outline_rounded,
                validator: (v) => v != _passwordController.text ? 'Passwords do not match' : null,
              ),
              const SizedBox(height: 24),
              PrimaryButton(label: 'Reset Password', onPressed: _isSubmitting ? null : _submit, isLoading: _isSubmitting),
            ],
          ),
        ),
      ),
    );
  }
}
