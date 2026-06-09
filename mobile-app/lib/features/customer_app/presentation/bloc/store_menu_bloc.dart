import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/store_menu_model.dart';

abstract class StoreMenuEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class LoadStoreMenu extends StoreMenuEvent {
  final String tenantId;
  LoadStoreMenu({required this.tenantId});
  @override
  List<Object?> get props => [tenantId];
}

class SubmitOrder extends StoreMenuEvent {
  final String tenantId;
  final List<Map<String, dynamic>> items;
  SubmitOrder({required this.tenantId, required this.items});
  @override
  List<Object?> get props => [tenantId, items];
}

abstract class StoreMenuState extends Equatable {
  @override
  List<Object?> get props => [];
}

class StoreMenuInitial extends StoreMenuState {}
class StoreMenuLoading extends StoreMenuState {}
class StoreMenuLoaded extends StoreMenuState {
  final StoreMenuData data;
  StoreMenuLoaded({required this.data});
  @override
  List<Object?> get props => [data];
}
class StoreMenuError extends StoreMenuState {
  final String message;
  StoreMenuError({required this.message});
  @override
  List<Object?> get props => [message];
}
class OrderSubmitting extends StoreMenuState {
  final StoreMenuData data;
  OrderSubmitting({required this.data});
  @override
  List<Object?> get props => [data];
}
class OrderSuccess extends StoreMenuState {
  final StoreMenuData data;
  OrderSuccess({required this.data});
  @override
  List<Object?> get props => [data];
}

class StoreMenuBloc extends Bloc<StoreMenuEvent, StoreMenuState> {
  final ApiClient _apiClient;

  StoreMenuBloc({required ApiClient apiClient})
      : _apiClient = apiClient,
        super(StoreMenuInitial()) {
    on<LoadStoreMenu>(_onLoad);
    on<SubmitOrder>(_onSubmitOrder);
  }

  Future<void> _onLoad(LoadStoreMenu event, Emitter<StoreMenuState> emit) async {
    emit(StoreMenuLoading());
    try {
      final response = await _apiClient.getStoreMenu(event.tenantId);
      emit(StoreMenuLoaded(data: StoreMenuData.fromJson(response)));
    } catch (e) {
      emit(StoreMenuError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitOrder(SubmitOrder event, Emitter<StoreMenuState> emit) async {
    final currentData = state is StoreMenuLoaded ? (state as StoreMenuLoaded).data : null;
    if (currentData != null) emit(OrderSubmitting(data: currentData));
    try {
      await _apiClient.submitCustomerOrder({
        'tenantId': event.tenantId,
        'items': event.items,
      });
      if (currentData != null) emit(OrderSuccess(data: currentData));
    } catch (e) {
      emit(StoreMenuError(message: e.toString().replaceAll('Exception: ', '')));
    }
  }
}
