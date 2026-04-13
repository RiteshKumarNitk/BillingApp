part of 'sales_history_bloc.dart';

class SalesHistoryState extends Equatable {
  final List<Transaction> transactions;
  final bool isLoading;
  final String? error;
  final double totalSales;
  final int totalTransactions;
  final bool? isRefunding;
  final bool? refundSuccess;

  const SalesHistoryState({
    this.transactions = const [],
    this.isLoading = false,
    this.error,
    this.totalSales = 0,
    this.totalTransactions = 0,
    this.isRefunding = false,
    this.refundSuccess,
  });

  SalesHistoryState copyWith({
    List<Transaction>? transactions,
    bool? isLoading,
    String? error,
    bool clearError = false,
    double? totalSales,
    int? totalTransactions,
    bool? isRefunding,
    bool? refundSuccess,
  }) {
    return SalesHistoryState(
      transactions: transactions ?? this.transactions,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      totalSales: totalSales ?? this.totalSales,
      totalTransactions: totalTransactions ?? this.totalTransactions,
      isRefunding: isRefunding ?? this.isRefunding,
      refundSuccess: refundSuccess ?? this.refundSuccess,
    );
  }

  @override
  List<Object?> get props => [
        transactions,
        isLoading,
        error,
        totalSales,
        totalTransactions,
        isRefunding,
        refundSuccess
      ];
}
