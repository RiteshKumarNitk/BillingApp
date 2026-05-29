import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:vibration/vibration.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../billing/presentation/bloc/billing_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../domain/entities/cart_item.dart';
import '../../../product/presentation/bloc/product_bloc.dart';
import '../../../product/domain/entities/product.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    returnImage: false,
  );

  bool _isCameraOn = false; // Default to false to match web flow
  bool _isFlashOn = false;
  final TextEditingController _searchController = TextEditingController();

  // Cooldown mapping to prevent rapid firing of the same barcode
  final Map<String, DateTime> _lastScanTimes = {};

  @override
  void dispose() {
    _scannerController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    final List<Barcode> barcodes = capture.barcodes;
    final now = DateTime.now();

    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        final rawValue = barcode.rawValue!;

        // Cooldown logic: 2 seconds per identical barcode
        if (_lastScanTimes.containsKey(rawValue)) {
          final lastScan = _lastScanTimes[rawValue]!;
          if (now.difference(lastScan).inSeconds < 2) {
            continue;
          }
        }

        _lastScanTimes[rawValue] = now;

        // Vibrate
        final hasVibrator = await Vibration.hasVibrator();
        if (hasVibrator == true) {
          Vibration.vibrate();
        }

        if (mounted) {
          context.read<BillingBloc>().add(ScanBarcodeEvent(rawValue));
        }
        break; // Process one barcode at a time per frame
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Bill'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: Icon(_isCameraOn ? Icons.videocam_off : Icons.qr_code_scanner),
            onPressed: () {
              setState(() {
                _isCameraOn = !_isCameraOn;
              });
              if (_isCameraOn) {
                _scannerController.start();
              } else {
                _scannerController.stop();
              }
            },
          )
        ],
      ),
      body: BlocListener<BillingBloc, BillingState>(
        listenWhen: (previous, current) =>
            previous.errorMessage != current.errorMessage &&
            current.errorMessage != null,
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        child: Column(
          children: [
            // Search Bar Area
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: _buildSearchBar(),
            ),

            // Scanner View (Collapsible)
            if (_isCameraOn)
              SizedBox(
                height: 250,
                child: _buildScannerSection(),
              ),

            // Bottom Panel for Cart Items
            Expanded(
              child: _buildBottomPanel(),
            ),
          ],
        ),
      ),
      bottomSheet:
          BlocBuilder<BillingBloc, BillingState>(builder: (context, state) {
        return PrimaryButton(
          onPressed: state.cartItems.isEmpty
              ? null
              : () async {
                  _scannerController.stop();
                  await context.push('/checkout');
                  if (_isCameraOn && mounted) _scannerController.start();
                },
          icon: Icons.payment,
          label: 'Review Order',
        );
      }),
    );
  }

  Widget _buildSearchBar() {
    return BlocBuilder<ProductBloc, ProductState>(
      builder: (context, state) {
        return Autocomplete<Product>(
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return const Iterable<Product>.empty();
            }
            return state.products.where((Product product) {
              return product.name
                      .toLowerCase()
                      .contains(textEditingValue.text.toLowerCase()) ||
                  product.barcode.contains(textEditingValue.text);
            });
          },
          displayStringForOption: (Product option) => option.name,
          onSelected: (Product selection) {
            context.read<BillingBloc>().add(AddProductToCartEvent(CartItem(
              product: selection,
              unitPrice: selection.salePrice,
            )));
            _searchController.clear();
          },
          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
            return TextField(
              controller: controller,
              focusNode: focusNode,
              decoration: InputDecoration(
                hintText: 'Search products by name or barcode...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[100],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildScannerSection() {
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),
          // Removed _buildCameraOffState reference

          // Overlay Actions (Top Right)
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            right: 16,
            child: Column(
              children: [
                _buildOverlayButton(
                  icon: Icons.settings,
                  onPressed: () async {
                    _scannerController.stop();
                    await context.push('/settings');
                    if (_isCameraOn && mounted) _scannerController.start();
                  },
                ),
                const SizedBox(height: 16),
                if (_isCameraOn)
                  _buildOverlayButton(
                    icon:
                        _isFlashOn ? Icons.flashlight_off : Icons.flashlight_on,
                    onPressed: () {
                      setState(() => _isFlashOn = !_isFlashOn);
                      _scannerController.toggleTorch();
                    },
                  ),
                if (_isCameraOn) const SizedBox(height: 16),
                _buildOverlayButton(
                  icon: _isCameraOn ? Icons.videocam : Icons.videocam_off,
                  // color:  Colors.white24 ,
                  onPressed: () {
                    setState(() {
                      _isCameraOn = !_isCameraOn;
                    });
                    if (_isCameraOn) {
                      _scannerController.start();
                    } else {
                      _scannerController.stop();
                    }
                  },
                ),
              ],
            ),
          ),

          // Central Overlay Bounding Box
          if (_isCameraOn)
            Center(
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white24, width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Stack(
                  children: [
                    // Corners
                    _buildCorner(Alignment.topLeft),
                    _buildCorner(Alignment.topRight),
                    _buildCorner(Alignment.bottomLeft),
                    _buildCorner(Alignment.bottomRight),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }



  Widget _buildOverlayButton(
      {required IconData icon, required VoidCallback onPressed, Color? color}) {
    return Container(
      width: 44,
      height: 44,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: color ?? Colors.black45,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24),
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildCorner(Alignment alignment) {
    return Align(
      alignment: alignment,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          border: Border(
            top: (alignment == Alignment.topLeft ||
                    alignment == Alignment.topRight)
                ? const BorderSide(color: Colors.greenAccent, width: 4)
                : BorderSide.none,
            bottom: (alignment == Alignment.bottomLeft ||
                    alignment == Alignment.bottomRight)
                ? const BorderSide(color: Colors.greenAccent, width: 4)
                : BorderSide.none,
            left: (alignment == Alignment.topLeft ||
                    alignment == Alignment.bottomLeft)
                ? const BorderSide(color: Colors.greenAccent, width: 4)
                : BorderSide.none,
            right: (alignment == Alignment.topRight ||
                    alignment == Alignment.bottomRight)
                ? const BorderSide(color: Colors.greenAccent, width: 4)
                : BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: const [
          BoxShadow(
              color: Colors.black26, blurRadius: 15, offset: Offset(0, -5))
        ],
      ),
      child: Column(
        children: [
          // Drag handle indicator
          Container(
            width: 48,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          BlocBuilder<BillingBloc, BillingState>(
            builder: (context, state) {
              final totalItems =
                  state.cartItems.fold<int>(0, (sum, i) => sum + i.quantity);
              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Cart Items',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w600)),
                        Text('$totalItems items total',
                            style: const TextStyle(
                                fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('TOTAL PRICE',
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                                letterSpacing: 1.2)),
                        Text(
                          '₹${state.totalAmount.toStringAsFixed(2)}',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Theme.of(context).primaryColor),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
          const Divider(height: 1),

          // List View
          Expanded(
            child: Stack(children: [
              BlocBuilder<BillingBloc, BillingState>(
                builder: (context, state) {
                  if (state.cartItems.isEmpty) {
                    return _buildEmptyCart();
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.only(
                        left: 15, right: 15, top: 16, bottom: 100),
                    itemCount: state.cartItems.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = state.cartItems[index];
                      return _buildCartItemCard(context, item);
                    },
                  );
                },
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child:
                Icon(Icons.shopping_basket, size: 40, color: Colors.grey[300]),
          ),
          const SizedBox(height: 16),
          const Text('List is empty',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Scanned items will appear here as you scan them with the camera above.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItemCard(
    BuildContext context,
    CartItem item,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        spacing: 1,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${item.product.price.toStringAsFixed(2)}',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _circularIconButton(
                    icon: Icons.remove,
                    onPressed: () {
                      if (item.quantity > 1) {
                        context.read<BillingBloc>().add(UpdateQuantityEvent(
                            item.product.id, item.quantity - 1));
                      } else {
                        context
                            .read<BillingBloc>()
                            .add(RemoveProductFromCartEvent(item.product.id));
                      }
                    }),
                SizedBox(
                  width: 32,
                  child: Text(
                    '${item.quantity}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                _circularIconButton(
                    icon: Icons.add,
                    onPressed: () {
                      context.read<BillingBloc>().add(UpdateQuantityEvent(
                          item.product.id, item.quantity + 1));
                    }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _circularIconButton(
      {required IconData icon, required VoidCallback onPressed}) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: Icon(icon, size: 20, color: Colors.grey[600]),
      ),
    );
  }

  // A floating Details/Checkout Button at the very bottom
  // Added a Stack wrapper below to overlay this button
}
