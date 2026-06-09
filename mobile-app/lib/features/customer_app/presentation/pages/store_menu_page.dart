import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../bloc/store_menu_bloc.dart';
import '../bloc/customer_auth_bloc.dart';
import '../../data/models/store_menu_model.dart';

class CartItem {
  final String productId;
  final String? variantId;
  final String name;
  final double salePrice;
  int quantity;
  final int stock;

  CartItem({required this.productId, this.variantId, required this.name, required this.salePrice, required this.quantity, required this.stock});
}

class StoreMenuPage extends StatefulWidget {
  final String tenantId;
  const StoreMenuPage({super.key, required this.tenantId});

  @override
  State<StoreMenuPage> createState() => _StoreMenuPageState();
}

class _StoreMenuPageState extends State<StoreMenuPage> {
  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);
  static const Color brandBg = Color(0xFFFFFDF5);

  final List<CartItem> _cart = [];
  String _search = '';
  String _activeCategory = '';

  int get _cartCount => _cart.fold(0, (sum, i) => sum + i.quantity);
  double get _cartTotal => _cart.fold(0, (sum, i) => sum + i.salePrice * i.quantity);

  @override
  void initState() {
    super.initState();
    context.read<StoreMenuBloc>().add(LoadStoreMenu(tenantId: widget.tenantId));
  }

  void _addToCart(StoreMenuItem product, {StoreMenuVariant? variant}) {
    final name = variant != null ? '${product.name} - ${variant.name}' : product.name;
    final price = variant?.salePrice ?? product.salePrice;
    final stock = variant?.stock ?? product.stock;

    setState(() {
      final existing = _cart.indexWhere((i) =>
        variant != null ? (i.productId == product.id && i.variantId == variant.id) : i.productId == product.id
      );
      if (existing >= 0) {
        if (_cart[existing].quantity < stock) _cart[existing].quantity++;
      } else {
        _cart.add(CartItem(productId: product.id, variantId: variant?.id, name: name, salePrice: price, quantity: 1, stock: stock));
      }
    });
  }

  void _updateQty(String productId, int delta, {String? variantId}) {
    setState(() {
      final idx = _cart.indexWhere((i) => variantId != null
          ? (i.productId == productId && i.variantId == variantId)
          : i.productId == productId);
      if (idx >= 0) {
        _cart[idx].quantity += delta;
        if (_cart[idx].quantity <= 0) _cart.removeAt(idx);
      }
    });
  }

  void _removeItem(String productId, {String? variantId}) {
    setState(() {
      _cart.removeWhere((i) => variantId != null
          ? (i.productId == productId && i.variantId == variantId)
          : i.productId == productId);
    });
  }

  int _getCartQty(String productId, {String? variantId}) {
    for (final item in _cart) {
      if (variantId != null ? (item.productId == productId && item.variantId == variantId) : item.productId == productId) {
        return item.quantity;
      }
    }
    return 0;
  }

  void _placeOrder(StoreMenuData data) async {
    final authState = context.read<CustomerAuthBloc>().state;
    if (authState is! CustomerAuthAuthenticated) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please sign in to place an order'), backgroundColor: Colors.red),
        );
        context.go('/customer-app/login');
      }
      return;
    }
    if (_cart.isEmpty) return;

    context.read<StoreMenuBloc>().add(SubmitOrder(
      tenantId: widget.tenantId,
      items: _cart.map((i) => {
        'productId': i.productId,
        if (i.variantId != null) 'variantId': i.variantId,
        'quantity': i.quantity,
      }).toList(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<StoreMenuBloc, StoreMenuState>(
      listener: (context, state) {
        if (state is OrderSuccess) {
          setState(() => _cart.clear());
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order placed! Store will review.'), backgroundColor: Colors.green),
          );
          context.go('/customer-app/orders');
        } else if (state is StoreMenuError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: Colors.red),
          );
        }
      },
      child: Scaffold(
        backgroundColor: brandBg,
        body: BlocBuilder<StoreMenuBloc, StoreMenuState>(
          builder: (context, state) {
            if (state is StoreMenuLoading) return const Center(child: CircularProgressIndicator());
            if (state is StoreMenuError) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 48, color: Colors.grey[300]),
              const SizedBox(height: 12),
              Text(state.message, style: GoogleFonts.inter(color: Colors.grey[600])),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => context.go('/customer-app/stores'), child: const Text('Go Back')),
            ]));

            StoreMenuData? data;
            if (state is StoreMenuLoaded) data = state.data;
            if (state is OrderSubmitting) data = state.data;
            if (state is OrderSuccess) data = state.data;
            if (data == null) return const SizedBox.shrink();

            final filtered = data.categories.map((cat) => StoreCategory(
              category: cat.category,
              items: cat.items.where((item) => _search.isEmpty ||
                item.name.toLowerCase().contains(_search.toLowerCase()) ||
                cat.category.toLowerCase().contains(_search.toLowerCase())
              ).toList(),
            )).where((cat) => cat.items.isNotEmpty).toList();

            return Column(
              children: [
                Container(
                  color: brandYellow,
                  padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 8, 16, 12),
                  child: Column(
                    children: [
                      Row(children: [
                        GestureDetector(onTap: () => context.go('/customer-app/stores'), child: const Icon(Icons.arrow_back_ios, size: 20)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(data.store.name, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
                            if (data.store.address != null) Text(data.store.address!, style: GoogleFonts.inter(fontSize: 10, color: brandDark.withValues(alpha: 0.6)), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        )),
                        if (data.store.phone != null)
                          IconButton(onPressed: () {}, icon: Icon(Icons.phone, size: 20, color: brandDark.withValues(alpha: 0.6))),
                      ]),
                      const SizedBox(height: 10),
                      TextField(
                        onChanged: (v) => setState(() => _search = v),
                        decoration: InputDecoration(
                          hintText: 'Search menu...',
                          prefixIcon: Icon(Icons.search, size: 20, color: Colors.grey[400]),
                          filled: true, fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                if (filtered.isNotEmpty)
                  SizedBox(
                    height: 48, child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final cat = filtered[i];
                        final isActive = _activeCategory == cat.category;
                        return GestureDetector(
                          onTap: () => setState(() => _activeCategory = cat.category),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(color: isActive ? brandYellow : Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                            child: Center(child: Text(cat.category, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: isActive ? brandDark : Colors.grey[600]))),
                          ),
                        );
                      },
                    ),
                  ),
                Expanded(
                  child: filtered.isEmpty
                      ? Center(child: Text('No items found', style: GoogleFonts.inter(color: Colors.grey[400])))
                      : ListView.builder(
                          padding: EdgeInsets.fromLTRB(16, 12, 16, _cart.isNotEmpty ? 100 : 16),
                          itemCount: filtered.length,
                          itemBuilder: (context, catIdx) {
                            final cat = filtered[catIdx];
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(cat.category, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
                                const SizedBox(height: 8),
                                ...cat.items.map((item) => _buildProductCard(item)),
                                const SizedBox(height: 16),
                              ],
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: _cart.isNotEmpty ? _buildCartBar() : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      ),
    );
  }

  Widget _buildProductCard(StoreMenuItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey[100]!)),
      child: Row(children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
          child: item.imageUrl != null
              ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(item.imageUrl!, fit: BoxFit.cover))
              : const Icon(Icons.fastfood, color: Colors.grey, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: brandDark)),
            if (item.description != null) Text(item.description!, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400]), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Row(children: [
              Text('₹${item.salePrice.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: brandDark)),
              if (item.mrp > item.salePrice) ...[
                const SizedBox(width: 6),
                Text('₹${item.mrp.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400], decoration: TextDecoration.lineThrough)),
              ],
              if (item.isOutOfStock) ...[
                const SizedBox(width: 6),
                Text('SOLD OUT', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.red)),
              ],
            ]),
            if (item.hasVariants)
              ...item.variants.map((v) => _buildAddButton(item, variant: v)),
          ],
        )),
        if (!item.hasVariants) _buildAddButton(item),
      ]),
    );
  }

  Widget _buildAddButton(StoreMenuItem product, {StoreMenuVariant? variant}) {
    final vid = variant?.id;
    final qty = _getCartQty(product.id, variantId: vid);
    final stock = variant?.stock ?? product.stock;
    final isOutOfStock = stock <= 0 && product.productType != 'VARIANT' && product.productType != 'SERVICE';

    if (isOutOfStock) return Text('Out', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.red));

    if (qty == 0) {
      return GestureDetector(
        onTap: () => _addToCart(product, variant: variant),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(color: brandYellow, borderRadius: BorderRadius.circular(12)),
          child: Text('ADD', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: brandDark)),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(color: brandYellow, borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        GestureDetector(
          onTap: () => qty == 1 ? _removeItem(product.id, variantId: vid) : _updateQty(product.id, -1, variantId: vid),
          child: Padding(padding: const EdgeInsets.all(8), child: Icon(qty == 1 ? Icons.delete_outline : Icons.remove, size: 16, color: brandDark)),
        ),
        Text('$qty', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: brandDark)),
        GestureDetector(
          onTap: qty >= stock ? null : () => _updateQty(product.id, 1, variantId: vid),
          child: Padding(padding: const EdgeInsets.all(8), child: Icon(Icons.add, size: 16, color: qty >= stock ? Colors.grey : brandDark)),
        ),
      ]),
    );
  }

  Widget _buildCartBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: brandDark, borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(color: brandYellow.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.shopping_cart, color: brandYellow, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$_cartCount item${_cartCount > 1 ? 's' : ''}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white)),
            Text('₹${_cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
          ],
        )),
        GestureDetector(
          onTap: _showCartSheet,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(color: brandYellow, borderRadius: BorderRadius.circular(12)),
            child: Text('View Cart', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: brandDark)),
          ),
        ),
      ]),
    );
  }

  void _showCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CartSheet(
        cart: _cart,
        cartTotal: _cartTotal,
        onRemove: (pid, {String? vid}) => setState(() => _removeItem(pid, variantId: vid)),
        onUpdateQty: (pid, delta, {String? vid}) => setState(() => _updateQty(pid, delta, variantId: vid)),
        onPlaceOrder: () {
          Navigator.pop(context);
          final currentState = context.read<StoreMenuBloc>().state;
          if (currentState is StoreMenuLoaded) {
            _placeOrder(currentState.data);
          }
        },
        brandYellow: brandYellow,
        brandDark: brandDark,
      ),
    );
  }
}

class _CartSheet extends StatelessWidget {
  final List<CartItem> cart;
  final double cartTotal;
  final Function(String, {String? vid}) onRemove;
  final Function(String, int, {String? vid}) onUpdateQty;
  final VoidCallback onPlaceOrder;
  final Color brandYellow;
  final Color brandDark;

  _CartSheet({required this.cart, required this.cartTotal, required this.onRemove, required this.onUpdateQty, required this.onPlaceOrder, required this.brandYellow, required this.brandDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(
        children: [
          Container(width: 40, height: 4, margin: const EdgeInsets.only(top: 12), decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Text('Your Order', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: brandDark)),
              const Spacer(),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ]),
          ),
          Expanded(
            child: cart.isEmpty
                ? Center(child: Text('Cart is empty', style: GoogleFonts.inter(color: Colors.grey[400])))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: cart.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final item = cart[i];
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12)),
                        child: Row(children: [
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: brandDark)),
                              Text('₹${item.salePrice.toStringAsFixed(2)} each', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400])),
                            ],
                          )),
                          Container(
                            decoration: BoxDecoration(color: brandYellow, borderRadius: BorderRadius.circular(10)),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              GestureDetector(
                                onTap: () => onUpdateQty(item.productId, -1, vid: item.variantId),
                                child: Padding(padding: const EdgeInsets.all(6), child: Icon(item.quantity == 1 ? Icons.delete_outline : Icons.remove, size: 16)),
                              ),
                              Text('${item.quantity}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900)),
                              GestureDetector(
                                onTap: item.quantity >= item.stock ? null : () => onUpdateQty(item.productId, 1, vid: item.variantId),
                                child: Padding(padding: const EdgeInsets.all(6), child: Icon(Icons.add, size: 16)),
                              ),
                            ]),
                          ),
                          const SizedBox(width: 8),
                          Text('₹${(item.salePrice * item.quantity).toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: brandDark)),
                        ]),
                      );
                    },
                  ),
          ),
          if (cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey[100]!))),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Total', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
                  Text('₹${cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: brandDark)),
                ]),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: onPlaceOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: brandYellow, foregroundColor: brandDark,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Place Order — ₹${cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w900)),
                  ),
                ),
              ]),
            ),
        ],
      ),
    );
  }
}
