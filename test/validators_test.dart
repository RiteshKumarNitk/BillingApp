import 'package:flutter_test/flutter_test.dart';
import 'package:billing_app/core/utils/app_validators.dart';

void main() {
  group('AppValidators', () {
    group('required validator', () {
      test('returns error message when value is null', () {
        final validator = AppValidators.required('This field is required');
        expect(validator(null), 'This field is required');
      });

      test('returns error message when value is empty', () {
        final validator = AppValidators.required('This field is required');
        expect(validator(''), 'This field is required');
      });

      test('returns null when value is provided', () {
        final validator = AppValidators.required('This field is required');
        expect(validator('Some value'), null);
      });
    });

    group('price validator', () {
      test('returns error when price is empty', () {
        expect(AppValidators.price(null), 'Please enter a price');
        expect(AppValidators.price(''), 'Please enter a price');
      });

      test('returns error when price is not a number', () {
        expect(AppValidators.price('abc'), 'Please enter a valid number');
      });

      test('returns error when price is negative', () {
        expect(AppValidators.price('-10'), 'Price cannot be negative');
      });

      test('returns null when price is valid', () {
        expect(AppValidators.price('99.99'), null);
        expect(AppValidators.price('0'), null);
      });
    });

    group('productName validator', () {
      test('returns error when name is empty', () {
        expect(AppValidators.productName(null), 'Product name is required');
      });

      test('returns error when name is less than 2 characters', () {
        expect(AppValidators.productName('a'), contains('at least 2 characters'));
      });

      test('returns error when name exceeds 100 characters', () {
        final longName = 'a' * 101;
        expect(AppValidators.productName(longName), contains('cannot exceed 100 characters'));
      });

      test('returns null when name is valid', () {
        expect(AppValidators.productName('Product Name'), null);
      });
    });

    group('barcode validator', () {
      test('returns error when barcode is empty', () {
        expect(AppValidators.barcode(null), 'Barcode is required');
      });

      test('returns error when barcode is less than 4 characters', () {
        expect(AppValidators.barcode('abc'), contains('at least 4 characters'));
      });

      test('returns null when barcode is valid', () {
        expect(AppValidators.barcode('12345'), null);
      });
    });

    group('stock validator', () {
      test('returns error when stock is empty', () {
        expect(AppValidators.stock(null), 'Stock is required');
      });

      test('returns error when stock is not a number', () {
        expect(AppValidators.stock('abc'), 'Please enter a valid number');
      });

      test('returns error when stock is negative', () {
        expect(AppValidators.stock('-5'), 'Stock cannot be negative');
      });

      test('returns null when stock is valid', () {
        expect(AppValidators.stock('100'), null);
      });
    });

    group('quantity validator', () {
      test('returns error when quantity is empty', () {
        expect(AppValidators.quantity(null), 'Quantity is required');
      });

      test('returns error when quantity is zero or negative', () {
        expect(AppValidators.quantity('0'), contains('greater than 0'));
        expect(AppValidators.quantity('-1'), contains('greater than 0'));
      });

      test('returns null when quantity is valid', () {
        expect(AppValidators.quantity('5'), null);
      });
    });

    group('taxRate validator', () {
      test('returns error when tax rate is empty', () {
        expect(AppValidators.taxRate(null), 'Tax rate is required');
      });

      test('returns error when tax rate is not between 0 and 100', () {
        expect(AppValidators.taxRate('-1'), contains('between 0 and 100'));
        expect(AppValidators.taxRate('101'), contains('between 0 and 100'));
      });

      test('returns null when tax rate is valid', () {
        expect(AppValidators.taxRate('18'), null);
        expect(AppValidators.taxRate('0'), null);
        expect(AppValidators.taxRate('100'), null);
      });
    });

    group('discountPercentage validator', () {
      test('returns error when discount is empty', () {
        expect(AppValidators.discountPercentage(null), 'Discount percentage is required');
      });

      test('returns error when discount is not between 0 and 100', () {
        expect(AppValidators.discountPercentage('-1'), contains('between 0 and 100%'));
        expect(AppValidators.discountPercentage('101'), contains('between 0 and 100%'));
      });

      test('returns null when discount is valid', () {
        expect(AppValidators.discountPercentage('10'), null);
      });
    });
  });
}
