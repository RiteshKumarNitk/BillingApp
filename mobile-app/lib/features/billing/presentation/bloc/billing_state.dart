part of 'billing_bloc.dart';

enum ErrorType {
  none,
  productNotFound,
  printerNotConnected,
  printFailed,
  invalidTaxRate,
  emptyCart,
}

class BillingState extends Equatable {
  final List<CartItem> cartItems;
  final ErrorType errorType;
  final String? errorMessage;
  final bool isPrinting;
  final bool printSuccess;
  final double taxRate;
  final String? appliedDiscountId;
  final String? appliedDiscountName;
  final double discountAmount;
  final String? customerId;
  final String? customerName;
  final String? customerPhone;

  const BillingState({
    this.cartItems = const [],
    this.errorType = ErrorType.none,
    this.errorMessage,
    this.isPrinting = false,
    this.printSuccess = false,
    this.taxRate = 0.0,
    this.appliedDiscountId,
    this.appliedDiscountName,
    this.discountAmount = 0.0,
    this.customerId,
    this.customerName,
    this.customerPhone,
  });

  double get subtotal => cartItems.fold(0, (sum, item) => sum + item.total);

  double get taxAmount => (subtotal - discountAmount) * (taxRate / 100);

  double get totalAmount => subtotal - discountAmount + taxAmount;

  bool get hasError => errorType != ErrorType.none;

  BillingState copyWith({
    List<CartItem>? cartItems,
    ErrorType? errorType,
    String? errorMessage,
    bool clearError = false,
    bool? isPrinting,
    bool? printSuccess,
    double? taxRate,
    String? appliedDiscountId,
    String? appliedDiscountName,
    double? discountAmount,
    bool clearDiscount = false,
    String? customerId,
    String? customerName,
    String? customerPhone,
    bool clearCustomer = false,
  }) {
    return BillingState(
      cartItems: cartItems ?? this.cartItems,
      errorType: clearError ? ErrorType.none : (errorType ?? this.errorType),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isPrinting: isPrinting ?? this.isPrinting,
      printSuccess: printSuccess ?? this.printSuccess,
      taxRate: taxRate ?? this.taxRate,
      appliedDiscountId:
          clearDiscount ? null : (appliedDiscountId ?? this.appliedDiscountId),
      appliedDiscountName: clearDiscount
          ? null
          : (appliedDiscountName ?? this.appliedDiscountName),
      discountAmount:
          clearDiscount ? 0.0 : (discountAmount ?? this.discountAmount),
      customerId: clearCustomer ? null : (customerId ?? this.customerId),
      customerName: clearCustomer ? null : (customerName ?? this.customerName),
      customerPhone:
          clearCustomer ? null : (customerPhone ?? this.customerPhone),
    );
  }

  @override
  List<Object?> get props => [
        cartItems,
        errorType,
        errorMessage,
        isPrinting,
        printSuccess,
        taxRate,
        appliedDiscountId,
        appliedDiscountName,
        discountAmount,
        customerId,
        customerName,
        customerPhone,
      ];
}
