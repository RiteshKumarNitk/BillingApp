import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_auth_bloc.dart';

class CustomerRegisterPage extends StatefulWidget {
  const CustomerRegisterPage({super.key});

  @override
  State<CustomerRegisterPage> createState() => _CustomerRegisterPageState();
}

class _CustomerRegisterPageState extends State<CustomerRegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFDF5),
      body: BlocListener<CustomerAuthBloc, CustomerAuthState>(
        listener: (context, state) {
          if (state is CustomerAuthRegisterSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Account created! Please sign in.'), backgroundColor: Colors.green),
            );
            context.go('/customer-app/login');
          } else if (state is CustomerAuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: Colors.red),
            );
          }
        },
        child: SafeArea(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                decoration: const BoxDecoration(
                  color: brandYellow,
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(color: brandDark, borderRadius: BorderRadius.circular(16)),
                      child: const Center(child: Icon(Icons.shopping_bag, color: brandYellow, size: 24)),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('BillingApp', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
                        Text('Delivery in 10 minutes', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0x992D2D2D))),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white, borderRadius: BorderRadius.circular(24),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 4))],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Create Account', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
                          const SizedBox(height: 4),
                          Text('Start ordering from your favorite stores', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500])),
                          const SizedBox(height: 24),
                          _buildField(_nameController, Icons.person_outlined, 'Full name'),
                          const SizedBox(height: 16),
                          _buildField(_emailController, Icons.email_outlined, 'Email address', keyboardType: TextInputType.emailAddress),
                          const SizedBox(height: 16),
                          _buildField(_phoneController, Icons.phone_outlined, 'Phone (optional)', keyboardType: TextInputType.phone),
                          const SizedBox(height: 16),
                          _buildField(_passwordController, Icons.lock_outlined, 'Password (min 6 chars)', obscure: true),
                          const SizedBox(height: 24),
                          BlocBuilder<CustomerAuthBloc, CustomerAuthState>(
                            builder: (context, state) {
                              return SizedBox(
                                width: double.infinity, height: 52,
                                child: ElevatedButton(
                                  onPressed: state is CustomerAuthLoading ? null : _submit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: brandYellow, foregroundColor: brandDark,
                                    elevation: 4, shadowColor: brandYellow.withValues(alpha: 0.4),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: state is CustomerAuthLoading
                                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: brandDark))
                                      : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                          Text('Create Account', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900)),
                                          const SizedBox(width: 8), const Icon(Icons.arrow_forward, size: 18),
                                        ]),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 20),
                          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Text('Already have an account? ', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500])),
                            GestureDetector(
                              onTap: () => context.go('/customer-app/login'),
                              child: Text('Sign In', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w900, color: brandYellow)),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, IconData icon, String hint, {bool obscure = false, TextInputType? keyboardType}) {
    return TextFormField(
      controller: controller, obscureText: obscure, keyboardType: keyboardType,
      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
      decoration: InputDecoration(
        hintText: hint, prefixIcon: Icon(icon, size: 20, color: Colors.grey[400]),
        filled: true, fillColor: Colors.grey[50],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: brandYellow, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      context.read<CustomerAuthBloc>().add(CustomerAuthRegister(
        name: _nameController.text.trim(), email: _emailController.text.trim(),
        password: _passwordController.text,
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      ));
    }
  }

  @override
  void dispose() {
    _nameController.dispose(); _emailController.dispose();
    _phoneController.dispose(); _passwordController.dispose();
    super.dispose();
  }
}
