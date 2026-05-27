import 'package:flutter_test/flutter_test.dart';
import 'package:billing_app/features/billing/domain/entities/transaction.dart';

void main() {
  group('TransactionItem', () {
    test('creates TransactionItem with correct values', () {
      final item = TransactionItem(
        productId: '1',
        productName: 'Test Product',
        price: 100.0,
        quantity: 2,
        total: 200.0,
      );

      expect(item.productId, '1');
      expect(item.productName, 'Test Product');
      expect(item.price, 100.0);
      expect(item.quantity, 2);
      expect(item.total, 200.0);
    });

    test('TransactionItem equals works correctly', () {
      final item1 = TransactionItem(
        productId: '1',
        productName: 'Product',
        price: 100.0,
        quantity: 2,
        total: 200.0,
      );

      final item2 = TransactionItem(
        productId: '1',
        productName: 'Product',
        price: 100.0,
        quantity: 2,
        total: 200.0,
      );

      expect(item1, item2);
    });
  });

  group('Transaction', () {
    test('creates Transaction with correct values', () {
      final items = [
        TransactionItem(
          productId: '1',
          productName: 'Product 1',
          price: 50.0,
          quantity: 2,
          total: 100.0,
        ),
      ];

      final transaction = Transaction(
        id: 'tx-001',
        timestamp: DateTime(2024, 1, 1),
        items: items,
        subtotal: 100.0,
        taxAmount: 18.0,
        totalAmount: 118.0,
        paymentMethod: 'cash',
      );

      expect(transaction.id, 'tx-001');
      expect(transaction.items.length, 1);
      expect(transaction.subtotal, 100.0);
      expect(transaction.taxAmount, 18.0);
      expect(transaction.totalAmount, 118.0);
      expect(transaction.isRefunded, false);
    });

    test('Transaction with refund details', () {
      final transaction = Transaction(
        id: 'tx-002',
        timestamp: DateTime(2024, 1, 1),
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        paymentMethod: 'upi',
        isRefunded: true,
        refundId: 'refund-001',
      );

      expect(transaction.isRefunded, true);
      expect(transaction.refundId, 'refund-001');
    });

    test('Transaction equals works correctly', () {
      final transaction1 = Transaction(
        id: 'tx-001',
        timestamp: DateTime(2024, 1, 1),
        items: [],
        subtotal: 100.0,
        taxAmount: 18.0,
        totalAmount: 118.0,
        paymentMethod: 'cash',
      );

      final transaction2 = Transaction(
        id: 'tx-001',
        timestamp: DateTime(2024, 1, 1),
        items: [],
        subtotal: 100.0,
        taxAmount: 18.0,
        totalAmount: 118.0,
        paymentMethod: 'cash',
      );

      expect(transaction1, transaction2);
    });
  });
}
