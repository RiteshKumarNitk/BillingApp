part of 'billing_bloc.dart';

abstract class BillingEvent extends Equatable {
  const BillingEvent();
  @override
  List<Object?> get props => [];
}

class ScanBarcodeEvent extends BillingEvent {
  final String barcode;
  const ScanBarcodeEvent(this.barcode);
  @override
  List<Object> get props => [barcode];
}

class AddProductToCartEvent extends BillingEvent {
  final Product product;
  const AddProductToCartEvent(this.product);
  @override
  List<Object> get props => [product];
}

class RemoveProductFromCartEvent extends BillingEvent {
  final String productId;
  const RemoveProductFromCartEvent(this.productId);
  @override
  List<Object> get props => [productId];
}

class UpdateQuantityEvent extends BillingEvent {
  final String productId;
  final int quantity;
  const UpdateQuantityEvent(this.productId, this.quantity);
  @override
  List<Object> get props => [productId, quantity];
}

class ClearCartEvent extends BillingEvent {}

class SetTaxRateEvent extends BillingEvent {
  final double taxRate;
  const SetTaxRateEvent(this.taxRate);
  @override
  List<Object> get props => [taxRate];
}

class PrintReceiptEvent extends BillingEvent {
  final String shopName;
  final String address1;
  final String address2;
  final String phone;
  final String footer;
  final double? taxRate;

  const PrintReceiptEvent({
    required this.shopName,
    required this.address1,
    required this.address2,
    required this.phone,
    required this.footer,
    this.taxRate,
  });

  @override
  List<Object?> get props =>
      [shopName, address1, address2, phone, footer, taxRate];
}

class ApplyDiscountEvent extends BillingEvent {
  final String discountId;
  final String discountName;
  final double discountPercentage;
  const ApplyDiscountEvent({
    required this.discountId,
    required this.discountName,
    required this.discountPercentage,
  });
  @override
  List<Object> get props => [discountId, discountName, discountPercentage];
}

class RemoveDiscountEvent extends BillingEvent {}

class SetCustomerEvent extends BillingEvent {
  final String customerId;
  final String customerName;
  final String customerPhone;
  const SetCustomerEvent({
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
  });
  @override
  List<Object> get props => [customerId, customerName, customerPhone];
}

class ConfirmOrderEvent extends BillingEvent {
  final String paymentMethod;
  final double amountReceived;
  final double changeAmount;
  final String? customerId;
  final String? customerName;
  final String? customerPhone;

  const ConfirmOrderEvent({
    required this.paymentMethod,
    required this.amountReceived,
    required this.changeAmount,
    this.customerId,
    this.customerName,
    this.customerPhone,
  });

  @override
  List<Object?> get props => [
        paymentMethod,
        amountReceived,
        changeAmount,
        customerId,
        customerName,
        customerPhone
      ];
}
