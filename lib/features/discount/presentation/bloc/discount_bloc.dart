import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/discount.dart';
import '../../domain/usecases/get_today_discounts_usecase.dart';
import '../../domain/usecases/save_discount_usecase.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../../core/error/failure.dart';

part 'discount_event.dart';
part 'discount_state.dart';

class DiscountBloc extends Bloc<DiscountEvent, DiscountState> {
  final GetTodayDiscountsUseCase getTodayDiscountsUseCase;
  final SaveDiscountUseCase saveDiscountUseCase;

  DiscountBloc({
    required this.getTodayDiscountsUseCase,
    required this.saveDiscountUseCase,
  }) : super(const DiscountState()) {
    on<LoadTodayDiscounts>(_onLoadTodayDiscounts);
    on<SaveDiscount>(_onSaveDiscount);
    on<ResetDiscountState>(_onResetDiscountState);
  }

  Future<void> _onLoadTodayDiscounts(
    LoadTodayDiscounts event,
    Emitter<DiscountState> emit,
  ) async {
    emit(state.copyWith(status: DiscountStatus.loading));

    final result = await getTodayDiscountsUseCase(NoParams());
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: DiscountStatus.error,
          errorMessage:
              failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (discounts) => emit(
        state.copyWith(
          status: DiscountStatus.success,
          discounts: discounts,
        ),
      ),
    );
  }

  Future<void> _onResetDiscountState(
    ResetDiscountState event,
    Emitter<DiscountState> emit,
  ) async {
    emit(const DiscountState());
  }

  Future<void> _onSaveDiscount(
    SaveDiscount event,
    Emitter<DiscountState> emit,
  ) async {
    emit(state.copyWith(status: DiscountStatus.saving));

    final result = await saveDiscountUseCase(event.discount);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: DiscountStatus.error,
          errorMessage:
              failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (_) => emit(
        state.copyWith(
          status: DiscountStatus.success,
          successMessage: 'Discount saved successfully',
        ),
      ),
    );
  }
}
