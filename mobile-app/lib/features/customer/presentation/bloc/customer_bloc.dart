import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/customer.dart';
import '../../domain/usecases/get_all_customers_usecase.dart';
import '../../domain/usecases/search_customers_usecase.dart';
import '../../domain/usecases/save_customer_usecase.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../../core/error/failure.dart';

part 'customer_event.dart';
part 'customer_state.dart';

class CustomerBloc extends Bloc<CustomerEvent, CustomerState> {
  final GetAllCustomersUseCase getAllCustomersUseCase;
  final SearchCustomersUseCase searchCustomersUseCase;
  final SaveCustomerUseCase saveCustomerUseCase;

  CustomerBloc({
    required this.getAllCustomersUseCase,
    required this.searchCustomersUseCase,
    required this.saveCustomerUseCase,
  }) : super(const CustomerState()) {
    on<LoadAllCustomers>(_onLoadAllCustomers);
    on<SearchCustomers>(_onSearchCustomers);
    on<SaveCustomer>(_onSaveCustomer);
    on<ResetCustomerState>(_onResetCustomerState);
  }

  Future<void> _onLoadAllCustomers(
    LoadAllCustomers event,
    Emitter<CustomerState> emit,
  ) async {
    emit(state.copyWith(status: CustomerStatus.loading));
    
    final result = await getAllCustomersUseCase(NoParams());
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: CustomerStatus.error,
          errorMessage: failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (customers) => emit(
        state.copyWith(
          status: CustomerStatus.success,
          customers: customers,
        ),
      ),
    );
  }

  Future<void> _onSearchCustomers(
    SearchCustomers event,
    Emitter<CustomerState> emit,
  ) async {
    emit(state.copyWith(status: CustomerStatus.loading));
    
    final result = await searchCustomersUseCase(event.query);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: CustomerStatus.error,
          errorMessage: failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (customers) => emit(
        state.copyWith(
          status: CustomerStatus.success,
          customers: customers,
          searchQuery: event.query,
        ),
      ),
    );
  }

  Future<void> _onSaveCustomer(
    SaveCustomer event,
    Emitter<CustomerState> emit,
  ) async {
    emit(state.copyWith(status: CustomerStatus.saving));
    
    final result = await saveCustomerUseCase(event.customer);
    result.fold(
      (failure) => emit(
        state.copyWith(
          status: CustomerStatus.error,
          errorMessage: failure is CacheFailure ? failure.message : 'Unknown error',
        ),
      ),
      (_) => emit(
        state.copyWith(
          status: CustomerStatus.success,
          successMessage: 'Customer saved successfully',
        ),
      ),
    );
  }

  Future<void> _onResetCustomerState(
    ResetCustomerState event,
    Emitter<CustomerState> emit,
  ) async {
    emit(const CustomerState());
  }
}
