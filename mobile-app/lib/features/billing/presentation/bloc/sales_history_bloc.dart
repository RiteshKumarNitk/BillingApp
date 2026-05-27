import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/usecases/transaction_usecases.dart';
import '../../../../core/utils/printer_helper.dart';
import '../../../../core/data/hive_database.dart';
import '../../../../core/usecase/usecase.dart';

part 'sales_history_event.dart';
part 'sales_history_state.dart';

class SalesHistoryBloc extends Bloc<SalesHistoryEvent, SalesHistoryState> {
  final GetAllTransactionsUseCase getAllTransactionsUseCase;
  final GetTransactionsByDateUseCase getTransactionsByDateUseCase;
  final RefundTransactionUseCase refundTransactionUseCase;
  final GetDailySalesUseCase getDailySalesUseCase;

  SalesHistoryBloc({
    required this.getAllTransactionsUseCase,
    required this.getTransactionsByDateUseCase,
    required this.refundTransactionUseCase,
    required this.getDailySalesUseCase,
  }) : super(const SalesHistoryState()) {
    on<LoadAllTransactionsEvent>(_onLoadAllTransactions);
    on<LoadTransactionsByDateEvent>(_onLoadTransactionsByDate);
    on<RefundTransactionEvent>(_onRefundTransaction);
    on<ReprintReceiptEvent>(_onReprintReceipt);
  }

  Future<void> _onLoadAllTransactions(
    LoadAllTransactionsEvent event,
    Emitter<SalesHistoryState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true));
    final result = await getAllTransactionsUseCase(NoParams());

    result.fold(
      (failure) => emit(state.copyWith(
        isLoading: false,
        error: failure.message,
      )),
      (transactions) {
        final total = transactions
            .where((t) => !t.isRefunded)
            .fold<double>(0, (sum, t) => sum + t.totalAmount);
        emit(state.copyWith(
          isLoading: false,
          transactions: transactions,
          totalSales: total,
          totalTransactions: transactions.length,
        ));
      },
    );
  }

  Future<void> _onLoadTransactionsByDate(
    LoadTransactionsByDateEvent event,
    Emitter<SalesHistoryState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true));
    final result = await getTransactionsByDateUseCase(event.date);

    result.fold(
      (failure) => emit(state.copyWith(
        isLoading: false,
        error: failure.message,
      )),
      (transactions) {
        final total = transactions
            .where((t) => !t.isRefunded)
            .fold<double>(0, (sum, t) => sum + t.totalAmount);
        emit(state.copyWith(
          isLoading: false,
          transactions: transactions,
          totalSales: total,
          totalTransactions: transactions.length,
        ));
      },
    );
  }

  Future<void> _onRefundTransaction(
    RefundTransactionEvent event,
    Emitter<SalesHistoryState> emit,
  ) async {
    emit(state.copyWith(isRefunding: true));

    final result = await refundTransactionUseCase(event.transactionId);

    result.fold(
      (failure) => emit(state.copyWith(
        isRefunding: false,
        error: failure.message,
      )),
      (_) {
        // Reload transactions
        add(LoadAllTransactionsEvent());
        emit(state.copyWith(
          isRefunding: false,
          refundSuccess: true,
        ));
      },
    );
  }

  Future<void> _onReprintReceipt(
    ReprintReceiptEvent event,
    Emitter<SalesHistoryState> emit,
  ) async {
    try {
      final transaction = state.transactions
          .firstWhere((t) => t.id == event.transactionId);

      final printerHelper = PrinterHelper();

      if (!printerHelper.isConnected) {
        final savedMac = HiveDatabase.settingsBox.get('printer_mac');
        if (savedMac != null) {
          await printerHelper.connect(savedMac);
        }
      }

      final items = transaction.items
          .map((item) => {
                'name': item.productName,
                'qty': item.quantity,
                'price': item.price,
                'total': item.total,
              })
          .toList();

      await printerHelper.printReceipt(
        shopName: event.shopName,
        address1: event.address1,
        address2: event.address2,
        phone: event.phone,
        items: items,
        total: transaction.totalAmount,
        footer: 'REPRINT - ${transaction.timestamp}',
      );

      emit(state.copyWith(
        error: 'Receipt reprinted successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        error: 'Failed to reprint receipt: $e',
      ));
    }
  }
}
