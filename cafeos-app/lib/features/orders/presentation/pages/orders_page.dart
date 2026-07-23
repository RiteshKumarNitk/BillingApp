import 'package:flutter/material.dart';
import '../../../../shared/widgets/coming_soon_view.dart';

class OrdersPage extends StatelessWidget {
  const OrdersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your Orders')),
      body: const ComingSoonView(
        icon: Icons.receipt_long_outlined,
        title: 'Order tracking is next',
        message: 'Placing orders, live status, and history land in the next build milestone.',
      ),
    );
  }
}
