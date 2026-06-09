import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/customer_stores_bloc.dart';
import '../../data/models/customer_store_model.dart';

class CustomerStoresPage extends StatefulWidget {
  const CustomerStoresPage({super.key});

  @override
  State<CustomerStoresPage> createState() => _CustomerStoresPageState();
}

class _CustomerStoresPageState extends State<CustomerStoresPage> {
  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);
  String _search = '';

  @override
  void initState() {
    super.initState();
    context.read<CustomerStoresBloc>().add(LoadCustomerStores());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFDF5),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text('My Stores', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: brandDark))),
                    GestureDetector(
                      onTap: () => context.push('/customer-app/scan'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: brandYellow,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.qr_code_scanner, size: 16, color: Color(0xFF2D2D2D)),
                          const SizedBox(width: 6),
                          Text('Scan QR', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: brandDark)),
                        ]),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 4),
                  Text('Tap a store to browse & order', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (v) => setState(() => _search = v),
                    decoration: InputDecoration(
                      hintText: 'Search stores...',
                      prefixIcon: Icon(Icons.search, size: 20, color: Colors.grey[400]),
                      filled: true, fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: brandYellow, width: 2)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: BlocBuilder<CustomerStoresBloc, CustomerStoresState>(
                builder: (context, state) {
                  if (state is CustomerStoresLoading) return const Center(child: CircularProgressIndicator());
                  if (state is CustomerStoresError) return Center(child: Text(state.message));
                  if (state is CustomerStoresLoaded) {
                    final filtered = state.stores.where((s) => _search.isEmpty || s.name.toLowerCase().contains(_search.toLowerCase())).toList();
                    if (filtered.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.store, size: 48, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('No stores yet', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: brandDark)),
                      Text('Scan a store QR to start', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400])),
                    ]));
                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filtered.length,
                      itemBuilder: (context, i) => _buildStoreCard(filtered[i]),
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

  static const _gradients = [
    [Color(0xFF3B82F6), Color(0xFF6366F1)],
    [Color(0xFF10B981), Color(0xFF14B8A6)],
    [Color(0xFF8B5CF6), Color(0xFFA855F7)],
    [Color(0xFFF59E0B), Color(0xFFF97316)],
    [Color(0xFFEF4444), Color(0xFFEC4899)],
  ];

  Widget _buildStoreCard(CustomerStore store) {
    final colors = _gradients[store.name.hashCode.abs() % _gradients.length];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey[100]!)),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colors),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                    child: store.logoUrl != null
                        ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(store.logoUrl!, fit: BoxFit.cover))
                        : const Icon(Icons.store, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(store.name, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white)),
                    if (store.address != null) Text(store.address!, style: GoogleFonts.inter(fontSize: 10, color: Colors.white70), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ])),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  _buildBadge(Icons.shopping_bag, '${store.orderCount} orders'),
                  const SizedBox(width: 8),
                  _buildBadge(null, '₹${store.totalSpent.round()} spent'),
                  if (store.loyaltyPoints > 0) ...[
                    const SizedBox(width: 8),
                    _buildBadge(Icons.star, '${store.loyaltyPoints} pts', iconColor: Colors.yellow[300]),
                  ],
                ]),
              ],
            ),
          ),
          Container(
            decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(bottom: Radius.circular(20))),
            child: Row(children: [
              Expanded(
                child: InkWell(
                  onTap: () => context.go('/customer-app/stores'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text('Browse Menu', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: brandDark)),
                      const SizedBox(width: 4), const Icon(Icons.arrow_forward, size: 14),
                    ]),
                  ),
                ),
              ),
              if (store.phone != null) ...[
                Container(width: 1, height: 28, color: Colors.grey[100]),
                Expanded(
                  child: InkWell(
                    onTap: () {},
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.phone, size: 13, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text('Call', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[500])),
                      ]),
                    ),
                  ),
                ),
              ],
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(IconData? icon, String text, {Color? iconColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) Icon(icon, size: 10, color: iconColor ?? Colors.white70),
        if (icon != null) const SizedBox(width: 3),
        Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
      ]),
    );
  }
}
