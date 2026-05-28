import 'package:flutter/material.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/service_locator.dart' as di;

const List<String> allPermissions = [
  'CREATE_PRODUCT',
  'EDIT_PRODUCT',
  'DELETE_PRODUCT',
  'VIEW_REPORTS',
  'CREATE_BILL',
  'MANAGE_USERS',
  'VIEW_PROFIT',
];

const Map<String, String> permissionLabels = {
  'CREATE_PRODUCT': 'Create Product',
  'EDIT_PRODUCT': 'Edit Product',
  'DELETE_PRODUCT': 'Delete Product',
  'VIEW_REPORTS': 'View Reports',
  'CREATE_BILL': 'Create Bill',
  'MANAGE_USERS': 'Manage Users',
  'VIEW_PROFIT': 'View Profit',
};

class RoleListPage extends StatefulWidget {
  const RoleListPage({super.key});

  @override
  State<RoleListPage> createState() => _RoleListPageState();
}

class _RoleListPageState extends State<RoleListPage> {
  final ApiClient _api = di.sl<ApiClient>();
  List<dynamic> _roles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRoles();
  }

  Future<void> _loadRoles() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getRoles();
      if (mounted) setState(() => _roles = res['roles'] ?? []);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load roles: $e')));
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _createRole() async {
    final nameCtl = TextEditingController();
    final selectedPerms = <String>{};

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Create Role'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Role Name', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                const Text('Permissions:', style: TextStyle(fontWeight: FontWeight.bold)),
                ...allPermissions.map((perm) => CheckboxListTile(
                  title: Text(permissionLabels[perm] ?? perm),
                  value: selectedPerms.contains(perm),
                  onChanged: (v) {
                    setDialogState(() {
                      if (v == true) { selectedPerms.add(perm); } else { selectedPerms.remove(perm); }
                    });
                  },
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                )),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Create')),
          ],
        ),
      ),
    );

    if (result == true) {
      try {
        await _api.createRole({
          'name': nameCtl.text.trim(),
          'permissions': selectedPerms.toList(),
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Role created')));
        _loadRoles();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Roles & Permissions'), actions: [
        IconButton(icon: const Icon(Icons.add), onPressed: _createRole),
      ]),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _roles.isEmpty
              ? const Center(child: Text('No roles yet'))
              : RefreshIndicator(
                  onRefresh: _loadRoles,
                  child: ListView.builder(
                    itemCount: _roles.length,
                    itemBuilder: (ctx, i) {
                      final r = _roles[i];
                      final perms = (r['permissions'] as List<dynamic>?) ?? [];
                      final userCount = r['_count']?['users'] ?? 0;
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(r['name'] ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  const Spacer(),
                                  Chip(label: Text('$userCount users', style: const TextStyle(fontSize: 12))),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 4,
                                runSpacing: 4,
                                children: perms.map((p) => Chip(
                                  label: Text(permissionLabels[p] ?? p, style: const TextStyle(fontSize: 11)),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  visualDensity: VisualDensity.compact,
                                )).toList(),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
