import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/product_bloc.dart';
import '../../domain/entities/product.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/service_locator.dart' as di;
import '../../../../core/widgets/primary_button.dart';

class _RowControllers {
  final TextEditingController stock;
  final TextEditingController purchasePrice;
  final TextEditingController mrp;
  final TextEditingController salePrice;

  _RowControllers(Product p)
      : stock = TextEditingController(text: p.stock.toString()),
        purchasePrice = TextEditingController(text: p.purchasePrice.toString()),
        mrp = TextEditingController(text: p.mrp.toString()),
        salePrice = TextEditingController(text: p.salePrice.toString());

  void dispose() {
    stock.dispose();
    purchasePrice.dispose();
    mrp.dispose();
    salePrice.dispose();
  }
}

class InventoryBulkEditPage extends StatefulWidget {
  const InventoryBulkEditPage({super.key});

  @override
  State<InventoryBulkEditPage> createState() => _InventoryBulkEditPageState();
}

class _InventoryBulkEditPageState extends State<InventoryBulkEditPage> {
  final ApiClient _api = di.sl<ApiClient>();
  final Map<String, _RowControllers> _controllers = {};
  bool _saving = false;
  String _search = '';

  @override
  void initState() {
    super.initState();
    context.read<ProductBloc>().add(LoadProducts());
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  _RowControllers _controllersFor(Product p) {
    return _controllers.putIfAbsent(p.id, () => _RowControllers(p));
  }

  bool _isDirty(Product p) {
    final c = _controllers[p.id];
    if (c == null) return false;
    return c.stock.text != p.stock.toString() ||
        c.purchasePrice.text != p.purchasePrice.toString() ||
        c.mrp.text != p.mrp.toString() ||
        c.salePrice.text != p.salePrice.toString();
  }

  Future<void> _saveAll(List<Product> products) async {
    final changed = products.where(_isDirty).toList();
    if (changed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No changes to save.')),
      );
      return;
    }

    final payload = changed.map((p) {
      final c = _controllers[p.id]!;
      return {
        'id': p.id,
        'type': 'product',
        'stock': double.tryParse(c.stock.text) ?? p.stock,
        'purchasePrice': double.tryParse(c.purchasePrice.text) ?? p.purchasePrice,
        'mrp': double.tryParse(c.mrp.text) ?? p.mrp,
        'salePrice': double.tryParse(c.salePrice.text) ?? p.salePrice,
      };
    }).toList();

    setState(() => _saving = true);
    try {
      await _api.bulkUpdateInventory(payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Updated ${changed.length} product${changed.length == 1 ? '' : 's'}.')),
        );
        context.read<ProductBloc>().add(LoadProducts());
        _controllers.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save changes: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bulk Edit Inventory'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: BlocBuilder<ProductBloc, ProductState>(
        builder: (context, state) {
          if (state.status == ProductStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          final products = state.products
              .where((p) => _search.isEmpty || p.name.toLowerCase().contains(_search.toLowerCase()))
              .toList();

          final dirtyCount = products.where(_isDirty).length;

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search products...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              Expanded(
                child: products.isEmpty
                    ? const Center(child: Text('No products found'))
                    : ListView.builder(
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          final p = products[index];
                          final c = _controllersFor(p);
                          final dirty = _isDirty(p);
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            color: dirty ? Colors.amber.withValues(alpha: 0.08) : null,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ),
                                      if (dirty)
                                        const Icon(Icons.edit, size: 16, color: Colors.amber),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: c.stock,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          decoration: const InputDecoration(labelText: 'Stock', isDense: true),
                                          onChanged: (_) => setState(() {}),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextField(
                                          controller: c.purchasePrice,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          decoration: const InputDecoration(labelText: 'Purchase ₹', isDense: true),
                                          onChanged: (_) => setState(() {}),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: c.mrp,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          decoration: const InputDecoration(labelText: 'MRP ₹', isDense: true),
                                          onChanged: (_) => setState(() {}),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextField(
                                          controller: c.salePrice,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          decoration: const InputDecoration(labelText: 'Sale ₹', isDense: true),
                                          onChanged: (_) => setState(() {}),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: PrimaryButton(
                    onPressed: _saving ? () {} : () => _saveAll(products),
                    label: _saving
                        ? 'Saving...'
                        : dirtyCount == 0
                            ? 'Save All'
                            : 'Save All ($dirtyCount changed)',
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
