import 'package:get_it/get_it.dart';
import '../../features/billing/data/repositories/transaction_repository_impl.dart';
import '../../features/billing/domain/repositories/transaction_repository.dart';
import '../../features/billing/domain/usecases/transaction_usecases.dart';
import '../../features/billing/presentation/bloc/billing_bloc.dart';
import '../../features/billing/presentation/bloc/sales_history_bloc.dart';
import '../../features/product/data/repositories/product_repository_impl.dart';
import '../../features/product/data/repositories/expiry_alert_repository_impl.dart';
import '../../features/product/domain/repositories/product_repository.dart';
import '../../features/product/domain/repositories/expiry_alert_repository.dart';
import '../../features/product/domain/usecases/product_usecases.dart';
import '../../features/product/domain/usecases/get_expiring_alerts_usecase.dart';
import '../../features/product/presentation/bloc/product_bloc.dart';
import '../../features/product/presentation/bloc/expiry_alert_bloc.dart';
import '../../features/shop/data/repositories/shop_repository_impl.dart';
import '../../features/shop/domain/repositories/shop_repository.dart';
import '../../features/shop/domain/usecases/shop_usecases.dart';
import '../../features/shop/presentation/bloc/shop_bloc.dart';
import '../../features/settings/data/repositories/printer_repository_impl.dart';
import '../../features/settings/domain/repositories/printer_repository.dart';
import '../../features/settings/presentation/bloc/printer_bloc.dart';
import '../../features/customer/data/repositories/customer_repository_impl.dart';
import '../../features/customer/domain/repositories/customer_repository.dart';
import '../../features/customer/domain/usecases/get_all_customers_usecase.dart';
import '../../features/customer/domain/usecases/search_customers_usecase.dart';
import '../../features/customer/domain/usecases/save_customer_usecase.dart';
import '../../features/customer/presentation/bloc/customer_bloc.dart';
import '../../features/employee/data/repositories/employee_repository_impl.dart';
import '../../features/employee/domain/repositories/employee_repository.dart';
import '../../features/discount/data/repositories/discount_repository_impl.dart';
import '../../features/discount/domain/repositories/discount_repository.dart';
import '../../features/discount/domain/usecases/get_today_discounts_usecase.dart';
import '../../features/discount/presentation/bloc/discount_bloc.dart';
import '../../features/employee/domain/usecases/authenticate_employee_usecase.dart';
import '../../features/product/domain/usecases/get_low_stock_products_usecase.dart';
import '../../features/discount/domain/usecases/save_discount_usecase.dart';
import '../../features/product/domain/usecases/create_expiry_alert_usecase.dart';
import 'data/hive_database.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // Features - Billing
  // Bloc
  sl.registerFactory(
    () => BillingBloc(
      getProductByBarcodeUseCase: sl(),
      saveTransactionUseCase: sl(),
    ),
  );
  sl.registerFactory(
    () => SalesHistoryBloc(
      getAllTransactionsUseCase: sl(),
      getTransactionsByDateUseCase: sl(),
      refundTransactionUseCase: sl(),
      getDailySalesUseCase: sl(),
    ),
  );
  // Features - Billing
  // Use cases
  sl.registerLazySingleton(() => SaveTransactionUseCase(sl()));
  sl.registerLazySingleton(() => GetAllTransactionsUseCase(sl()));
  sl.registerLazySingleton(() => GetTransactionsByDateUseCase(sl()));
  sl.registerLazySingleton(() => RefundTransactionUseCase(sl()));
  sl.registerLazySingleton(() => GetDailySalesUseCase(sl()));

  // Repository
  sl.registerLazySingleton<TransactionRepository>(
    () => TransactionRepositoryImpl(),
  );

  // Features - Product
  // Bloc
  sl.registerFactory(
    () => ProductBloc(
      getProductsUseCase: sl(),
      addProductUseCase: sl(),
      updateProductUseCase: sl(),
      deleteProductUseCase: sl(),
    ),
  );

  sl.registerFactory(
    () => ExpiryAlertBloc(
      getExpiringAlertsUseCase: sl(),
    ),
  );

  sl.registerFactory(
    () => ShopBloc(
      getShopUseCase: sl(),
      updateShopUseCase: sl(),
    ),
  );

  sl.registerFactory(
    () => PrinterBloc(
      repository: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => GetProductsUseCase(sl()));
  sl.registerLazySingleton(() => AddProductUseCase(sl()));
  sl.registerLazySingleton(() => UpdateProductUseCase(sl()));
  sl.registerLazySingleton(() => DeleteProductUseCase(sl()));
  sl.registerLazySingleton(() => GetProductByBarcodeUseCase(sl()));

  // Repository
  sl.registerLazySingleton<ProductRepository>(
    () => ProductRepositoryImpl(),
  );

  // Features - Shop
  // Use cases
  sl.registerLazySingleton(() => GetShopUseCase(sl()));
  sl.registerLazySingleton(() => UpdateShopUseCase(sl()));

  // Repository
  sl.registerLazySingleton<ShopRepository>(
    () => ShopRepositoryImpl(),
  );

  // Features - Settings / Printer
  sl.registerLazySingleton<PrinterRepository>(
    () => PrinterRepositoryImpl(),
  );

  // Features - Customer
  // Bloc
  sl.registerFactory(
    () => CustomerBloc(
      getAllCustomersUseCase: sl(),
      searchCustomersUseCase: sl(),
      saveCustomerUseCase: sl(),
    ),
  );
  // Use cases
  sl.registerLazySingleton(() => GetAllCustomersUseCase(sl()));
  sl.registerLazySingleton(() => SearchCustomersUseCase(sl()));
  sl.registerLazySingleton(() => SaveCustomerUseCase(sl()));
  // Repository
  sl.registerLazySingleton<ICustomerRepository>(
    () => CustomerRepositoryImpl(HiveDatabase.customerBox),
  );

  // Features - Employee
  // Repository
  sl.registerLazySingleton<IEmployeeRepository>(
    () => EmployeeRepositoryImpl(HiveDatabase.employeeBox),
  );

  // Features - Discount
  // Bloc
  sl.registerFactory(
    () => DiscountBloc(
      getTodayDiscountsUseCase: sl(),
      saveDiscountUseCase: sl(),
    ),
  );
  // Use cases
  sl.registerLazySingleton(() => GetTodayDiscountsUseCase(sl()));
  sl.registerLazySingleton(() => SaveDiscountUseCase(sl()));
  // Repository
  sl.registerLazySingleton<IDiscountRepository>(
    () => DiscountRepositoryImpl(HiveDatabase.discountBox),
  );

  // Features - Product Expiry Alerts
  // Use cases
  sl.registerLazySingleton(() => GetExpiringAlertsUseCase(sl()));
  sl.registerLazySingleton(() => GetLowStockProductsUseCase(sl()));
  sl.registerLazySingleton(() => CreateExpiryAlertUseCase(sl()));
  // Repository
  sl.registerLazySingleton<IExpiryAlertRepository>(
    () => ExpiryAlertRepositoryImpl(HiveDatabase.expiryAlertBox),
  );

  // Features - Employee - Additional use cases
  sl.registerLazySingleton(() => AuthenticateEmployeeUseCase(sl()));
}
