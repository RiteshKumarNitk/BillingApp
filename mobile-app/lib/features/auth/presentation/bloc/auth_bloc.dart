import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/api_client.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiClient apiClient;

  AuthBloc({required this.apiClient}) : super(AuthInitial()) {
    on<LoginRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final response = await apiClient.login(event.email, event.password);
        if (response['user'] != null) {
          emit(AuthSuccess(response['user']));
        } else {
          emit(const AuthFailure('Invalid response from server'));
        }
      } catch (e) {
        emit(AuthFailure(e.toString().replaceAll('Exception: ', '')));
      }
    });

    on<LogoutRequested>((event, emit) async {
      await apiClient.logout();
      emit(AuthInitial());
    });
  }
}
