"use server"

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPolicies() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    let user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { organization: true }
    });

    if (!user) throw new Error("User not found");

    // For MVP, auto-create an Organization if the user doesn't have one
    if (!user.orgId) {
        const org = await prisma.organization.create({
            data: {
                name: `${session.user.name || 'My'} Organization`,
                domain: session.user.email?.split('@')[1] || `domain-${Date.now()}.com`
            }
        });

        user = await prisma.user.update({
            where: { id: user.id },
            data: { orgId: org.id },
            include: { organization: true }
        });

        // Seed default policies for the new org
        await prisma.dataPolicy.createMany({
            data: [
                {
                    organizationId: org.id,
                    name: 'PII Auto-Redaction',
                    rules: JSON.stringify({ active: true, description: 'Automatically redacts Phone Numbers and SSNs from context before sending to LLM.' })
                },
                {
                    organizationId: org.id,
                    name: 'Block External Domains',
                    rules: JSON.stringify({ active: false, description: 'Prevents the OOO Agent from sending automated replies to non-whitelisted external domains.' })
                }
            ]
        });
    }

    const policies = await prisma.dataPolicy.findMany({
        where: { organizationId: user.orgId! },
        orderBy: { createdAt: 'asc' }
    });

    return policies;
}

export async function togglePolicy(policyId: string, active: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const policy = await prisma.dataPolicy.findUnique({ where: { id: policyId } });
    if (!policy) throw new Error("Policy not found");

    const rules = JSON.parse(policy.rules);
    rules.active = active;

    await prisma.dataPolicy.update({
        where: { id: policyId },
        data: { rules: JSON.stringify(rules) }
    });

    revalidatePath('/admin/policies');
}
