import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _authRepository;
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;

  AuthCubit({
    required AuthRepository authRepository,
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
  })  : _authRepository = authRepository,
        _loginUseCase = loginUseCase,
        _registerUseCase = registerUseCase,
        super(const AuthState());

  /// Called once at splash — a stored token means "was logged in last time"; go-router's redirect
  /// then decides where that actually lands based on this status.
  Future<void> checkAuthStatus() async {
    final hasSession = await _authRepository.hasStoredSession();
    emit(state.copyWith(status: hasSession ? AuthStatus.authenticated : AuthStatus.unauthenticated));
    // Opportunistic sliding-session refresh — extends a long-idle session's token before it ever
    // hits a 401. Fire-and-forget: a failure here just means DioClient's own 401 handling takes
    // over on the next real request, same as if this call never happened.
    if (hasSession) unawaited(_authRepository.refreshSession());
  }

  void continueAsGuest() {
    emit(state.copyWith(status: AuthStatus.guest));
  }

  Future<void> login({required String email, required String password}) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));
    final result = await _loginUseCase(LoginParams(email: email, password: password));
    result.match(
      (failure) => emit(state.copyWith(isSubmitting: false, errorMessage: failure.message)),
      (customer) => emit(state.copyWith(isSubmitting: false, status: AuthStatus.authenticated, customer: customer, clearError: true)),
    );
  }

  Future<void> register({required String name, required String email, required String password, String? phone}) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));
    final result = await _registerUseCase(RegisterParams(name: name, email: email, password: password, phone: phone));
    result.match(
      (failure) => emit(state.copyWith(isSubmitting: false, errorMessage: failure.message)),
      (customer) => emit(state.copyWith(isSubmitting: false, status: AuthStatus.authenticated, customer: customer, clearError: true)),
    );
  }

  Future<void> logout() async {
    await _authRepository.logout();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }
}
