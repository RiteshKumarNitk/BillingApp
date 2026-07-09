import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../bloc/product_bloc.dart';
import '../../domain/entities/product.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/primary_button.dart';

class _QueueItem {
  final Product product;
  final ProductVariant? variant;
  int quantity;

  _QueueItem({required this.product, this.variant, required this.quantity});

  String get barcode => variant?.barcode ?? product.barcode ?? '';
  String get displayName => variant != null ? '${product.name} - ${variant!.name}' : product.name;
  double get price => variant?.salePrice ?? product.salePrice;
}

class BarcodeLabelsPage extends StatefulWidget {
  const BarcodeLabelsPage({super.key});

  @override
  State<BarcodeLabelsPage> createState() => _BarcodeLabelsPageState();
}

class _BarcodeLabelsPageState extends State<BarcodeLabelsPage> {
  Product? _selectedProduct;
  ProductVariant? _selectedVariant;
  int _quantity = 12; // Default to 12 labels for the item being added
  bool _isGenerating = false;

  final List<_QueueItem> _queue = [];

  @override
  void initState() {
    super.initState();
    context.read<ProductBloc>().add(LoadProducts());
  }

  void _addToQueue() {
    if (_selectedProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a product first.')),
      );
      return;
    }

    final barcode = _selectedVariant?.barcode ?? _selectedProduct!.barcode;
    if (barcode == null || barcode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selected product/variant does not have a barcode.')),
      );
      return;
    }

    setState(() {
      final existingIndex = _queue.indexWhere((q) =>
          q.product.id == _selectedProduct!.id && q.variant?.id == _selectedVariant?.id);
      if (existingIndex >= 0) {
        _queue[existingIndex].quantity += _quantity;
      } else {
        _queue.add(_QueueItem(product: _selectedProduct!, variant: _selectedVariant, quantity: _quantity));
      }
      _selectedProduct = null;
      _selectedVariant = null;
      _quantity = 12;
    });
  }

  void _removeFromQueue(int index) {
    setState(() => _queue.removeAt(index));
  }

  Future<void> _generatePdf() async {
    if (_queue.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add at least one item to the queue first.')),
      );
      return;
    }

    setState(() {
      _isGenerating = true;
    });

    try {
      final pdf = pw.Document();

      final List<pw.Widget> labels = [];
      for (final item in _queue) {
        labels.addAll(List.generate(item.quantity, (index) {
          return pw.Container(
            width: 150,
            height: 80,
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
            ),
            padding: const pw.EdgeInsets.all(8),
            child: pw.Column(
              mainAxisAlignment: pw.MainAxisAlignment.center,
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                pw.Text(
                  item.displayName,
                  style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                  maxLines: 1,
                ),
                pw.SizedBox(height: 4),
                pw.Expanded(
                  child: pw.BarcodeWidget(
                    barcode: pw.Barcode.code128(),
                    data: item.barcode,
                    width: 120,
                    height: 40,
                    drawText: true,
                    textStyle: const pw.TextStyle(fontSize: 8),
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  'Rs. ${item.price.toStringAsFixed(2)}',
                  style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                ),
              ],
            ),
          );
        }));
      }

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(20),
          build: (pw.Context context) {
            return [
              pw.Wrap(
                spacing: 10,
                runSpacing: 10,
                children: labels,
              )
            ];
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/barcode_labels.pdf');
      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        Share.shareXFiles([XFile(file.path)], text: 'Barcode Labels PDF');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating PDF: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGenerating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Barcode Labels'),
        centerTitle: true,
      ),
      body: BlocBuilder<ProductBloc, ProductState>(
        builder: (context, state) {
          if (state.status == ProductStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          final productsWithBarcodes = state.products.where((p) =>
            (p.barcode != null && p.barcode!.isNotEmpty) ||
            (p.variants != null && p.variants!.any((v) => v.barcode != null && v.barcode!.isNotEmpty))
          ).toList();

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '1. Select Product',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<Product>(
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Choose a product...',
                        ),
                        isExpanded: true,
                        value: _selectedProduct,
                        items: productsWithBarcodes.map((p) {
                          return DropdownMenuItem(
                            value: p,
                            child: Text(p.name),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedProduct = val;
                            _selectedVariant = null; // Reset variant on product change
                          });
                        },
                      ),
                      if (_selectedProduct != null && _selectedProduct!.variants != null && _selectedProduct!.variants!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Select Variant',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<ProductVariant>(
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: 'Choose a variant...',
                          ),
                          isExpanded: true,
                          value: _selectedVariant,
                          items: _selectedProduct!.variants!.where((v) => v.barcode != null && v.barcode!.isNotEmpty).map((v) {
                            return DropdownMenuItem(
                              value: v,
                              child: Text('${v.name} (Rs. ${v.salePrice})'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() {
                              _selectedVariant = val;
                            });
                          },
                        ),
                      ],
                      const SizedBox(height: 24),
                      const Text(
                        '2. Number of Labels',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: () {
                              if (_quantity > 1) {
                                setState(() => _quantity--);
                              }
                            },
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _quantity.toString(),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () {
                              if (_quantity < 100) {
                                setState(() => _quantity++);
                              }
                            },
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: _addToQueue,
                            icon: const Icon(Icons.playlist_add),
                            label: const Text('Add to Queue'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      if (_queue.isNotEmpty) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '3. Print Queue (${_queue.length} item${_queue.length == 1 ? '' : 's'})',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '${_queue.fold<int>(0, (sum, q) => sum + q.quantity)} labels total',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ..._queue.asMap().entries.map((entry) {
                          final index = entry.key;
                          final item = entry.value;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              dense: true,
                              title: Text(item.displayName),
                              subtitle: Text('${item.quantity} labels · Rs. ${item.price.toStringAsFixed(2)}'),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _removeFromQueue(index),
                              ),
                            ),
                          );
                        }),
                      ] else
                        const Text(
                          'Add products to the queue, then generate one combined PDF.',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: PrimaryButton(
                    onPressed: _isGenerating ? () {} : _generatePdf,
                    label: _isGenerating ? 'Generating...' : 'Generate PDF (${_queue.length} item${_queue.length == 1 ? '' : 's'})',
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
