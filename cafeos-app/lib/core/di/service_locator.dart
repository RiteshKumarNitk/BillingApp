import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/local_storage_service.dart';
import '../storage/secure_storage_service.dart';
import '../utils/location_service.dart';

import '../../features/authentication/data/datasources/auth_remote_datasource.dart';
import '../../features/authentication/data/repositories/auth_repository_impl.dart';
import '../../features/authentication/domain/repositories/auth_repository.dart';
import '../../features/authentication/domain/usecases/login_usecase.dart';
import '../../features/authentication/domain/usecases/register_usecase.dart';
import '../../features/authentication/presentation/cubit/auth_cubit.dart';

import '../../features/cafes/data/datasources/cafes_remote_datasource.dart';
import '../../features/cafes/data/repositories/cafes_repository_impl.dart';
import '../../features/cafes/domain/repositories/cafes_repository.dart';
import '../../features/cafes/domain/usecases/get_cafes_usecase.dart';
import '../../features/cafes/presentation/cubit/cafes_cubit.dart';

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

  // Authentication
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(remoteDataSource: sl(), secureStorage: sl()));
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => RegisterUseCase(sl()));
  sl.registerFactory(() => AuthCubit(authRepository: sl(), loginUseCase: sl(), registerUseCase: sl()));

  // Cafes
  sl.registerLazySingleton<CafesRemoteDataSource>(() => CafesRemoteDataSource(sl<DioClient>().dio));
  sl.registerLazySingleton<CafesRepository>(() => CafesRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetCafesUseCase(sl()));
  sl.registerFactory(() => CafesCubit(getCafesUseCase: sl(), locationService: sl()));
}
