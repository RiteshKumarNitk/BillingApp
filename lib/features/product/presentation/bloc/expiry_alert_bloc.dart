import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/expiry_alert.dart';
import '../../domain/usecases/get_expiring_alerts_usecase.dart';
import '../../../../core/error/failure.dart';

part 'expiry_event.dart';
part 'expiry_state.dart';

class ExpiryAlertBloc extends Bloc<ExpiryEvent, ExpiryState> {
  final GetExpiringAlertsUseCase getExpiringAlertsUseCase;

  ExpiryAlertBloc({
    required this.getExpiringAlertsUseCase,
  }) : super(const ExpiryState()) {
    on<LoadExpiringAlerts>(_onLoadExpiringAlerts);
    on<ResetExpiryState>(_onResetExpiryState);
  }

  Future<void> _onLoadExpiringAlerts(
    LoadExpiringAlerts event,
    Emitter<ExpiryState> emit,
  ) async {
    emit(state.copyWith(status: ExpiryStatus.loading));
    
    final result = await getExpiringAlertsUseCase(event.daysThreshold);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: ExpiryStatus.error,
          errorMessage: failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (alerts) => emit(
        state.copyWith(
          status: ExpiryStatus.success,
          alerts: alerts,
        ),
      ),
    );
  }

  Future<void> _onResetExpiryState(
    ResetExpiryState event,
    Emitter<ExpiryState> emit,
  ) async {
    emit(const ExpiryState());
  }
}
