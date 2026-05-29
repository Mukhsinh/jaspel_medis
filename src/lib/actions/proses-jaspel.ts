"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * CLAIMS & CASEMIX ACTIONS
 */

export async function getClaimCases(params?: {
    status?: string;
    search?: string;
}) {
    try {
        const { status, search } = params || {};

        return await prisma.claimCase.findMany({
            where: {
                ...(status && { status }),
                ...(search && {
                    case: {
                        OR: [
                            { patientName: { contains: search, mode: 'insensitive' } },
                            { rmNo: { contains: search, mode: 'insensitive' } },
                            { sepNumber: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                })
            },
            include: {
                case: true,
                diagnoses: true,
                procedures: true
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Error fetching claim cases:", error);
        return [];
    }
}

export async function updateClaimStatus(id: string, status: string) {
    try {
        const updated = await prisma.claimCase.update({
            where: { id },
            data: { status }
        });
        revalidatePath("/proses/klaim");
        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: "Gagal memperbarui status klaim" };
    }
}

/**
 * COSTING & ANALYSIS ACTIONS
 */

export async function getCaseCosts(params?: { search?: string }) {
    try {
        const { search } = params || {};
        return await prisma.caseCost.findMany({
            where: {
                ...(search && {
                    case: {
                        OR: [
                            { patientName: { contains: search, mode: 'insensitive' } },
                            { rmNo: { contains: search, mode: 'insensitive' } },
                            { sepNumber: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                })
            },
            include: {
                case: true,
            },
            orderBy: { amount: 'desc' }
        });
    } catch (error) {
        console.error("Error fetching case costs:", error);
        return [];
    }
}

/**
 * CLINICAL PATHWAY ACTIONS
 */

export async function getClinicalPathways(params?: { search?: string }) {
    try {
        const { search } = params || {};
        // Get pathway compliances for the audit view
        const compliances = await prisma.pathwayCompliance.findMany({
            where: {
                ...(search && {
                    case: {
                        OR: [
                            { patientName: { contains: search, mode: 'insensitive' } },
                            { rmNo: { contains: search, mode: 'insensitive' } },
                            { sepNumber: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                })
            },
            include: {
                case: true,
                pathway: true
            },
            orderBy: { complianceScore: 'asc' }
        });
        return compliances;
    } catch (error) {
        console.error("Error fetching pathways:", error);
        return [];
    }
}

export async function createClinicalPathway(data: any) {
    try {
        const pathway = await prisma.clinicalPathway.create({
            data: {
                name: data.name,
                inacbgCode: data.inacbgCode,
                category: data.category,
                expectedLos: Number(data.expectedLos),
                expectedRoomCost: Number(data.expectedRoomCost),
                expectedActionCost: Number(data.expectedActionCost),
                expectedIbsCost: Number(data.expectedIbsCost),
                expectedPharmacyCost: Number(data.expectedPharmacyCost),
                expectedLabCost: Number(data.expectedLabCost),
                expectedRadCost: Number(data.expectedRadCost),
                expectedRehabCost: Number(data.expectedRehabCost),
                expectedOtherCost: Number(data.expectedOtherCost),
                totalExpectedCost: Number(data.totalExpectedCost),
            }
        });
        revalidatePath("/proses/pathway");
        return { success: true, data: pathway };
    } catch (error) {
        console.error("Error creating clinical pathway:", error);
        throw error;
    }
}

export async function getAllClinicalPathwayDefinitions() {
    try {
        return await prisma.clinicalPathway.findMany({
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error("Error fetching pathway definitions:", error);
        return [];
    }
}

/**
 * INCENTIVE POOL ACTIONS
 */

export async function getIncentivePools(periodId?: string) {
    try {
        return await prisma.incentivePool.findMany({
            where: periodId ? { periodId } : {},
            include: {
                period: true
            }
        });
    } catch (error) {
        console.error("Error fetching incentive pools:", error);
        return [];
    }
}

/**
 * RVU & WORKLOAD ACTIONS
 */

export async function getDoctorWorkloads(params?: { search?: string }) {
    try {
        const { search } = params || {};
        return await prisma.patientCase.findMany({
            where: {
                ...(search && {
                    OR: [
                        { patientName: { contains: search, mode: 'insensitive' } },
                        { rmNo: { contains: search, mode: 'insensitive' } },
                        { sepNumber: { contains: search, mode: 'insensitive' } },
                    ]
                })
            },
            include: {
                actions: {
                    include: {
                        doctor: true
                    }
                }
            },
            orderBy: { admissionDate: 'desc' }
        });
    } catch (error) {
        console.error("Error fetching workloads:", error);
        return [];
    }
}

/**
 * SIMULATION & INCENTIVE ACTIONS
 */

export async function getSimulationData(periodId?: string) {
    try {
        return await prisma.incentiveDistribution.findMany({
            where: periodId ? { pool: { periodId } } : {},
            include: {
                doctor: true,
                pool: {
                    include: {
                        period: true
                    }
                }
            },
            orderBy: { finalIncentive: 'desc' }
        });
    } catch (error) {
        console.error("Error fetching simulation data:", error);
        return [];
    }
}

/**
 * APPROVAL WORKFLOW ACTIONS
 */

export async function submitForApproval(data: {
    recordId: string;
    module: string;
    approverId: string;
    notes?: string;
}) {
    try {
        const workflow = await prisma.approvalWorkflow.create({
            data: {
                ...data,
                status: "PENDING"
            }
        });
        revalidatePath("/approval");
        return { success: true, data: workflow };
    } catch (error) {
        return { success: false, error: "Gagal mengajukan persetujuan" };
    }
}
