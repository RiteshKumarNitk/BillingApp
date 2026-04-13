import 'package:hive_flutter/hive_flutter.dart';
import '../../features/product/data/models/product_model.dart';
import '../../features/product/data/models/expiry_alert_model.dart';
import '../../features/shop/data/models/shop_model.dart';
import '../../features/billing/data/models/transaction_model.dart';
import '../../features/billing/data/models/refund_model.dart';
import '../../features/customer/data/models/customer_model.dart';
import '../../features/employee/data/models/employee_model.dart';
import '../../features/discount/data/models/discount_model.dart';

class HiveDatabase {
  static const String productBoxName = 'products';
  static const String shopBoxName = 'shop';
  static const String settingsBoxName = 'settings';
  static const String transactionBoxName = 'transactions';
  static const String refundBoxName = 'refunds';
  static const String customerBoxName = 'customers';
  static const String employeeBoxName = 'employees';
  static const String discountBoxName = 'discounts';
  static const String expiryAlertBoxName = 'expiry_alerts';

  static Future<void> init() async {
    await Hive.initFlutter();

    // Register Adapters
    Hive.registerAdapter(ProductModelAdapter());
    Hive.registerAdapter(ShopModelAdapter());
    Hive.registerAdapter(TransactionItemModelAdapter());
    Hive.registerAdapter(TransactionModelAdapter());
    Hive.registerAdapter(RefundItemModelAdapter());
    Hive.registerAdapter(RefundModelAdapter());
    Hive.registerAdapter(CustomerModelAdapter());
    Hive.registerAdapter(EmployeeModelAdapter());
    Hive.registerAdapter(EmployeeRoleAdapter());
    Hive.registerAdapter(DiscountModelAdapter());
    Hive.registerAdapter(ExpiryAlertModelAdapter());

    // Open Boxes
    await Hive.openBox<ProductModel>(productBoxName);
    await Hive.openBox<ShopModel>(shopBoxName);
    await Hive.openBox(settingsBoxName); // Generic box for simple key-value
    await Hive.openBox<TransactionModel>(transactionBoxName);
    await Hive.openBox<RefundModel>(refundBoxName);
    await Hive.openBox<CustomerModel>(customerBoxName);
    await Hive.openBox<EmployeeModel>(employeeBoxName);
    await Hive.openBox<DiscountModel>(discountBoxName);
    await Hive.openBox<ExpiryAlertModel>(expiryAlertBoxName);
  }

  static Box<ProductModel> get productBox =>
      Hive.box<ProductModel>(productBoxName);
  static Box<ShopModel> get shopBox => Hive.box<ShopModel>(shopBoxName);
  static Box get settingsBox => Hive.box(settingsBoxName);
  static Box<TransactionModel> get transactionBox =>
      Hive.box<TransactionModel>(transactionBoxName);
  static Box<RefundModel> get refundBox =>
      Hive.box<RefundModel>(refundBoxName);
  static Box<CustomerModel> get customerBox =>
      Hive.box<CustomerModel>(customerBoxName);
  static Box<EmployeeModel> get employeeBox =>
      Hive.box<EmployeeModel>(employeeBoxName);
  static Box<DiscountModel> get discountBox =>
      Hive.box<DiscountModel>(discountBoxName);
  static Box<ExpiryAlertModel> get expiryAlertBox =>
      Hive.box<ExpiryAlertModel>(expiryAlertBoxName);
}
