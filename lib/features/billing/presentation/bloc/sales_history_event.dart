part of 'sales_history_bloc.dart';

abstract class SalesHistoryEvent extends Equatable {
  const SalesHistoryEvent();

  @override
  List<Object?> get props => [];
}

class LoadAllTransactionsEvent extends SalesHistoryEvent {
  const LoadAllTransactionsEvent();
}

class LoadTransactionsByDateEvent extends SalesHistoryEvent {
  final DateTime date;
  const LoadTransactionsByDateEvent(this.date);

  @override
  List<Object> get props => [date];
}

class RefundTransactionEvent extends SalesHistoryEvent {
  final String transactionId;
  const RefundTransactionEvent(this.transactionId);

  @override
  List<Object> get props => [transactionId];
}

class ReprintReceiptEvent extends SalesHistoryEvent {
  final String transactionId;
  final String shopName;
  final String address1;
  final String address2;
  final String phone;
  const ReprintReceiptEvent({
    required this.transactionId,
    required this.shopName,
    required this.address1,
    required this.address2,
    required this.phone,
  });

  @override
  List<Object> get props =>
      [transactionId, shopName, address1, address2, phone];
}
