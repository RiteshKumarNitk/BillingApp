import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/transaction.dart';
import '../../../shop/presentation/bloc/shop_bloc.dart';
import '../../../customer/presentation/bloc/customer_bloc.dart';
import '../../../discount/presentation/bloc/discount_bloc.dart';
import '../../../billing/presentation/bloc/sales_history_bloc.dart';
import '../bloc/billing_bloc.dart';
import '../../../../core/utils/pdf_generator.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  double _taxRate = 0.0;
  String _paymentMethod = 'cash';
  final _amountReceivedController = TextEditingController();
  double _amountReceived = 0;
  double _changeAmount = 0;

  @override
  void initState() {
    super.initState();
    context.read<CustomerBloc>().add(const LoadAllCustomers());
    context.read<DiscountBloc>().add(const LoadTodayDiscounts());
  }

  @override
  void dispose() {
    _amountReceivedController.dispose();
    super.dispose();
  }

  void _calculateChange() {
    final billingState = context.read<BillingBloc>().state;
    final total = billingState.totalAmount;
    final received = double.tryParse(_amountReceivedController.text) ?? 0;
    setState(() {
      _amountReceived = received;
      _changeAmount = received - total;
    });
  }

  void _applyDiscount(String id, String name, double percentage) {
    context.read<BillingBloc>().add(ApplyDiscountEvent(
          discountId: id,
          discountName: name,
          discountPercentage: percentage,
        ));
  }

  Future<void> _generatePdfAndShare() async {
    final billingState = context.read<BillingBloc>().state;
    final shopState = context.read<ShopBloc>().state;

    if (shopState is! ShopLoaded) return;

    final transactionId = const Uuid().v4();
    final items = billingState.cartItems
        .map((item) => TransactionItem(
              productId: item.product.id,
              productName: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              total: item.total,
            ))
        .toList();

    final pdfFile = await PdfGenerator.generateInvoice(
      shopName: shopState.shop.name,
      address1: shopState.shop.addressLine1,
      address2: shopState.shop.addressLine2,
      phone: shopState.shop.phoneNumber,
      items: items,
      subtotal: billingState.subtotal,
      taxAmount: billingState.taxAmount,
      discountAmount: billingState.discountAmount,
      totalAmount: billingState.totalAmount,
      customerName: billingState.customerName,
      customerPhone: billingState.customerPhone,
      transactionId: transactionId,
    );

    final phone = billingState.customerPhone ?? '';
    await PdfGenerator.shareInvoice(pdfFile, phone);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Invoice generated and shared!'),
            backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const borderColor = Color(0xFFE5E5EA);

    return PopScope(
        canPop: false,
        onPopInvokedWithResult: (bool didPop, dynamic result) {
          if (didPop) return;
          context.read<BillingBloc>().add(ClearCartEvent());
          context.go('/');
        },
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Checkout',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            centerTitle: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.chevron_left,
                  size: 28, color: Theme.of(context).primaryColor),
              onPressed: () {
                context.read<BillingBloc>().add(ClearCartEvent());
                context.go('/');
              },
            ),
          ),
          body: BlocConsumer<BillingBloc, BillingState>(
            listener: (context, state) {
              if (state.printSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Receipt printed successfully'),
                    backgroundColor: Colors.green));
              }
            },
            builder: (context, billingState) {
              return BlocBuilder<ShopBloc, ShopState>(
                  builder: (context, shopState) {
                String upiId = '';
                String shopName = 'Shop';
                String address1 = '';
                String address2 = '';
                String phone = '';

                if (shopState is ShopLoaded) {
                  upiId = shopState.shop.upiId;
                  shopName = shopState.shop.name;
                  address1 = shopState.shop.addressLine1;
                  address2 = shopState.shop.addressLine2;
                  phone = shopState.shop.phoneNumber;
                }

                return Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Customer Selection
                            _buildSectionTitle('Customer'),
                            BlocBuilder<CustomerBloc, CustomerState>(
                              builder: (context, customerState) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: borderColor),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: DropdownButton<String>(
                                    isExpanded: true,
                                    hint: const Text(
                                        'Select Customer (Optional)'),
                                    value: billingState.customerId,
                                    items: [
                                      const DropdownMenuItem(
                                        value: null,
                                        child: Text('Walk-in Customer'),
                                      ),
                                      ...customerState.customers.map(
                                        (c) => DropdownMenuItem(
                                          value: c.id,
                                          child: Text('${c.name} - ${c.phone}'),
                                        ),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      if (value == null) {
                                        context
                                            .read<BillingBloc>()
                                            .add(ClearCartEvent());
                                      } else {
                                        final customer = customerState.customers
                                            .firstWhere((c) => c.id == value);
                                        context
                                            .read<BillingBloc>()
                                            .add(SetCustomerEvent(
                                              customerId: customer.id,
                                              customerName: customer.name,
                                              customerPhone: customer.phone,
                                            ));
                                      }
                                    },
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 16),

                            // Apply Discount
                            _buildSectionTitle('Apply Coupon/Discount'),
                            BlocBuilder<DiscountBloc, DiscountState>(
                              builder: (context, discountState) {
                                if (discountState.discounts.isEmpty) {
                                  return const Text('No active discounts',
                                      style: TextStyle(color: Colors.grey));
                                }
                                return Wrap(
                                  spacing: 8,
                                  children: [
                                    ActionChip(
                                      label: const Text('No Discount'),
                                      onPressed: () {
                                        context
                                            .read<BillingBloc>()
                                            .add(RemoveDiscountEvent());
                                      },
                                    ),
                                    ...discountState.discounts
                                        .where((d) => d.isValidToday)
                                        .map((d) => ActionChip(
                                              label: Text(
                                                  '${d.name} (${d.discountPercentage.toStringAsFixed(0)}% off)'),
                                              backgroundColor: billingState
                                                          .appliedDiscountId ==
                                                      d.id
                                                  ? Colors.green[100]
                                                  : null,
                                              onPressed: () => _applyDiscount(
                                                  d.id,
                                                  d.name,
                                                  d.discountPercentage),
                                            )),
                                  ],
                                );
                              },
                            ),
                            const SizedBox(height: 16),

                            // Tax Rate
                            _buildSectionTitle('Tax Rate (%)'),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    initialValue: _taxRate.toString(),
                                    keyboardType: TextInputType.number,
                                    decoration: const InputDecoration(
                                      hintText: '0',
                                      suffixText: '%',
                                    ),
                                    onChanged: (value) {
                                      setState(() {
                                        _taxRate = double.tryParse(value) ?? 0;
                                      });
                                      context
                                          .read<BillingBloc>()
                                          .add(SetTaxRateEvent(_taxRate));
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Order Table
                            _buildSectionTitle('Order Details'),
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: borderColor),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Table(
                                  border: const TableBorder(
                                    horizontalInside:
                                        BorderSide(color: borderColor),
                                    bottom: BorderSide(color: borderColor),
                                  ),
                                  children: [
                                    TableRow(
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF8FAFC),
                                      ),
                                      children: [
                                        _buildHeaderCell(
                                            'Item', TextAlign.left),
                                        _buildHeaderCell(
                                            'Qty', TextAlign.center),
                                        _buildHeaderCell(
                                            'Price', TextAlign.right),
                                        _buildHeaderCell(
                                            'Total', TextAlign.right),
                                      ],
                                    ),
                                    ...billingState.cartItems.map((item) {
                                      return TableRow(
                                        children: [
                                          _buildDataCell(item.product.name,
                                              TextAlign.left),
                                          _buildDataCell('${item.quantity}',
                                              TextAlign.center),
                                          _buildDataCell(
                                              '₹${item.product.price.toStringAsFixed(2)}',
                                              TextAlign.right),
                                          _buildDataCell(
                                              '₹${item.total.toStringAsFixed(2)}',
                                              TextAlign.right,
                                              isBold: true),
                                        ],
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Payment Method
                            _buildSectionTitle('Payment Method'),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildPaymentChip(
                                      'Cash', Icons.money, 'cash'),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildPaymentChip(
                                      'Card', Icons.credit_card, 'card'),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildPaymentChip(
                                      'UPI', Icons.qr_code, 'upi'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Amount Received (for cash)
                            if (_paymentMethod == 'cash') ...[
                              _buildSectionTitle('Amount Received'),
                              TextFormField(
                                controller: _amountReceivedController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  prefixText: '₹ ',
                                  hintText: 'Enter amount',
                                ),
                                onChanged: (_) => _calculateChange(),
                              ),
                              if (_amountReceived > 0) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Change: ₹${_changeAmount.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: _changeAmount >= 0
                                        ? Colors.green
                                        : Colors.red,
                                  ),
                                ),
                              ],
                            ],

                            const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ),

                    // Bottom Summary Bar
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, -4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildSummaryRow('Subtotal', billingState.subtotal),
                          if (billingState.discountAmount > 0)
                            _buildSummaryRow(
                                'Discount', -billingState.discountAmount,
                                isDiscount: true),
                          _buildSummaryRow(
                              'Tax (${_taxRate.toStringAsFixed(1)}%)',
                              billingState.taxAmount),
                          const Divider(),
                          _buildSummaryRow('TOTAL', billingState.totalAmount,
                              isTotal: true),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _generatePdfAndShare,
                                  icon: const Icon(Icons.share),
                                  label: const Text('Share PDF'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    final billingState =
                                        context.read<BillingBloc>().state;
                                    context
                                        .read<BillingBloc>()
                                        .add(ConfirmOrderEvent(
                                          paymentMethod: _paymentMethod,
                                          amountReceived: _amountReceived,
                                          changeAmount: _changeAmount.clamp(
                                              0, double.infinity),
                                          customerId: billingState.customerId,
                                          customerName:
                                              billingState.customerName,
                                          customerPhone:
                                              billingState.customerPhone,
                                        ));
                                    context
                                        .read<SalesHistoryBloc>()
                                        .add(const LoadAllTransactionsEvent());
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                            'Order confirmed successfully!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                    context
                                        .read<BillingBloc>()
                                        .add(ClearCartEvent());
                                    context.go('/');
                                  },
                                  icon: const Icon(Icons.check_circle),
                                  label: const Text('Confirm Order'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              });
            },
          ),
        ));
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
      ),
    );
  }

  Widget _buildPaymentChip(String label, IconData icon, String value) {
    final isSelected = _paymentMethod == value;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).primaryColor.withValues(alpha: 0.1)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color:
                isSelected ? Theme.of(context).primaryColor : Colors.grey[300]!,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 18,
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Colors.grey[600]),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                  color: isSelected
                      ? Theme.of(context).primaryColor
                      : Colors.grey[600],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, double amount,
      {bool isTotal = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '${isDiscount ? '-' : ''}₹${amount.abs().toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: isTotal ? 20 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              color: isDiscount
                  ? Colors.red
                  : (isTotal ? Theme.of(context).primaryColor : Colors.black),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(String text, TextAlign align) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text.toUpperCase(),
        textAlign: align,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
          color: Colors.grey,
        ),
      ),
    );
  }

  Widget _buildDataCell(String text, TextAlign align, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        textAlign: align,
        style: TextStyle(
          fontSize: 13,
          fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    );
  }
}
