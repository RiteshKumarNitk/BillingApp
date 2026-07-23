import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../shared/widgets/app_bottom_sheet.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/price_tag.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/quantity_stepper.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../../cart/domain/entities/cart_item.dart';
import '../../../cart/presentation/cubit/cart_cubit.dart';
import '../../domain/entities/menu_item.dart';

class ProductDetailSheet extends StatefulWidget {
  final MenuItem item;
  final Cafe cafe;
  const ProductDetailSheet({super.key, required this.item, required this.cafe});

  static Future<void> show(BuildContext context, {required MenuItem item, required Cafe cafe}) {
    final cartCubit = context.read<CartCubit>();
    return showAppBottomSheet(
      context,
      builder: (_) => BlocProvider.value(
        value: cartCubit,
        child: ProductDetailSheet(item: item, cafe: cafe),
      ),
    );
  }

  @override
  State<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<ProductDetailSheet> {
  MenuVariant? _selectedVariant;
  final Set<String> _selectedAddOnIds = {};
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    if (widget.item.hasVariants) _selectedVariant = widget.item.variants.first;
  }

  double get _basePrice => _selectedVariant?.salePrice ?? widget.item.salePrice;
  List<MenuAddOn> get _selectedAddOns => widget.item.addOns.where((a) => _selectedAddOnIds.contains(a.id)).toList();
  double get _unitPrice => _basePrice + _selectedAddOns.fold(0.0, (s, a) => s + a.price);
  double get _total => _unitPrice * _quantity;

  void _addToCart() {
    final cartCubit = context.read<CartCubit>();
    final item = CartItem(
      productId: widget.item.id,
      variantId: _selectedVariant?.id,
      name: _selectedVariant != null ? '${widget.item.name} - ${_selectedVariant!.name}' : widget.item.name,
      basePrice: _basePrice,
      mrp: widget.item.hasVariants ? null : widget.item.mrp,
      quantity: _quantity,
      imageUrl: widget.item.imageUrl,
      isCombo: widget.item.isCombo,
      comboComponentLabels: widget.item.comboComponents
          .map((c) => '${c.quantity}x ${c.name}${c.variantName != null ? " (${c.variantName})" : ""}')
          .toList(),
      addOns: _selectedAddOns.map((a) => CartAddOnSelection(id: a.id, name: a.name, price: a.price)).toList(),
    );

    void doAdd() {
      cartCubit.addItem(tenantId: widget.cafe.id, tenantName: widget.cafe.name, tenantLogoUrl: widget.cafe.logoUrl, item: item);
      Navigator.of(context).pop();
      AppToast.success(context, 'Added to cart');
    }

    if (cartCubit.belongsToOtherTenant(widget.cafe.id)) {
      final otherName = cartCubit.state.tenantName ?? 'another cafe';
      showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Start a new cart?'),
          content: Text('Your cart has items from $otherName. Adding from ${widget.cafe.name} will clear it first.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
            TextButton(onPressed: () { Navigator.pop(dialogContext); doAdd(); }, child: const Text('Start New Cart')),
          ],
        ),
      );
    } else {
      doAdd();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.item.imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(imageUrl: widget.item.imageUrl!, height: 160, width: double.infinity, fit: BoxFit.cover),
              ),
            const SizedBox(height: 14),
            Text(widget.item.name, style: theme.textTheme.headlineLarge),
            if (widget.item.description != null && widget.item.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(widget.item.description!, style: theme.textTheme.bodyMedium),
            ],
            if (widget.item.isCombo && widget.item.comboComponents.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text("What's inside", style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              ...widget.item.comboComponents.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline_rounded, size: 16, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Text('${c.quantity}x ${c.name}${c.variantName != null ? " (${c.variantName})" : ""}', style: theme.textTheme.bodyMedium),
                      ],
                    ),
                  )),
            ],
            if (widget.item.hasVariants) ...[
              const SizedBox(height: 18),
              Text('Choose size', style: theme.textTheme.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.item.variants.map((v) {
                  final selected = _selectedVariant?.id == v.id;
                  return AppChip(
                    label: '${v.name} • ${formatRupees(v.salePrice)}',
                    selected: selected,
                    onTap: () => setState(() => _selectedVariant = v),
                  );
                }).toList(),
              ),
            ],
            if (widget.item.addOns.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text('Add-ons', style: theme.textTheme.titleMedium),
              ...widget.item.addOns.map((a) => CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _selectedAddOnIds.contains(a.id),
                    controlAffinity: ListTileControlAffinity.leading,
                    onChanged: (v) => setState(() => (v ?? false) ? _selectedAddOnIds.add(a.id) : _selectedAddOnIds.remove(a.id)),
                    title: Text(a.name),
                    secondary: Text('+${formatRupees(a.price)}', style: theme.textTheme.bodyMedium),
                  )),
            ],
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Quantity', style: theme.textTheme.titleMedium),
                QuantityStepper(value: _quantity, min: 1, onChanged: (q) => setState(() => _quantity = q)),
              ],
            ),
            const SizedBox(height: 20),
            PrimaryButton(
              label: 'Add to Cart • ${formatRupees(_total)}',
              onPressed: widget.item.isOutOfStock ? null : _addToCart,
            ),
          ],
        ),
      ),
    );
  }
}
