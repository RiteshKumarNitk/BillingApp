import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../features/billing/domain/entities/transaction.dart';

class PdfGenerator {
  static Future<File> generateInvoice({
    required String shopName,
    required String address1,
    required String address2,
    required String phone,
    required List<TransactionItem> items,
    required double subtotal,
    required double taxAmount,
    required double discountAmount,
    required double totalAmount,
    String? customerName,
    String? customerPhone,
    required String transactionId,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Center(
                child: pw.Text(
                  shopName,
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ),
              pw.SizedBox(height: 8),
              pw.Center(
                child: pw.Text(
                  '$address1 ${address2.isNotEmpty ? ', $address2' : ''}',
                  style: const pw.TextStyle(fontSize: 12),
                ),
              ),
              pw.Center(
                child: pw.Text(
                  'Phone: $phone',
                  style: const pw.TextStyle(fontSize: 12),
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.SizedBox(height: 10),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'Invoice #: ${transactionId.substring(0, 8).toUpperCase()}',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                  ),
                  pw.Text(
                    'Date: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
                  ),
                ],
              ),
              if (customerName != null) ...[
                pw.SizedBox(height: 8),
                pw.Text(
                    'Customer: $customerName${customerPhone != null ? ' ($customerPhone)' : ''}'),
              ],
              pw.SizedBox(height: 20),
              pw.Table.fromTextArray(
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                headerDecoration:
                    const pw.BoxDecoration(color: PdfColors.grey300),
                headers: ['Item', 'Qty', 'Price', 'Total'],
                data: items
                    .map((item) => [
                          item.productName,
                          item.quantity.toString(),
                          '₹${item.price.toStringAsFixed(2)}',
                          '₹${item.total.toStringAsFixed(2)}',
                        ])
                    .toList(),
              ),
              pw.SizedBox(height: 20),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Subtotal: ₹${subtotal.toStringAsFixed(2)}'),
                      if (discountAmount > 0)
                        pw.Text(
                            'Discount: -₹${discountAmount.toStringAsFixed(2)}'),
                      if (taxAmount > 0)
                        pw.Text('Tax: ₹${taxAmount.toStringAsFixed(2)}'),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        'Grand Total: ₹${totalAmount.toStringAsFixed(2)}',
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              pw.Spacer(),
              pw.Center(
                child: pw.Text(
                  'Thank you for shopping with us!',
                  style: const pw.TextStyle(fontSize: 12),
                ),
              ),
            ],
          );
        },
      ),
    );

    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/invoice_$transactionId.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static Future<void> shareInvoice(File pdfFile, String phoneNumber) async {
    if (phoneNumber.isEmpty) {
      await Share.shareXFiles(
        [XFile(pdfFile.path)],
        text: 'Your invoice',
      );
      return;
    }

    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    final waUrl =
        'https://wa.me/$cleanPhone?text=Please find your invoice attached.';

    if (await canLaunchUrl(Uri.parse(waUrl))) {
      await launchUrl(Uri.parse(waUrl), mode: LaunchMode.externalApplication);
    }

    await Share.shareXFiles(
      [XFile(pdfFile.path)],
      text: 'Your invoice',
    );
  }
}
