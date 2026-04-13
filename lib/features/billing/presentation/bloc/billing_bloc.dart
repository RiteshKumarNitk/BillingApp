import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:uuid/uuid.dart';
import '../../domain/entities/cart_item.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/usecases/transaction_usecases.dart';
import 'package:billing_app/features/product/domain/entities/product.dart';
import 'package:billing_app/features/product/domain/usecases/product_usecases.dart';
import 'package:billing_app/features/product/data/models/product_model.dart';
import '../../../../core/utils/printer_helper.dart';
import '../../../../core/data/hive_database.dart';

part 'billing_event.dart';
part 'billing_state.dart';

class BillingBloc extends Bloc<BillingEvent, BillingState> {
  final GetProductByBarcodeUseCase getProductByBarcodeUseCase;
  final SaveTransactionUseCase saveTransactionUseCase;

  BillingBloc({
    required this.getProductByBarcodeUseCase,
    required this.saveTransactionUseCase,
  }) : super(const BillingState()) {
    on<ScanBarcodeEvent>(_onScanBarcode);
    on<AddProductToCartEvent>(_onAddProductToCart);
    on<RemoveProductFromCartEvent>(_onRemoveProductFromCart);
    on<UpdateQuantityEvent>(_onUpdateQuantity);
    on<ClearCartEvent>(_onClearCart);
    on<SetTaxRateEvent>(_onSetTaxRate);
    on<PrintReceiptEvent>(_onPrintReceipt);
    on<ApplyDiscountEvent>(_onApplyDiscount);
    on<RemoveDiscountEvent>(_onRemoveDiscount);
    on<SetCustomerEvent>(_onSetCustomer);
    on<ConfirmOrderEvent>(_onConfirmOrder);
  }

  Future<void> _onScanBarcode(
      ScanBarcodeEvent event, Emitter<BillingState> emit) async {
    final result = await getProductByBarcodeUseCase(event.barcode);
    result.fold(
      (failure) => emit(state.copyWith(
        errorType: ErrorType.productNotFound,
        errorMessage: 'Product not found: ${event.barcode}',
      )),
      (product) {
        add(AddProductToCartEvent(product));
      },
    );
  }

  void _onAddProductToCart(
      AddProductToCartEvent event, Emitter<BillingState> emit) {
    // Clear error when adding
    final cleanState = state.copyWith(errorType: ErrorType.none);

    final existingIndex = cleanState.cartItems
        .indexWhere((item) => item.product.id == event.product.id);
    if (existingIndex >= 0) {
      final existingItem = cleanState.cartItems[existingIndex];
      final backendItems = List<CartItem>.from(cleanState.cartItems);
      backendItems[existingIndex] =
          existingItem.copyWith(quantity: existingItem.quantity + 1);
      emit(cleanState.copyWith(cartItems: backendItems));
    } else {
      final newItem = CartItem(product: event.product);
      emit(cleanState.copyWith(cartItems: [...cleanState.cartItems, newItem]));
    }
  }

  void _onRemoveProductFromCart(
      RemoveProductFromCartEvent event, Emitter<BillingState> emit) {
    final updatedList = state.cartItems
        .where((item) => item.product.id != event.productId)
        .toList();
    emit(state.copyWith(cartItems: updatedList));
  }

  void _onUpdateQuantity(
      UpdateQuantityEvent event, Emitter<BillingState> emit) {
    if (event.quantity <= 0) {
      add(RemoveProductFromCartEvent(event.productId));
      return;
    }

    final index = state.cartItems
        .indexWhere((item) => item.product.id == event.productId);
    if (index >= 0) {
      final items = List<CartItem>.from(state.cartItems);
      items[index] = items[index].copyWith(quantity: event.quantity);
      emit(state.copyWith(cartItems: items));
    }
  }

  void _onClearCart(ClearCartEvent event, Emitter<BillingState> emit) {
    emit(const BillingState());
  }

  void _onSetTaxRate(SetTaxRateEvent event, Emitter<BillingState> emit) {
    if (event.taxRate < 0 || event.taxRate > 100) {
      emit(state.copyWith(
        errorType: ErrorType.invalidTaxRate,
        errorMessage: 'Tax rate must be between 0 and 100',
      ));
      return;
    }
    emit(state.copyWith(taxRate: event.taxRate, errorType: ErrorType.none));
  }

  Future<void> _onPrintReceipt(
      PrintReceiptEvent event, Emitter<BillingState> emit) async {
    final printerHelper = PrinterHelper();

    if (!printerHelper.isConnected) {
      final savedMac = HiveDatabase.settingsBox.get('printer_mac');
      if (savedMac != null) {
        final connected = await printerHelper.connect(savedMac);
        if (!connected) {
          emit(state.copyWith(
            errorType: ErrorType.printerNotConnected,
            errorMessage: 'Failed to auto-connect to printer!',
          ));
          return;
        }
      } else {
        emit(state.copyWith(
          errorType: ErrorType.printerNotConnected,
          errorMessage: 'Printer not connected & no saved printer found!',
        ));
        return;
      }
    }

    emit(state.copyWith(
        isPrinting: true, printSuccess: false, errorType: ErrorType.none));

    try {
      final items = state.cartItems
          .map((item) => {
                'name': item.product.name,
                'qty': item.quantity,
                'price': item.product.price,
                'total': item.total,
              })
          .toList();

      await printerHelper.printReceipt(
          shopName: event.shopName,
          address1: event.address1,
          address2: event.address2,
          phone: event.phone,
          items: items,
          total: state.totalAmount,
          footer: event.footer);

      // Save transaction after successful print
      await _saveTransaction();

      // Reduce stock for all items
      await _reduceStock();

      emit(state.copyWith(isPrinting: false, printSuccess: true));
    } catch (e) {
      emit(state.copyWith(
        isPrinting: false,
        errorType: ErrorType.printFailed,
        errorMessage: 'Print failed: $e',
      ));
    }
  }

  Future<void> _saveTransaction() async {
    try {
      final transactionItems = state.cartItems.map((item) {
        return TransactionItem(
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.total,
        );
      }).toList();

      final transaction = Transaction(
        id: const Uuid().v4(),
        timestamp: DateTime.now(),
        items: transactionItems,
        subtotal: state.subtotal,
        taxAmount: state.taxAmount,
        totalAmount: state.totalAmount,
        paymentMethod: 'cash', // Default to cash, can be enhanced
      );

      await saveTransactionUseCase(transaction);
    } catch (e) {
      print('Error saving transaction: $e');
    }
  }

  Future<void> _reduceStock() async {
    try {
      for (var item in state.cartItems) {
        final product = HiveDatabase.productBox.get(item.product.id);
        if (product != null) {
          int newStock = product.stock - item.quantity;
          if (newStock < 0) newStock = 0;

          final updatedProduct = ProductModel(
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            stock: newStock,
          );

          await HiveDatabase.productBox.put(item.product.id, updatedProduct);
        }
      }
    } catch (e) {
      print('Error reducing stock: $e');
    }
  }

  void _onApplyDiscount(ApplyDiscountEvent event, Emitter<BillingState> emit) {
    final discountAmount = state.subtotal * (event.discountPercentage / 100);
    emit(state.copyWith(
      appliedDiscountId: event.discountId,
      appliedDiscountName: event.discountName,
      discountAmount: discountAmount,
    ));
  }

  void _onRemoveDiscount(
      RemoveDiscountEvent event, Emitter<BillingState> emit) {
    emit(state.copyWith(clearDiscount: true));
  }

  void _onSetCustomer(SetCustomerEvent event, Emitter<BillingState> emit) {
    emit(state.copyWith(
      customerId: event.customerId,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
    ));
  }

  Future<void> _onConfirmOrder(
      ConfirmOrderEvent event, Emitter<BillingState> emit) async {
    emit(state.copyWith(isPrinting: true));

    try {
      await _saveTransactionWithPayment(event);
      await _reduceStock();

      emit(state.copyWith(isPrinting: false, printSuccess: true));
    } catch (e) {
      emit(state.copyWith(
        isPrinting: false,
        errorType: ErrorType.printFailed,
        errorMessage: 'Order failed: $e',
      ));
    }
  }

  Future<void> _saveTransactionWithPayment(ConfirmOrderEvent event) async {
    try {
      final transactionItems = state.cartItems.map((item) {
        return TransactionItem(
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.total,
        );
      }).toList();

      final transaction = Transaction(
        id: const Uuid().v4(),
        timestamp: DateTime.now(),
        items: transactionItems,
        subtotal: state.subtotal,
        discountAmount: state.discountAmount,
        taxAmount: state.taxAmount,
        totalAmount: state.totalAmount,
        paymentMethod: event.paymentMethod,
        amountReceived: event.amountReceived,
        changeAmount: event.changeAmount,
        customerId: event.customerId,
        customerName: event.customerName,
        customerPhone: event.customerPhone,
      );

      await saveTransactionUseCase(transaction);
    } catch (e) {
      print('Error saving transaction: $e');
    }
  }
}
