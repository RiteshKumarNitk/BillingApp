import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../cart/presentation/cubit/cart_cubit.dart';
import '../cubit/scanner_cubit.dart';
import '../cubit/scanner_state.dart';

/// Replaces the Milestone-1 placeholder. Scan -> validate table -> fetch cafe -> attach the table
/// token to Cart -> open that cafe's Menu, matching the spec's "Everything should happen
/// automatically" QR flow.
class ScannerPage extends StatelessWidget {
  const ScannerPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<ScannerCubit>(),
      child: const _ScannerView(),
    );
  }
}

class _ScannerView extends StatefulWidget {
  const _ScannerView();

  @override
  State<_ScannerView> createState() => _ScannerViewState();
}

class _ScannerViewState extends State<_ScannerView> {
  late final MobileScannerController _controller = MobileScannerController(detectionSpeed: DetectionSpeed.normal);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Scan Table QR'),
        actions: [
          IconButton(icon: const Icon(Icons.flash_on_rounded), onPressed: () => _controller.toggleTorch()),
        ],
      ),
      body: BlocConsumer<ScannerCubit, ScannerState>(
        listener: (context, state) {
          if (state.status == ScannerStatus.success && state.cafe != null && state.table != null) {
            context.read<CartCubit>().setTable(token: state.table!.token, label: state.table!.label);
            context.pushReplacement('/cafes/${state.cafe!.id}/menu', extra: state.cafe);
          } else if (state.status == ScannerStatus.invalidQr) {
            AppToast.error(context, state.errorMessage ?? 'Invalid QR code');
            context.read<ScannerCubit>().reset();
          } else if (state.status == ScannerStatus.error) {
            AppToast.error(context, state.errorMessage ?? 'Could not open this cafe');
            context.read<ScannerCubit>().reset();
          }
        },
        builder: (context, state) {
          return Stack(
            fit: StackFit.expand,
            children: [
              MobileScanner(
                controller: _controller,
                onDetect: (capture) {
                  final value = capture.barcodes.firstOrNull?.rawValue;
                  if (value != null) context.read<ScannerCubit>().handleScan(value);
                },
                errorBuilder: (context, error, child) => _CameraError(error: error),
              ),
              IgnorePointer(
                child: Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white.withValues(alpha: 0.9), width: 2.5),
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 48,
                child: Column(
                  children: [
                    Text(
                      state.status == ScannerStatus.processing ? 'Checking QR code...' : "Point your camera at the table's QR code",
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.center,
                    ),
                    if (state.status == ScannerStatus.processing) ...[
                      const SizedBox(height: 12),
                      const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white)),
                    ],
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  final MobileScannerException error;
  const _CameraError({required this.error});

  @override
  Widget build(BuildContext context) {
    final isPermission = error.errorCode == MobileScannerErrorCode.permissionDenied;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.no_photography_rounded, size: 48, color: Colors.white70),
            const SizedBox(height: 16),
            Text(
              isPermission ? 'Camera access is needed to scan a table QR code.' : 'Could not start the camera.',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              isPermission ? 'Enable camera access for CafeOS in your device settings, then try again.' : error.errorDetails?.message ?? 'Please try again.',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
