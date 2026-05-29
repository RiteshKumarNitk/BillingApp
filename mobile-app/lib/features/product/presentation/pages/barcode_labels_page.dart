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

class BarcodeLabelsPage extends StatefulWidget {
  const BarcodeLabelsPage({super.key});

  @override
  State<BarcodeLabelsPage> createState() => _BarcodeLabelsPageState();
}

class _BarcodeLabelsPageState extends State<BarcodeLabelsPage> {
  Product? _selectedProduct;
  ProductVariant? _selectedVariant;
  int _quantity = 12; // Default to 12 labels
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    context.read<ProductBloc>().add(LoadProducts());
  }

  Future<void> _generatePdf() async {
    if (_selectedProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a product first.')),
      );
      return;
    }

    final barcodeToPrint = _selectedVariant?.barcode ?? _selectedProduct!.barcode;
    final nameToPrint = _selectedVariant != null
        ? '${_selectedProduct!.name} - ${_selectedVariant!.name}'
        : _selectedProduct!.name;
    final priceToPrint = _selectedVariant?.salePrice ?? _selectedProduct!.salePrice;

    if (barcodeToPrint == null || barcodeToPrint.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selected product/variant does not have a barcode.')),
      );
      return;
    }

    setState(() {
      _isGenerating = true;
    });

    try {
      final pdf = pw.Document();

      // Configure a standard A4 page with a grid of labels
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(20),
          build: (pw.Context context) {
            final List<pw.Widget> labels = List.generate(_quantity, (index) {
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
                      nameToPrint,
                      style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                      maxLines: 1,
                    ),
                    pw.SizedBox(height: 4),
                    pw.Expanded(
                      child: pw.BarcodeWidget(
                        barcode: pw.Barcode.code128(),
                        data: barcodeToPrint,
                        width: 120,
                        height: 40,
                        drawText: true,
                        textStyle: const pw.TextStyle(fontSize: 8),
                      ),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      'Rs. ${priceToPrint.toStringAsFixed(2)}',
                      style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                    ),
                  ],
                ),
              );
            });

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
      setState(() {
        _isGenerating = false;
      });
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

          return Padding(
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
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Creates an A4 PDF with a grid of barcode labels ready for printing.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: PrimaryButton(
                    onPressed: _isGenerating ? () {} : _generatePdf,
                    label: _isGenerating ? 'Generating...' : 'Generate PDF',
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
