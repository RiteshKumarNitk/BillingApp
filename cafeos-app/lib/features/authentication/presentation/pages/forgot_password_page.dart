import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../domain/usecases/forgot_password_usecase.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _isSubmitting = true);
    final email = _emailController.text.trim();
    final result = await sl<ForgotPasswordUseCase>()(ForgotPasswordParams(email: email));
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    result.match(
      (failure) => AppToast.error(context, failure.message),
      (_) {
        AppToast.success(context, 'If an account exists for that email, a reset code has been sent.');
        context.push('/reset-password', extra: email);
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
              Text('Forgot password?', style: Theme.of(context).textTheme.displayMedium),
              const SizedBox(height: 6),
              Text('Enter your email and we\'ll send you a code to reset it.', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 28),
              AppTextField(
                controller: _emailController,
                label: 'Email',
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.mail_outline_rounded,
                validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 24),
              PrimaryButton(label: 'Send Reset Code', onPressed: _isSubmitting ? null : _submit, isLoading: _isSubmitting),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () => context.push('/reset-password', extra: _emailController.text.trim()),
                  child: const Text('Already have a code? Reset password'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
