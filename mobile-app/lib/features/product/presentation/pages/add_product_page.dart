import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../bloc/product_bloc.dart';
import '../../domain/entities/product.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/app_validators.dart';
import '../../../../core/widgets/input_label.dart';
import '../../../../core/widgets/primary_button.dart';

class AddProductPage extends StatefulWidget {
  const AddProductPage({super.key});

  @override
  State<AddProductPage> createState() => _AddProductPageState();
}

class _AddProductPageState extends State<AddProductPage> {
  final _formKey = GlobalKey<FormState>();
  
  // Base fields
  String _productType = 'SIMPLE';
  String _name = '';
  String _barcode = '';
  String _category = '';
  
  // Pricing & Stock
  double _mrp = 0.0;
  double _salePrice = 0.0;
  double _purchasePrice = 0.0;
  double _stock = 0.0;
  double _minStockThreshold = 10.0;

  // Complex Types
  final List<ProductVariant> _variants = [];
  final List<ProductBatch> _batches = [];
  final List<ProductSerial> _serials = [];

  final List<String> _categories = [
    'Vegetables', 'Fruits', 'Grocery', 'FMCG', 'Medical',
    'Dairy', 'Hardware', 'Clothing', 'Electronics', 'Restaurant', 'Other'
  ];

  void _scanBarcode() async {
    final result = await context.push<String>('/scanner');
    if (result != null && result.isNotEmpty) {
      setState(() {
        _barcode = result;
      });
    }
  }

  void _addVariant() {
    setState(() {
      _variants.add(ProductVariant(
        id: const Uuid().v4(),
        name: 'Variant ${_variants.length + 1}',
        mrp: _mrp,
        salePrice: _salePrice,
        purchasePrice: _purchasePrice,
        stock: 0,
      ));
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      final productState = context.read<ProductBloc>().state;
      if (_barcode.isNotEmpty) {
        final existingProduct =
            productState.products.where((p) => p.barcode == _barcode).firstOrNull;

        if (existingProduct != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Product with barcode "$_barcode" already exists!'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }

      final product = Product(
        id: const Uuid().v4(),
        name: _name,
        barcode: _barcode,
        productType: _productType,
        mrp: _mrp,
        salePrice: _salePrice,
        purchasePrice: _purchasePrice,
        stock: _stock,
        category: _category.isEmpty ? null : _category,
        minStockThreshold: _minStockThreshold,
        variants: (_productType == 'VARIANT' || _productType == 'WEIGHT') ? _variants : const [],
        batches: _productType == 'BATCH' ? _batches : const [],
        serials: _productType == 'SERIAL' ? _serials : const [],
      );

      context.read<ProductBloc>().add(AddProduct(product));
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.chevron_left,
              size: 28, color: Theme.of(context).primaryColor),
          onPressed: () => context.go('/dashboard'),
        ),
        title: const Text('Add Product',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const InputLabel(text: 'Product Type'),
                DropdownButtonFormField<String>(
                  value: _productType,
                  decoration: const InputDecoration(hintText: 'Select Type'),
                  items: const [
                    DropdownMenuItem(value: 'SIMPLE', child: Text('Simple Product')),
                    DropdownMenuItem(value: 'WEIGHT', child: Text('Weight Based (Loose Items)')),
                    DropdownMenuItem(value: 'VARIANT', child: Text('Variant Based (Sizes, Colors)')),
                    DropdownMenuItem(value: 'BATCH', child: Text('Batch Managed (Medicines)')),
                    DropdownMenuItem(value: 'SERIAL', child: Text('Serial Managed (Electronics)')),
                    DropdownMenuItem(value: 'SERVICE', child: Text('Service (No Inventory)')),
                  ],
                  onChanged: (value) => setState(() => _productType = value!),
                ),
                const SizedBox(height: 24),

                const InputLabel(text: 'Product Name *'),
                TextFormField(
                  decoration: const InputDecoration(hintText: 'e.g. Basmati Rice'),
                  textCapitalization: TextCapitalization.words,
                  validator: AppValidators.required('Please enter a name'),
                  onSaved: (value) => _name = value!,
                ),
                const SizedBox(height: 24),

                const InputLabel(text: 'Barcode (Optional)'),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        key: ValueKey(_barcode),
                        initialValue: _barcode,
                        decoration: const InputDecoration(hintText: 'Scan or enter barcode'),
                        onSaved: (value) => _barcode = value ?? '',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.qr_code_scanner, color: AppTheme.primaryColor),
                        onPressed: _scanBarcode,
                        padding: const EdgeInsets.all(14),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                const InputLabel(text: 'Category'),
                DropdownButtonFormField<String>(
                  value: _category.isEmpty ? null : _category,
                  decoration: const InputDecoration(hintText: 'Select category'),
                  items: _categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                  onChanged: (value) => setState(() => _category = value ?? ''),
                  onSaved: (value) => _category = value ?? '',
                ),
                const SizedBox(height: 32),

                // Pricing Section (Only if not Variant, or maybe base pricing for variant)
                if (_productType != 'VARIANT') ...[
                  const Divider(),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Text('Pricing & Inventory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const InputLabel(text: 'Sale Price *'),
                            TextFormField(
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(prefixText: '₹ ', hintText: '0.00'),
                              validator: AppValidators.price,
                              onSaved: (value) => _salePrice = double.parse(value!),
                              onChanged: (value) => _salePrice = double.tryParse(value) ?? 0,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const InputLabel(text: 'MRP (Optional)'),
                            TextFormField(
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(prefixText: '₹ ', hintText: '0.00'),
                              onSaved: (value) => _mrp = double.tryParse(value ?? '0') ?? 0,
                              onChanged: (value) => _mrp = double.tryParse(value) ?? 0,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const InputLabel(text: 'Purchase Price'),
                            TextFormField(
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(prefixText: '₹ ', hintText: '0.00'),
                              onSaved: (value) => _purchasePrice = double.tryParse(value ?? '0') ?? 0,
                            ),
                          ],
                        ),
                      ),
                      if (_productType != 'SERVICE') ...[
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const InputLabel(text: 'Current Stock'),
                              TextFormField(
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(hintText: '0'),
                                onSaved: (value) => _stock = double.tryParse(value ?? '0') ?? 0,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ],

                // Variants Section
                if (_productType == 'VARIANT' || _productType == 'WEIGHT') ...[
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Product Variants', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton.icon(
                          onPressed: _addVariant, 
                          icon: const Icon(Icons.add), 
                          label: const Text('Add Variant')
                        )
                      ],
                    ),
                  ),
                  if (_variants.isEmpty)
                    const Text('Add at least one variant to continue.', style: TextStyle(color: Colors.red)),
                  
                  ..._variants.asMap().entries.map((entry) {
                    int idx = entry.key;
                    ProductVariant variant = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Variant #${idx + 1}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => setState(() => _variants.removeAt(idx)),
                              )
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            initialValue: variant.name,
                            decoration: const InputDecoration(labelText: 'Variant Name (e.g. Small, Red)'),
                            onChanged: (val) => _variants[idx] = ProductVariant(id: variant.id, name: val, mrp: variant.mrp, salePrice: variant.salePrice, stock: variant.stock, barcode: variant.barcode),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  initialValue: variant.salePrice.toString(),
                                  decoration: const InputDecoration(labelText: 'Sale Price (₹)'),
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  onChanged: (val) => _variants[idx] = ProductVariant(id: variant.id, name: variant.name, mrp: variant.mrp, salePrice: double.tryParse(val) ?? 0, stock: variant.stock, barcode: variant.barcode),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  initialValue: variant.stock.toString(),
                                  decoration: const InputDecoration(labelText: 'Stock'),
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  onChanged: (val) => _variants[idx] = ProductVariant(id: variant.id, name: variant.name, mrp: variant.mrp, salePrice: variant.salePrice, stock: double.tryParse(val) ?? 0, barcode: variant.barcode),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    );
                  })
                ],

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: PrimaryButton(
        onPressed: (_productType == 'VARIANT' || _productType == 'WEIGHT') && _variants.isEmpty
            ? null
            : _submit,
        icon: Icons.add_circle,
        label: 'Add Product',
      ),
    );
  }
}
