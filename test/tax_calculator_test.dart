import 'package:flutter_test/flutter_test.dart';
import 'package:billing_app/core/utils/tax_calculator.dart';

void main() {
  group('TaxCalculator', () {
    group('calculateTax', () {
      test('calculates tax with default rate', () {
        final tax = TaxCalculator.calculateTax(100);
        expect(tax, 18.0); // 18% of 100
      });

      test('calculates tax with custom rate', () {
        final tax = TaxCalculator.calculateTax(100, taxRate: 5);
        expect(tax, 5.0); // 5% of 100
      });

      test('calculates tax with zero subtotal', () {
        final tax = TaxCalculator.calculateTax(0);
        expect(tax, 0);
      });

      test('calculates tax with decimal subtotal', () {
        final tax = TaxCalculator.calculateTax(99.99, taxRate: 18);
        expect(tax, closeTo(17.9982, 0.0001));
      });
    });

    group('calculateTotal', () {
      test('calculates total including tax', () {
        final total = TaxCalculator.calculateTotal(100);
        expect(total, 118.0); // 100 + 18% tax
      });

      test('calculates total with custom tax rate', () {
        final total = TaxCalculator.calculateTotal(100, taxRate: 5);
        expect(total, 105.0); // 100 + 5% tax
      });

      test('calculates total with zero subtotal', () {
        final total = TaxCalculator.calculateTotal(0);
        expect(total, 0);
      });

      test('calculates total with decimal amounts', () {
        final total = TaxCalculator.calculateTotal(99.99, taxRate: 18);
        expect(total, closeTo(117.9882, 0.0001));
      });
    });

    group('isValidTaxRate', () {
      test('validates positive tax rates', () {
        expect(TaxCalculator.isValidTaxRate(0), true);
        expect(TaxCalculator.isValidTaxRate(18), true);
        expect(TaxCalculator.isValidTaxRate(100), true);
      });

      test('rejects negative tax rates', () {
        expect(TaxCalculator.isValidTaxRate(-1), false);
      });

      test('rejects rates above 100', () {
        expect(TaxCalculator.isValidTaxRate(101), false);
      });
    });

    group('formatTaxDisplay', () {
      test('formats decimal to 2 places', () {
        expect(TaxCalculator.formatTaxDisplay(18.5), '18.50');
        expect(TaxCalculator.formatTaxDisplay(18.123), '18.12');
        expect(TaxCalculator.formatTaxDisplay(18), '18.00');
      });
    });
  });
}
