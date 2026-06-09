import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  static const Color brandYellow = Color(0xFFFFE11B);
  static const Color brandDark = Color(0xFF2D2D2D);

  MobileScannerController? _controller;
  bool _isProcessing = false;
  bool _isTorchOn = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      formats: [BarcodeFormat.qrCode],
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  String? _extractTenantId(String raw) {
    // Handle URL format: https://domain.com/menu/TENANT_ID or /customer-app/menu/TENANT_ID
    final urlPatterns = [
      RegExp(r'/menu/([a-zA-Z0-9]+)'),
      RegExp(r'/customer-app/menu/([a-zA-Z0-9]+)'),
      RegExp(r'tenantId=([a-zA-Z0-9]+)'),
    ];
    for (final pattern in urlPatterns) {
      final match = pattern.firstMatch(raw);
      if (match != null) return match.group(1);
    }

    // Handle raw tenantId (alphanumeric string, 10+ chars typical for MongoDB ObjectId)
    final trimmed = raw.trim();
    if (RegExp(r'^[a-zA-Z0-9]{10,}$').hasMatch(trimmed)) {
      return trimmed;
    }

    return null;
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;

    for (final barcode in capture.barcodes) {
      final raw = barcode.rawValue;
      if (raw == null || raw.isEmpty) continue;

      final tenantId = _extractTenantId(raw);
      if (tenantId != null) {
        HapticFeedback.mediumImpact();
        setState(() => _isProcessing = true);
        if (mounted) {
          context.go('/customer-app/menu/$tenantId');
        }
        return;
      }
    }

    // If we got here, no valid QR was found
    if (mounted && !_isProcessing) {
      setState(() => _error = 'Invalid QR code. Please scan a store QR code.');
      // Clear error after 2 seconds
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _error = null);
      });
    }
  }

  void _toggleTorch() async {
    if (_controller == null) return;
    await _controller!.toggleTorch();
    setState(() => _isTorchOn = !_isTorchOn);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera preview
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // Scanning overlay
          _buildScanOverlay(),

          // Top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                16,
                MediaQuery.of(context).padding.top + 8,
                16,
                16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Scan Store QR',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _toggleTorch,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _isTorchOn
                            ? brandYellow.withValues(alpha: 0.9)
                            : Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _isTorchOn ? Icons.flash_on : Icons.flash_off,
                        color: _isTorchOn ? brandDark : Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom hint
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                24,
                24,
                24,
                MediaQuery.of(context).padding.bottom + 24,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _error!,
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (_isProcessing)
                    const CircularProgressIndicator(color: brandYellow, strokeWidth: 2)
                  else
                    Text(
                      'Point camera at a store QR code',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanOverlay() {
    return Center(
      child: Container(
        width: 260,
        height: 260,
        decoration: BoxDecoration(
          border: Border.all(color: brandYellow, width: 3),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Stack(
          children: [
            // Corner decorations
            Positioned(top: -1, left: -1, child: _buildCorner(true, true)),
            Positioned(top: -1, right: -1, child: _buildCorner(true, false)),
            Positioned(bottom: -1, left: -1, child: _buildCorner(false, true)),
            Positioned(bottom: -1, right: -1, child: _buildCorner(false, false)),
            // Center crosshair
            Center(
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  border: Border.all(color: brandYellow.withValues(alpha: 0.5), width: 1.5),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCorner(bool isTop, bool isLeft) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          left: isLeft ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: isTop && isLeft ? const Radius.circular(12) : Radius.zero,
          topRight: isTop && !isLeft ? const Radius.circular(12) : Radius.zero,
          bottomLeft: !isTop && isLeft ? const Radius.circular(12) : Radius.zero,
          bottomRight: !isTop && !isLeft ? const Radius.circular(12) : Radius.zero,
        ),
      ),
    );
  }
}
