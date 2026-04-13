import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:uuid/uuid.dart';
import 'package:permission_handler/permission_handler.dart';

import '../bloc/product_bloc.dart';
import '../../domain/entities/product.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/primary_button.dart';

class BulkImportPage extends StatefulWidget {
  const BulkImportPage({super.key});

  @override
  State<BulkImportPage> createState() => _BulkImportPageState();
}

class _BulkImportPageState extends State<BulkImportPage> {
  final ImagePicker _picker = ImagePicker();
  final TextRecognizer _textRecognizer = TextRecognizer();

  bool _isProcessing = false;
  String _extractedText = '';
  List<ParsedProduct> _parsedProducts = [];
  File? _selectedImage;

  @override
  void dispose() {
    _textRecognizer.close();
    super.dispose();
  }

  Future<void> _captureFromCamera() async {
    final status = await Permission.camera.request();
    if (status.isDenied) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Camera permission is required')),
        );
      }
      return;
    }

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
    );

    if (image != null) {
      await _processImage(File(image.path));
    }
  }

  Future<void> _selectFromGallery() async {
    final status = await Permission.photos.request();
    if (status.isDenied) {
      // Try without permission for gallery on some devices
    }

    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
    );

    if (image != null) {
      await _processImage(File(image.path));
    }
  }

  Future<void> _processImage(File image) async {
    setState(() {
      _isProcessing = true;
      _selectedImage = image;
      _extractedText = '';
      _parsedProducts = [];
    });

    try {
      final inputImage = InputImage.fromFile(image);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      setState(() {
        _extractedText = recognizedText.text;
        _parsedProducts = _parseInvoiceText(recognizedText.text);
        _isProcessing = false;
      });

      if (_parsedProducts.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'No products found. Try a clearer image or add manually.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error processing image: $e')),
        );
      }
    }
  }

  List<ParsedProduct> _parseInvoiceText(String text) {
    final List<ParsedProduct> products = [];
    final lines = text.split('\n');

    // Common patterns for invoices
    // Pattern 1: Name followed by price (e.g., "Sugar 50" or "Sugar Rs.50" or "Sugar 50.00")
    // Pattern 2: Barcode patterns (13 digits typically)
    // Pattern 3: Quantity patterns

    final pricePattern = RegExp(
        r'(?:Rs\.?|₹|Rs|Rupees|MRP|Price|MRP\s*[:\-]?\s*)?(\d+(?:\.\d{1,2})?)',
        caseSensitive: false);
    final barcodePattern = RegExp(r'(\d{8,14})');
    final quantityPattern = RegExp(
        r'(?:Qty|Quantity|Qty\.|pcs|pieces|units?|pcs\.|x)\s*[:\-]?\s*(\d+)',
        caseSensitive: false);

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (line.isEmpty || line.length < 2) continue;

      // Skip header/footer lines
      if (line.toLowerCase().contains('invoice') ||
          line.toLowerCase().contains('total') ||
          line.toLowerCase().contains('subtotal') ||
          line.toLowerCase().contains('tax') ||
          line.toLowerCase().contains('grand') ||
          line.toLowerCase().contains('date') ||
          line.toLowerCase().contains('address') ||
          line.toLowerCase().contains('phone') ||
          line.toLowerCase().contains('www.') ||
          line.toLowerCase().contains('http')) {
        continue;
      }

      // Try to extract barcode
      String? barcode;
      final barcodeMatch = barcodePattern.firstMatch(line);
      if (barcodeMatch != null) {
        barcode = barcodeMatch.group(1);
      }

      // Try to extract price
      double? price;
      final priceMatches = pricePattern.allMatches(line);
      for (final match in priceMatches) {
        final priceStr = match.group(1);
        if (priceStr != null) {
          final parsed = double.tryParse(priceStr);
          if (parsed != null && parsed > 0 && parsed < 100000) {
            price = parsed;
            break;
          }
        }
      }

      // Try to extract quantity
      int quantity = 1;
      final qtyMatch = quantityPattern.firstMatch(line);
      if (qtyMatch != null) {
        quantity = int.tryParse(qtyMatch.group(1) ?? '1') ?? 1;
      }

      // Extract product name (remove numbers and prices)
      String name = line
          .replaceAll(pricePattern, '')
          .replaceAll(barcodePattern, '')
          .replaceAll(quantityPattern, '')
          .replaceAll(RegExp(r'\d+(?:\.\d+)?'), '')
          .replaceAll(RegExp(r'[^\w\s\-&]'), '')
          .trim();

      // Clean up name
      if (name.isEmpty || name.length < 2) continue;
      name = name.replaceAll(RegExp(r'\s+'), ' ');
      if (name.length < 2) continue;

      // Skip if name is too short or looks like a number
      if (RegExp(r'^\d+$').hasMatch(name)) continue;

      products.add(ParsedProduct(
        id: const Uuid().v4(),
        name: name,
        barcode: barcode ?? '',
        price: price ?? 0.0,
        stock: quantity,
      ));
    }

    // Remove duplicates based on name
    final seen = <String>{};
    return products.where((p) => seen.add(p.name.toLowerCase())).toList();
  }

  void _updateProduct(int index, ParsedProduct product) {
    setState(() {
      _parsedProducts[index] = product;
    });
  }

  void _removeProduct(int index) {
    setState(() {
      _parsedProducts.removeAt(index);
    });
  }

  void _importProducts() {
    if (_parsedProducts.isEmpty) return;

    for (final parsed in _parsedProducts) {
      if (parsed.name.isEmpty) continue;

      final product = Product(
        id: parsed.id,
        name: parsed.name,
        barcode: parsed.barcode.isEmpty ? const Uuid().v4() : parsed.barcode,
        price: parsed.price,
        stock: parsed.stock,
      );

      context.read<ProductBloc>().add(AddProduct(product));
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text('${_parsedProducts.length} products imported successfully!'),
        backgroundColor: Colors.green,
      ),
    );

    context.pop();
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
          onPressed: () => context.pop(),
        ),
        title: const Text('Bulk Import',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: _isProcessing
          ? const Center(child: CircularProgressIndicator())
          : _parsedProducts.isEmpty
              ? _buildScanOptions()
              : _buildPreviewList(),
      bottomNavigationBar: _parsedProducts.isNotEmpty
          ? PrimaryButton(
              onPressed: _importProducts,
              icon: Icons.upload,
              label: 'Import ${_parsedProducts.length} Products',
            )
          : null,
    );
  }

  Widget _buildScanOptions() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.document_scanner,
                          color: Theme.of(context).primaryColor, size: 32),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Scan Invoice / Product List',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Take a photo of your invoice, excel printout, or product list to automatically extract product details.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Select Source',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildSourceCard(
                  icon: Icons.camera_alt,
                  title: 'Camera',
                  subtitle: 'Scan document',
                  onTap: _captureFromCamera,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildSourceCard(
                  icon: Icons.photo_library,
                  title: 'Gallery',
                  subtitle: 'Select image',
                  onTap: _selectFromGallery,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          const Text('Supported Formats',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          const _FormatItem(text: 'Invoice printouts'),
          const _FormatItem(text: 'Excel/CSV printouts'),
          const _FormatItem(text: 'Product price lists'),
          const _FormatItem(text: 'Barcode sheets'),
          const _FormatItem(text: 'Handwritten inventory lists'),
          const SizedBox(height: 32),
          Center(
            child: TextButton.icon(
              onPressed: () => context.push('/products/add'),
              icon: const Icon(Icons.add),
              label: const Text('Or add products manually'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[200]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 28),
            ),
            const SizedBox(height: 12),
            Text(title,
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text(subtitle,
                style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewList() {
    return Column(
      children: [
        if (_selectedImage != null)
          Container(
            height: 150,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              image: DecorationImage(
                image: FileImage(_selectedImage!),
                fit: BoxFit.cover,
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                'Found ${_parsedProducts.length} Products',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _parsedProducts = [];
                    _selectedImage = null;
                  });
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Rescan'),
              ),
            ],
          ),
        ),
        const Divider(),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _parsedProducts.length,
            itemBuilder: (context, index) {
              final product = _parsedProducts[index];
              return _buildProductCard(product, index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(ParsedProduct product, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: product.name,
                    decoration: const InputDecoration(
                      labelText: 'Product Name',
                      isDense: true,
                    ),
                    onChanged: (value) =>
                        _updateProduct(index, product.copyWith(name: value)),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () => _removeProduct(index),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: product.barcode,
                    decoration: const InputDecoration(
                      labelText: 'Barcode',
                      isDense: true,
                    ),
                    onChanged: (value) =>
                        _updateProduct(index, product.copyWith(barcode: value)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue:
                        product.price > 0 ? product.price.toString() : '',
                    decoration: const InputDecoration(
                      labelText: 'Price',
                      prefixText: '₹ ',
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) => _updateProduct(index,
                        product.copyWith(price: double.tryParse(value) ?? 0)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: product.stock.toString(),
                    decoration: const InputDecoration(
                      labelText: 'Stock',
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) => _updateProduct(index,
                        product.copyWith(stock: int.tryParse(value) ?? 1)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ParsedProduct {
  final String id;
  final String name;
  final String barcode;
  final double price;
  final int stock;

  ParsedProduct({
    required this.id,
    required this.name,
    required this.barcode,
    required this.price,
    required this.stock,
  });

  ParsedProduct copyWith({
    String? id,
    String? name,
    String? barcode,
    double? price,
    int? stock,
  }) {
    return ParsedProduct(
      id: id ?? this.id,
      name: name ?? this.name,
      barcode: barcode ?? this.barcode,
      price: price ?? this.price,
      stock: stock ?? this.stock,
    );
  }
}

class _FormatItem extends StatelessWidget {
  final String text;
  const _FormatItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(Icons.check_circle, size: 16, color: Colors.green[400]),
          const SizedBox(width: 8),
          Text(text),
        ],
      ),
    );
  }
}
