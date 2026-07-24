import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/local_storage_service.dart';
import '../storage/secure_storage_service.dart';
import '../theme/theme_mode_controller.dart';
import '../utils/location_service.dart';

import '../../features/authentication/data/datasources/auth_remote_datasource.dart';
import '../../features/authentication/data/repositories/auth_repository_impl.dart';
import '../../features/authentication/domain/repositories/auth_repository.dart';
import '../../features/authentication/domain/usecases/login_usecase.dart';
import '../../features/authentication/domain/usecases/register_usecase.dart';
import '../../features/authentication/domain/usecases/forgot_password_usecase.dart';
import '../../features/authentication/domain/usecases/reset_password_usecase.dart';
import '../../features/authentication/presentation/cubit/auth_cubit.dart';

import '../../features/cafes/data/datasources/cafes_remote_datasource.dart';
import '../../features/cafes/data/repositories/cafes_repository_impl.dart';
import '../../features/cafes/domain/repositories/cafes_repository.dart';
import '../../features/cafes/domain/usecases/get_cafes_usecase.dart';
import '../../features/cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../features/cafes/presentation/cubit/cafes_cubit.dart';

import '../../features/menu/data/datasources/menu_remote_datasource.dart';
import '../../features/menu/data/repositories/menu_repository_impl.dart';
import '../../features/menu/domain/repositories/menu_repository.dart';
import '../../features/menu/domain/usecases/get_menu_usecase.dart';
import '../../features/menu/presentation/cubit/menu_cubit.dart';

import '../../features/cart/presentation/cubit/cart_cubit.dart';

import '../../features/checkout/data/datasources/checkout_remote_datasource.dart';
import '../../features/checkout/data/repositories/checkout_repository_impl.dart';
import '../../features/checkout/domain/repositories/checkout_repository.dart';
import '../../features/checkout/domain/usecases/place_order_usecase.dart';
import '../../features/checkout/presentation/cubit/checkout_cubit.dart';

import '../../features/orders/data/datasources/orders_remote_datasource.dart';
import '../../features/orders/data/repositories/orders_repository_impl.dart';
import '../../features/orders/domain/repositories/orders_repository.dart';
import '../../features/orders/domain/usecases/get_orders_usecase.dart';
import '../../features/orders/domain/usecases/get_order_by_id_usecase.dart';
import '../../features/orders/presentation/cubit/orders_cubit.dart';
import '../../features/orders/presentation/cubit/order_detail_cubit.dart';

import '../../features/favorites/data/datasources/favorites_remote_datasource.dart';
import '../../features/favorites/data/repositories/favorites_repository_impl.dart';
import '../../features/favorites/domain/repositories/favorites_repository.dart';
import '../../features/favorites/domain/usecases/get_favorites_usecase.dart';
import '../../features/favorites/domain/usecases/toggle_favorite_usecase.dart';
import '../../features/favorites/presentation/cubit/favorites_cubit.dart';

import '../../features/notifications/data/datasources/notifications_remote_datasource.dart';
import '../../features/notifications/data/repositories/notifications_repository_impl.dart';
import '../../features/notifications/domain/repositories/notifications_repository.dart';
import '../../features/notifications/domain/usecases/get_notifications_usecase.dart';
import '../../features/notifications/domain/usecases/mark_notifications_read_usecase.dart';
import '../../features/notifications/presentation/cubit/notifications_cubit.dart';

import '../../features/scanner/data/datasources/table_remote_datasource.dart';
import '../../features/scanner/data/repositories/table_repository_impl.dart';
import '../../features/scanner/domain/repositories/table_repository.dart';
import '../../features/scanner/presentation/cubit/scanner_cubit.dart';

import '../../features/home/presentation/cubit/home_cubit.dart';

import '../../features/addresses/data/datasources/addresses_remote_datasource.dart';
import '../../features/addresses/data/repositories/addresses_repository_impl.dart';
import '../../features/addresses/domain/repositories/addresses_repository.dart';
import '../../features/addresses/domain/usecases/get_addresses_usecase.dart';
import '../../features/addresses/domain/usecases/create_address_usecase.dart';
import '../../features/addresses/domain/usecases/update_address_usecase.dart';
import '../../features/addresses/domain/usecases/delete_address_usecase.dart';
import '../../features/addresses/presentation/cubit/addresses_cubit.dart';

final sl = GetIt.instance;

/// Registration order matters: core singletons first, then each feature's
/// datasource -> repository -> usecase -> cubit, mirroring mobile-app/'s existing DI convention
/// (lib/core/service_locator.dart there) so this stays a familiar pattern for anyone who's worked
/// in that codebase.
Future<void> initServiceLocator() async {
  // Core
  sl.registerLazySingleton<SecureStorageService>(() => SecureStorageService());
  final localStorage = await LocalStorageService.create();
  sl.registerLazySingleton<LocalStorageService>(() => localStorage);
  sl.registerLazySingleton<LocationService>(() => LocationService());
  sl.registerLazySingleton<DioClient>(() => DioClient(sl<SecureStorageService>()));
  sl.registerLazySingleton(() => ThemeModeController(sl()));

  // Authentication
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(remoteDataSource: sl(), secureStorage: sl()));
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => RegisterUseCase(sl()));
  sl.registerLazySingleton(() => ForgotPasswordUseCase(sl()));
  sl.registerLazySingleton(() => ResetPasswordUseCase(sl()));
  sl.registerFactory(() => AuthCubit(authRepository: sl(), loginUseCase: sl(), registerUseCase: sl()));

  // Cafes
  sl.registerLazySingleton<CafesRemoteDataSource>(() => CafesRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<CafesRepository>(() => CafesRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetCafesUseCase(sl()));
  sl.registerLazySingleton(() => GetCafeByIdUseCase(sl()));
  sl.registerFactory(() => CafesCubit(getCafesUseCase: sl(), locationService: sl()));

  // Menu — one MenuCubit per cafe screen (registerFactoryParam so the tenantId a Menu screen was
  // opened with flows straight into the cubit's constructor).
  sl.registerLazySingleton<MenuRemoteDataSource>(() => MenuRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<MenuRepository>(() => MenuRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetMenuUseCase(sl()));
  sl.registerFactoryParam<MenuCubit, String, void>((tenantId, _) => MenuCubit(getMenuUseCase: sl(), tenantId: tenantId));

  // Cart — one cart for the whole app session (persisted locally), shared across Menu/Cart/
  // Checkout/Home, unlike every other cubit above which is a fresh instance per screen.
  sl.registerLazySingleton(() => CartCubit(localStorage: sl()));

  // Checkout
  sl.registerLazySingleton<CheckoutRemoteDataSource>(() => CheckoutRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<CheckoutRepository>(() => CheckoutRepositoryImpl(sl()));
  sl.registerLazySingleton(() => PlaceOrderUseCase(sl()));
  sl.registerFactory(() => CheckoutCubit(placeOrderUseCase: sl()));

  // Orders
  sl.registerLazySingleton<OrdersRemoteDataSource>(() => OrdersRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<OrdersRepository>(() => OrdersRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetOrdersUseCase(sl()));
  sl.registerLazySingleton(() => GetOrderByIdUseCase(sl()));
  sl.registerFactory(() => OrdersCubit(getOrdersUseCase: sl()));
  sl.registerFactoryParam<OrderDetailCubit, String, void>((orderId, _) => OrderDetailCubit(getOrderByIdUseCase: sl(), orderId: orderId));

  // Favorites — one instance for the whole app session (see main.dart), same reasoning as Cart.
  sl.registerLazySingleton<FavoritesRemoteDataSource>(() => FavoritesRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<FavoritesRepository>(() => FavoritesRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetFavoritesUseCase(sl()));
  sl.registerLazySingleton(() => ToggleFavoriteUseCase(sl()));
  sl.registerLazySingleton(() => FavoritesCubit(getFavoritesUseCase: sl(), toggleFavoriteUseCase: sl()));

  // Notifications
  sl.registerLazySingleton<NotificationsRemoteDataSource>(() => NotificationsRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<NotificationsRepository>(() => NotificationsRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetNotificationsUseCase(sl()));
  sl.registerLazySingleton(() => MarkNotificationsReadUseCase(sl()));
  sl.registerFactory(() => NotificationsCubit(getNotificationsUseCase: sl(), markNotificationsReadUseCase: sl()));

  // Scanner
  sl.registerLazySingleton<TableRemoteDataSource>(() => TableRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<TableRepository>(() => TableRepositoryImpl(sl()));
  sl.registerFactory(() => ScannerCubit(tableRepository: sl(), getCafeByIdUseCase: sl()));

  // Home — composes Nearby/Popular/Recently-Visited into one cubit (see home_cubit.dart).
  sl.registerFactory(() => HomeCubit(getCafesUseCase: sl(), getCafeByIdUseCase: sl(), locationService: sl(), localStorage: sl()));

  // Addresses — future-ready profile feature, not yet wired into checkout (see plan notes).
  sl.registerLazySingleton<AddressesRemoteDataSource>(() => AddressesRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<AddressesRepository>(() => AddressesRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetAddressesUseCase(sl()));
  sl.registerLazySingleton(() => CreateAddressUseCase(sl()));
  sl.registerLazySingleton(() => UpdateAddressUseCase(sl()));
  sl.registerLazySingleton(() => DeleteAddressUseCase(sl()));
  sl.registerFactory(() => AddressesCubit(getAddressesUseCase: sl(), createAddressUseCase: sl(), updateAddressUseCase: sl(), deleteAddressUseCase: sl()));
}
