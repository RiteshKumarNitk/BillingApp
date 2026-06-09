import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/customer_store_model.dart';

abstract class CustomerStoresEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadCustomerStores extends CustomerStoresEvent {}

abstract class CustomerStoresState extends Equatable {
  @override
  List<Object?> get props => [];
}

class CustomerStoresInitial extends CustomerStoresState {}
class CustomerStoresLoading extends CustomerStoresState {}
class CustomerStoresLoaded extends CustomerStoresState {
  final List<CustomerStore> stores;
  CustomerStoresLoaded({required this.stores});
  @override
  List<Object?> get props => [stores];
}
class CustomerStoresError extends CustomerStoresState {
  final String message;
  CustomerStoresError({required this.message});
  @override
  List<Object?> get props => [message];
}

class CustomerStoresBloc extends Bloc<CustomerStoresEvent, CustomerStoresState> {
  final ApiClient _apiClient;

  CustomerStoresBloc({required ApiClient apiClient}) : _apiClient = apiClient, super(CustomerStoresInitial()) {
    on<LoadCustomerStores>(_onLoad);
  }

  Future<void> _onLoad(LoadCustomerStores event, Emitter<CustomerStoresState> emit) async {
    emit(CustomerStoresLoading());
    try {
      final response = await _apiClient.getCustomerStores();
      final stores = (response['stores'] as List<dynamic>? ?? [])
          .map((e) => CustomerStore.fromJson(e))
          .toList();
      emit(CustomerStoresLoaded(stores: stores));
    } catch (e) {
      emit(CustomerStoresError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }
}
