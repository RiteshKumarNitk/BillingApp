import 'package:flutter/material.dart';
import '../../../../shared/widgets/coming_soon_view.dart';

class ScannerPlaceholderPage extends StatelessWidget {
  const ScannerPlaceholderPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Cafe QR')),
      body: const ComingSoonView(
        icon: Icons.qr_code_scanner_rounded,
        title: 'QR scanning is next',
        message: 'Scan a cafe\'s QR code to jump straight to their menu — landing in the next build milestone.',
      ),
    );
  }
}
