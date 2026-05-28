import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = getMobileUserFromAuthHeader(request);
    if (!authUser || !authUser.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const target = await prisma.user.findFirst({
      where: { id, tenantId: authUser.tenantId },
    });
    if (!target) {
      return corsResponse({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile users DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
