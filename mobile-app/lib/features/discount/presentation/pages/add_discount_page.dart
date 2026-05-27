import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../bloc/discount_bloc.dart';
import '../../domain/entities/discount.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/app_validators.dart';
import '../../../../core/widgets/input_label.dart';
import '../../../../core/widgets/primary_button.dart';

class AddDiscountPage extends StatefulWidget {
  const AddDiscountPage({super.key});

  @override
  State<AddDiscountPage> createState() => _AddDiscountPageState();
}

class _AddDiscountPageState extends State<AddDiscountPage> {
  final _formKey = GlobalKey<FormState>();
  String _name = '';
  String _description = '';
  double _discountPercentage = 0.0;
  String? _applicableCategory;
  int? _minimumQuantity;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));

  final List<String> _categories = [
    'Groceries',
    'Dairy',
    'Beverages',
    'Snacks',
    'Household',
    'Personal Care',
    'Medicines',
    'All',
  ];

  void _selectStartDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (date != null) {
      setState(() {
        _startDate = date;
        if (_endDate.isBefore(_startDate)) {
          _endDate = _startDate.add(const Duration(days: 30));
        }
      });
    }
  }

  void _selectEndDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _endDate,
      firstDate: _startDate,
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (date != null) {
      setState(() {
        _endDate = date;
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      final discount = Discount(
        id: const Uuid().v4(),
        name: _name,
        description: _description,
        discountPercentage: _discountPercentage,
        applicableCategory: _applicableCategory,
        minimumQuantity: _minimumQuantity,
        startDate: _startDate,
        endDate: _endDate,
      );

      context.read<DiscountBloc>().add(SaveDiscount(discount));
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
        title: const Text('Add Discount',
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
                const InputLabel(text: 'Discount Name'),
                TextFormField(
                  decoration: const InputDecoration(
                    hintText: 'e.g. Summer Sale',
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: AppValidators.required('Please enter a name'),
                  onSaved: (value) => _name = value!,
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'Description'),
                TextFormField(
                  decoration: const InputDecoration(
                    hintText: 'Describe the offer',
                  ),
                  maxLines: 2,
                  validator:
                      AppValidators.required('Please enter a description'),
                  onSaved: (value) => _description = value!,
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'Discount Percentage'),
                TextFormField(
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    hintText: '0',
                    suffixText: '%',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a percentage';
                    }
                    final percent = double.tryParse(value);
                    if (percent == null || percent <= 0 || percent > 100) {
                      return 'Enter a value between 0 and 100';
                    }
                    return null;
                  },
                  onSaved: (value) =>
                      _discountPercentage = double.parse(value!),
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'Applicable Category'),
                DropdownButtonFormField<String>(
                  value: _applicableCategory,
                  decoration: const InputDecoration(
                    hintText: 'Select category (optional)',
                  ),
                  items: _categories.map((cat) {
                    return DropdownMenuItem(value: cat, child: Text(cat));
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _applicableCategory = value == 'All' ? null : value;
                    });
                  },
                  onSaved: (value) =>
                      _applicableCategory = value == 'All' ? null : value,
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'Minimum Quantity'),
                TextFormField(
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'Optional - for bulk discounts',
                  ),
                  onSaved: (value) =>
                      _minimumQuantity = int.tryParse(value ?? ''),
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'Start Date'),
                InkWell(
                  onTap: _selectStartDate,
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
                          '${_startDate.day}/${_startDate.month}/${_startDate.year}',
                        ),
                        const Icon(Icons.calendar_today, size: 20),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const InputLabel(text: 'End Date'),
                InkWell(
                  onTap: _selectEndDate,
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
                          '${_endDate.day}/${_endDate.month}/${_endDate.year}',
                        ),
                        const Icon(Icons.calendar_today, size: 20),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: PrimaryButton(
        onPressed: _submit,
        icon: Icons.local_offer,
        label: 'Add Discount',
      ),
    );
  }
}
