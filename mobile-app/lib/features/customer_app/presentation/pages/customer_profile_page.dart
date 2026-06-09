import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_profile_bloc.dart';
import '../bloc/customer_auth_bloc.dart';
import '../../data/models/customer_profile_model.dart';

class CustomerProfilePage extends StatefulWidget {
  const CustomerProfilePage({super.key});

  @override
  State<CustomerProfilePage> createState() => _CustomerProfilePageState();
}

class _CustomerProfilePageState extends State<CustomerProfilePage> {
  static const Color brandDark = Color(0xFF2D2D2D);
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _currentPassController = TextEditingController();
  final _newPassController = TextEditingController();
  bool _showPassword = false;

  @override
  void initState() {
    super.initState();
    context.read<CustomerProfileBloc>().add(LoadCustomerProfile());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFDF5),
      body: SafeArea(
        child: BlocConsumer<CustomerProfileBloc, CustomerProfileState>(
          listenWhen: (prev, curr) {
            if (curr is CustomerProfileLoaded && curr.successMessage != null) return true;
            if (curr is CustomerProfileError) return true;
            return false;
          },
          listener: (context, state) {
            if (state is CustomerProfileLoaded && state.successMessage != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.successMessage!), backgroundColor: Colors.green, duration: const Duration(seconds: 2)),
              );
            } else if (state is CustomerProfileError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.message), backgroundColor: Colors.red),
              );
            }
          },
          builder: (context, state) {
            if (state is CustomerProfileLoading) return const Center(child: CircularProgressIndicator());

            CustomerProfile? profile;
            if (state is CustomerProfileLoaded) profile = state.profile;
            if (state is CustomerProfileSaving) profile = state.profile;
            if (state is CustomerProfileError) profile = state.profile;

            if (profile == null) return const SizedBox.shrink();

            if (_nameController.text.isEmpty && profile.name.isNotEmpty) {
              _nameController.text = profile.name;
              _phoneController.text = profile.phone ?? '';
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('My Profile', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark)),
                  const SizedBox(height: 16),
                  // Profile card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
                        child: const Icon(Icons.person, color: Colors.white, size: 28),
                      ),
                      const SizedBox(height: 12),
                      Text(profile.name, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                      Text(profile.email, style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
                      const SizedBox(height: 16),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                        _buildProfileStat('${profile.totalOrders}', 'Orders'),
                        _buildProfileStat('${profile.loyaltyPoints}', 'Points'),
                        _buildProfileStat('₹${profile.totalSpent.round()}', 'Spent'),
                      ]),
                    ]),
                  ),
                  const SizedBox(height: 24),
                  // Edit form
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey[100]!)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Personal Information', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
                        const SizedBox(height: 16),
                        _buildField(_nameController, Icons.person_outlined, 'Full Name'),
                        const SizedBox(height: 12),
                        _buildField(null, Icons.email_outlined, profile.email, readOnly: true),
                        const SizedBox(height: 12),
                        _buildField(_phoneController, Icons.phone_outlined, 'Phone'),
                        const SizedBox(height: 24),
                        Text('Change Password', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
                        const SizedBox(height: 12),
                        _buildPassField(_currentPassController, 'Current Password'),
                        const SizedBox(height: 12),
                        _buildPassField(_newPassController, 'New Password'),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity, height: 52,
                          child: ElevatedButton(
                            onPressed: state is CustomerProfileSaving ? null : _save,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            child: state is CustomerProfileSaving
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () { context.read<CustomerAuthBloc>().add(CustomerAuthLogout()); context.go('/customer-app/login'); },
                      icon: const Icon(Icons.logout, color: Colors.red),
                      label: Text('Sign Out', style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.w700)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildProfileStat(String value, String label) {
    return Column(children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
        child: Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
      ),
      const SizedBox(height: 4),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: Colors.white70)),
    ]);
  }

  Widget _buildField(TextEditingController? controller, IconData icon, String hint, {bool readOnly = false}) {
    return TextFormField(
      controller: controller, readOnly: readOnly,
      decoration: InputDecoration(
        hintText: hint, prefixIcon: Icon(icon, size: 20, color: Colors.grey[400]),
        filled: true, fillColor: Colors.grey[50],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _buildPassField(TextEditingController controller, String hint) {
    return TextFormField(
      controller: controller, obscureText: !_showPassword,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.lock_outlined, size: 20, color: Colors.grey),
        suffixIcon: IconButton(
          icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 20, color: Colors.grey),
          onPressed: () => setState(() => _showPassword = !_showPassword),
        ),
        filled: true, fillColor: Colors.grey[50],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  void _save() {
    context.read<CustomerProfileBloc>().add(UpdateCustomerProfile(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      currentPassword: _currentPassController.text.isNotEmpty ? _currentPassController.text : null,
      newPassword: _newPassController.text.isNotEmpty ? _newPassController.text : null,
    ));
  }

  @override
  void dispose() {
    _nameController.dispose(); _phoneController.dispose();
    _currentPassController.dispose(); _newPassController.dispose();
    super.dispose();
  }
}
