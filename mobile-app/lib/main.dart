import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';
import 'config/routes/app_routes.dart';
import 'core/data/hive_database.dart';
import 'core/service_locator.dart' as di;
import 'core/services/fcm_service.dart';
import 'core/theme/app_theme.dart';
import 'features/billing/presentation/bloc/billing_bloc.dart';
import 'features/billing/presentation/bloc/sales_history_bloc.dart';
import 'features/product/presentation/bloc/product_bloc.dart';
import 'features/shop/presentation/bloc/shop_bloc.dart';
import 'features/settings/presentation/bloc/printer_bloc.dart';
import 'features/settings/presentation/bloc/printer_event.dart';
import 'features/customer/presentation/bloc/customer_bloc.dart';
import 'features/discount/presentation/bloc/discount_bloc.dart';
import 'features/product/presentation/bloc/expiry_alert_bloc.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_auth_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_dashboard_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_stores_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_orders_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_notifications_bloc.dart';
import 'features/customer_app/presentation/bloc/customer_profile_bloc.dart';
import 'features/customer_app/presentation/bloc/store_menu_bloc.dart';
import 'features/billing/presentation/bloc/order_queue_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await HiveDatabase.init();
  await di.init();
  FcmService().initialize();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(create: (context) => di.sl<AuthBloc>()),
        BlocProvider<ProductBloc>(
            create: (context) => di.sl<ProductBloc>()..add(LoadProducts())),
        BlocProvider<ShopBloc>(
            create: (context) => di.sl<ShopBloc>()..add(LoadShopEvent())),
        BlocProvider<BillingBloc>(create: (context) => di.sl<BillingBloc>()),
        BlocProvider<SalesHistoryBloc>(
            create: (context) => di.sl<SalesHistoryBloc>()),
        BlocProvider<PrinterBloc>(
            create: (context) => di.sl<PrinterBloc>()..add(InitPrinterEvent())),
        BlocProvider<CustomerBloc>(create: (context) => di.sl<CustomerBloc>()),
        BlocProvider<DiscountBloc>(create: (context) => di.sl<DiscountBloc>()),
        BlocProvider<ExpiryAlertBloc>(
            create: (context) => di.sl<ExpiryAlertBloc>()),
        // Customer App providers
        BlocProvider<CustomerAuthBloc>(
            create: (context) => di.sl<CustomerAuthBloc>()..add(CustomerAuthCheckSession())),
        BlocProvider<CustomerDashboardBloc>(
            create: (context) => di.sl<CustomerDashboardBloc>()),
        BlocProvider<CustomerStoresBloc>(
            create: (context) => di.sl<CustomerStoresBloc>()),
        BlocProvider<CustomerOrdersBloc>(
            create: (context) => di.sl<CustomerOrdersBloc>()),
        BlocProvider<CustomerNotificationsBloc>(
            create: (context) => di.sl<CustomerNotificationsBloc>()),
        BlocProvider<CustomerProfileBloc>(
            create: (context) => di.sl<CustomerProfileBloc>()),
        BlocProvider<StoreMenuBloc>(
            create: (context) => di.sl<StoreMenuBloc>()),
        BlocProvider<OrderQueueBloc>(
            create: (context) => di.sl<OrderQueueBloc>()),
      ],
      child: MaterialApp.router(
        title: 'Billing App',
        theme: AppTheme.lightTheme,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
