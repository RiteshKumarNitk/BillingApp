import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/customer_bloc.dart';
import '../../domain/entities/customer.dart';

class CustomerListPage extends StatefulWidget {
  const CustomerListPage({Key? key}) : super(key: key);

  @override
  State<CustomerListPage> createState() => _CustomerListPageState();
}

class _CustomerListPageState extends State<CustomerListPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Load all customers on page init
    context.read<CustomerBloc>().add(const LoadAllCustomers());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers'),
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or phone...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          context
                              .read<CustomerBloc>()
                              .add(const LoadAllCustomers());
                        },
                      )
                    : null,
              ),
              onChanged: (value) {
                setState(() {});
                if (value.isNotEmpty) {
                  context.read<CustomerBloc>().add(SearchCustomers(value));
                } else {
                  context.read<CustomerBloc>().add(const LoadAllCustomers());
                }
              },
            ),
          ),
          Expanded(
            child: BlocBuilder<CustomerBloc, CustomerState>(
              builder: (context, state) {
                if (state.status == CustomerStatus.loading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.status == CustomerStatus.error) {
                  return Center(
                    child: Text('Error: ${state.errorMessage}'),
                  );
                }

                if (state.customers.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No customers found',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: state.customers.length,
                  itemBuilder: (context, index) {
                    final customer = state.customers[index];
                    return _buildCustomerTile(customer, context);
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.push('/customers/add');
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildCustomerTile(Customer customer, BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              Colors.primaries[customer.id.hashCode % Colors.primaries.length],
          child: Text(
            customer.name.isEmpty ? '?' : customer.name[0].toUpperCase(),
            style: const TextStyle(color: Colors.white),
          ),
        ),
        title: Text(customer.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '📞 ${customer.phone}',
              style: const TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 2),
            Text(
              '⭐ Loyalty Points: ${customer.loyaltyPoints.toStringAsFixed(0)}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('💰 BDT ${customer.totalSpent.toStringAsFixed(2)}'),
            Text(
              'Last: ${_formatDate(customer.lastPurchaseDate)}',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        isThreeLine: true,
        onTap: () {
          // Navigate to customer detail page
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('View ${customer.name} details')),
          );
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
