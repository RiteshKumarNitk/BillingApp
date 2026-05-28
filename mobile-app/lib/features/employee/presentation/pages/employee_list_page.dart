import 'package:flutter/material.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/service_locator.dart' as di;
import '../../../employee/domain/entities/employee.dart';
import '../../../employee/data/models/employee_model.dart';
import '../../../employee/domain/repositories/employee_repository.dart';

class EmployeeListPage extends StatefulWidget {
  const EmployeeListPage({super.key});

  @override
  State<EmployeeListPage> createState() => _EmployeeListPageState();
}

class _EmployeeListPageState extends State<EmployeeListPage> {
  final ApiClient _api = di.sl<ApiClient>();
  final IEmployeeRepository _repo = di.sl<IEmployeeRepository>();
  List<Employee> _employees = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final apiRes = await _api.getEmployees();
      if (apiRes['employees'] != null) {
        final list = (apiRes['employees'] as List)
            .map((j) => EmployeeModel.fromJson(j).toEntity())
            .toList();
        if (mounted) setState(() => _employees = list);
      }
    } catch (_) {
      final local = await _repo.getAllEmployees();
      if (mounted) setState(() => _employees = local);
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _addEmployee() async {
    final nameCtl = TextEditingController();
    final emailCtl = TextEditingController();
    final phoneCtl = TextEditingController();
    final passCtl = TextEditingController(text: 'emp123');
    String selectedRole = 'CASHIER';

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add Employee'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
                const SizedBox(height: 8),
                TextField(controller: emailCtl, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
                const SizedBox(height: 8),
                TextField(controller: phoneCtl, decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder())),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: selectedRole,
                  decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
                  items: ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                  onChanged: (v) => setDialogState(() => selectedRole = v!),
                ),
                const SizedBox(height: 8),
                TextField(controller: passCtl, decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder())),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add')),
          ],
        ),
      ),
    );

    if (result == true) {
      try {
        await _api.createEmployee({
          'name': nameCtl.text.trim(),
          'email': emailCtl.text.trim(),
          'phone': phoneCtl.text.trim(),
          'role': selectedRole,
          'password': passCtl.text,
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Employee added')));
        _load();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _deleteEmployee(Employee emp) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Employee'),
        content: Text('Remove ${emp.name}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm == true) {
      try {
        await _api.deleteEmployee(emp.id);
        await _repo.deleteEmployee(emp.id);
        _load();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Employees'), actions: [
        IconButton(icon: const Icon(Icons.person_add), onPressed: _addEmployee),
      ]),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _employees.isEmpty
              ? const Center(child: Text('No employees yet'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _employees.length,
                    itemBuilder: (ctx, i) {
                      final e = _employees[i];
                      return ListTile(
                        leading: CircleAvatar(child: Text(e.name[0].toUpperCase())),
                        title: Text(e.name),
                        subtitle: Text('${e.roleDisplayName}  •  ${e.email}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () => _deleteEmployee(e),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
