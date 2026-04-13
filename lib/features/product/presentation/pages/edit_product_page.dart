import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/product_bloc.dart';
import '../../domain/entities/product.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/app_validators.dart';
import '../../../../core/widgets/input_label.dart';
import '../../../../core/widgets/primary_button.dart';

class EditProductPage extends StatefulWidget {
  final Product product;
  const EditProductPage({super.key, required this.product});

  @override
  State<EditProductPage> createState() => _EditProductPageState();
}

class _EditProductPageState extends State<EditProductPage> {
  final _formKey = GlobalKey<FormState>();
  late String _name;
  late double _price;
  late int _stock;
  late String _category;
  DateTime? _expiryDate;
  DateTime? _manufacturingDate;
  late String _batchNumber;
  late int _minStockThreshold;

  final List<String> _categories = [
    'Groceries',
    'Dairy',
    'Beverages',
    'Snacks',
    'Household',
    'Personal Care',
    'Medicines',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _name = widget.product.name;
    _price = widget.product.price;
    _stock = widget.product.stock;
    _category = widget.product.category ?? '';
    _expiryDate = widget.product.expiryDate;
    _manufacturingDate = widget.product.manufacturingDate;
    _batchNumber = widget.product.batchNumber ?? '';
    _minStockThreshold = widget.product.minStockThreshold;
  }

  void _selectExpiryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _expiryDate ?? DateTime.now().add(const Duration(days: 180)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (date != null) {
      setState(() => _expiryDate = date);
    }
  }

  void _selectManufacturingDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _manufacturingDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 2)),
      lastDate: DateTime.now(),
    );
    if (date != null) {
      setState(() => _manufacturingDate = date);
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      final updatedProduct = Product(
        id: widget.product.id,
        name: _name,
        barcode: widget.product.barcode,
        price: _price,
        stock: _stock,
        expiryDate: _expiryDate,
        manufacturingDate: _manufacturingDate,
        batchNumber: _batchNumber.isEmpty ? null : _batchNumber,
        category: _category.isEmpty ? null : _category,
        minStockThreshold: _minStockThreshold,
      );

      context.read<ProductBloc>().add(UpdateProduct(updatedProduct));
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.chevron_left,
                size: 32, color: Theme.of(context).primaryColor),
            onPressed: () => context.pop(),
          ),
          title: const Text('Edit Product',
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
                  Container(
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.qr_code_scanner,
                            color: AppTheme.primaryColor, size: 28),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('BARCODE',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor
                                        .withValues(alpha: 0.7))),
                            const SizedBox(height: 2),
                            Text(widget.product.barcode,
                                style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'monospace')),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const InputLabel(text: 'Product Name'),
                  TextFormField(
                    initialValue: _name,
                    textCapitalization: TextCapitalization.words,
                    validator: AppValidators.required('Please enter a name'),
                    onSaved: (value) => _name = value!,
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Price'),
                  TextFormField(
                    initialValue: _price.toStringAsFixed(2),
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      prefixText: '₹ ',
                      prefixStyle: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.black),
                    ),
                    validator: AppValidators.price,
                    onSaved: (value) => _price = double.parse(value!),
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Stock'),
                  TextFormField(
                    initialValue: _stock.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Units: ',
                    ),
                    onSaved: (value) =>
                        _stock = int.tryParse(value ?? '0') ?? 0,
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Category'),
                  DropdownButtonFormField<String>(
                    value: _category.isEmpty ? null : _category,
                    decoration: const InputDecoration(
                      hintText: 'Select category',
                    ),
                    items: _categories.map((cat) {
                      return DropdownMenuItem(value: cat, child: Text(cat));
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _category = value ?? '');
                    },
                    onSaved: (value) => _category = value ?? '',
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Manufacturing Date'),
                  InkWell(
                    onTap: _selectManufacturingDate,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _manufacturingDate != null
                                ? '${_manufacturingDate!.day}/${_manufacturingDate!.month}/${_manufacturingDate!.year}'
                                : 'Select date',
                            style: TextStyle(
                              color: _manufacturingDate != null
                                  ? Colors.black
                                  : Colors.grey,
                            ),
                          ),
                          const Icon(Icons.calendar_today, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Expiry Date'),
                  InkWell(
                    onTap: _selectExpiryDate,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _expiryDate != null
                                ? '${_expiryDate!.day}/${_expiryDate!.month}/${_expiryDate!.year}'
                                : 'Select date',
                            style: TextStyle(
                              color: _expiryDate != null
                                  ? Colors.black
                                  : Colors.grey,
                            ),
                          ),
                          const Icon(Icons.calendar_today, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Batch Number'),
                  TextFormField(
                    initialValue: _batchNumber,
                    decoration: const InputDecoration(
                      hintText: 'Optional',
                    ),
                    onSaved: (value) => _batchNumber = value ?? '',
                  ),
                  const SizedBox(height: 24),
                  const InputLabel(text: 'Low Stock Alert Threshold'),
                  TextFormField(
                    initialValue: _minStockThreshold.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Alert when stock below: ',
                    ),
                    onSaved: (value) =>
                        _minStockThreshold = int.tryParse(value ?? '10') ?? 10,
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
        bottomNavigationBar: PrimaryButton(
          onPressed: _submit,
          icon: Icons.save,
          label: 'Save Changes',
        ));
  }
}
