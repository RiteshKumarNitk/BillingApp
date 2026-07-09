import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/discount.dart';
import '../../domain/usecases/get_today_discounts_usecase.dart';
import '../../domain/usecases/save_discount_usecase.dart';
import '../../domain/usecases/update_discount_usecase.dart';
import '../../domain/usecases/delete_discount_usecase.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../../core/error/failure.dart';

part 'discount_event.dart';
part 'discount_state.dart';

class DiscountBloc extends Bloc<DiscountEvent, DiscountState> {
  final GetTodayDiscountsUseCase getTodayDiscountsUseCase;
  final SaveDiscountUseCase saveDiscountUseCase;
  final UpdateDiscountUseCase updateDiscountUseCase;
  final DeleteDiscountUseCase deleteDiscountUseCase;

  DiscountBloc({
    required this.getTodayDiscountsUseCase,
    required this.saveDiscountUseCase,
    required this.updateDiscountUseCase,
    required this.deleteDiscountUseCase,
  }) : super(const DiscountState()) {
    on<LoadTodayDiscounts>(_onLoadTodayDiscounts);
    on<SaveDiscount>(_onSaveDiscount);
    on<UpdateDiscount>(_onUpdateDiscount);
    on<DeleteDiscount>(_onDeleteDiscount);
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

  Future<void> _onUpdateDiscount(
    UpdateDiscount event,
    Emitter<DiscountState> emit,
  ) async {
    emit(state.copyWith(status: DiscountStatus.saving));

    final result = await updateDiscountUseCase(event.discount);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: DiscountStatus.error,
          errorMessage:
              failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (_) {
        add(const LoadTodayDiscounts());
        emit(
          state.copyWith(
            status: DiscountStatus.success,
            successMessage: 'Discount updated successfully',
          ),
        );
      },
    );
  }

  Future<void> _onDeleteDiscount(
    DeleteDiscount event,
    Emitter<DiscountState> emit,
  ) async {
    emit(state.copyWith(status: DiscountStatus.saving));

    final result = await deleteDiscountUseCase(event.discountId);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: DiscountStatus.error,
          errorMessage:
              failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (_) {
        add(const LoadTodayDiscounts());
        emit(
          state.copyWith(
            status: DiscountStatus.success,
            successMessage: 'Discount deleted successfully',
          ),
        );
      },
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
      (_) {
        add(const LoadTodayDiscounts());
        emit(
          state.copyWith(
            status: DiscountStatus.success,
            successMessage: 'Discount saved successfully',
          ),
        );
      },
    );
  }
}
