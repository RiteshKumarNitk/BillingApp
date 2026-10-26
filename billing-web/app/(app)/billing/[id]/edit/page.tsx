import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import EditInvoiceClient from './EditInvoiceClient';
import { getTenantTimeZone, isSameDayInTz } from '@/lib/tenantTime';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: transactionId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, tenantId: session.user.tenantId },
    include: { items: true },
  });
  if (!transaction) {
    notFound();
  }

  const userPermissions = session.user.permissions || [];
  const isSuperAdmin = session.user.role === 'SUPERADMIN';
  const hasEditPermission = isSuperAdmin || userPermissions.includes('EDIT_TRANSACTION');
  const isSameDay = isSameDayInTz(new Date(transaction.createdAt), new Date(), await getTenantTimeZone(session.user.tenantId));
  const hasReopenPermission = isSuperAdmin || userPermissions.includes('REOPEN_OLD_TRANSACTION');
  const canEdit = transaction.status === 'COMPLETED' && hasEditPermission && (isSameDay || hasReopenPermission);

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold mb-2">Cannot Edit This Invoice</h2>
          <p className="text-sm">
            {transaction.status !== 'COMPLETED'
              ? 'Only completed invoices can be edited.'
              : !hasEditPermission
              ? "You don't have permission to edit invoices."
              : "This invoice is from a previous day — editing it requires the \"Reopen Old Invoice\" permission."}
          </p>
        </div>
      </div>
    );
  }

  return <EditInvoiceClient transaction={JSON.parse(JSON.stringify(transaction))} />;
}
