"use server"

import { supabaseAdmin } from "@/lib/supabase";
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

        let query = supabaseAdmin
            .from('claim_cases')
            .select(`
                *,
                case:patient_cases(*),
                diagnoses:diagnosis_cases(*),
                procedures:procedure_cases(*)
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            // Search within patient cases via a separate query
            const { data: matchingCases } = await supabaseAdmin
                .from('patient_cases')
                .select('id')
                .or(`patient_name.ilike.%${search}%,rm_no.ilike.%${search}%,sep_number.ilike.%${search}%`);

            if (matchingCases && matchingCases.length > 0) {
                const caseIds = matchingCases.map(c => c.id);
                query = query.in('case_id', caseIds);
            } else {
                return [];
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching claim cases:", error);
        return [];
    }
}

export async function updateClaimStatus(id: string, status: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('claim_cases')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/proses/klaim");
        return { success: true, data };
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

        let query = supabaseAdmin
            .from('case_costs')
            .select(`*, case:patient_cases(*)`)
            .order('amount', { ascending: false });

        if (search) {
            const { data: matchingCases } = await supabaseAdmin
                .from('patient_cases')
                .select('id')
                .or(`patient_name.ilike.%${search}%,rm_no.ilike.%${search}%,sep_number.ilike.%${search}%`);

            if (matchingCases && matchingCases.length > 0) {
                query = query.in('case_id', matchingCases.map(c => c.id));
            } else {
                return [];
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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

        let query = supabaseAdmin
            .from('pathway_compliances')
            .select(`*, case:patient_cases(*), pathway:clinical_pathways(*)`)
            .order('compliance_score', { ascending: true });

        if (search) {
            const { data: matchingCases } = await supabaseAdmin
                .from('patient_cases')
                .select('id')
                .or(`patient_name.ilike.%${search}%,rm_no.ilike.%${search}%,sep_number.ilike.%${search}%`);

            if (matchingCases && matchingCases.length > 0) {
                query = query.in('case_id', matchingCases.map(c => c.id));
            } else {
                return [];
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching pathways:", error);
        return [];
    }
}

export async function createClinicalPathway(data: any) {
    try {
        const { data: pathway, error } = await supabaseAdmin
            .from('clinical_pathways')
            .insert({
                name: data.name,
                inacbg_code: data.inacbgCode,
                category: data.category,
                expected_los: Number(data.expectedLos),
                expected_room_cost: Number(data.expectedRoomCost),
                expected_action_cost: Number(data.expectedActionCost),
                expected_ibs_cost: Number(data.expectedIbsCost),
                expected_pharmacy_cost: Number(data.expectedPharmacyCost),
                expected_lab_cost: Number(data.expectedLabCost),
                expected_rad_cost: Number(data.expectedRadCost),
                expected_rehab_cost: Number(data.expectedRehabCost),
                expected_other_cost: Number(data.expectedOtherCost),
                expected_cost: Number(data.totalExpectedCost),
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/proses/pathway");
        return { success: true, data: pathway };
    } catch (error) {
        console.error("Error creating clinical pathway:", error);
        throw error;
    }
}

export async function getAllClinicalPathwayDefinitions() {
    try {
        const { data, error } = await supabaseAdmin
            .from('clinical_pathways')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
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
        let query = supabaseAdmin
            .from('incentive_pools')
            .select(`*, period:payroll_periods(*)`);

        if (periodId) {
            query = query.eq('period_id', periodId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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

        let query = supabaseAdmin
            .from('patient_cases')
            .select(`*, actions:doctor_actions(*, doctor:doctors(*))`)
            .order('admission_date', { ascending: false });

        if (search) {
            query = query.or(`patient_name.ilike.%${search}%,rm_no.ilike.%${search}%,sep_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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
        let query = supabaseAdmin
            .from('incentive_distributions')
            .select(`*, doctor:doctors(*), pool:incentive_pools(*, period:payroll_periods(*))`)
            .order('final_incentive', { ascending: false });

        if (periodId) {
            // Filter by periodId through the pool relation
            const { data: pools } = await supabaseAdmin
                .from('incentive_pools')
                .select('id')
                .eq('period_id', periodId);

            if (pools && pools.length > 0) {
                query = query.in('pool_id', pools.map(p => p.id));
            } else {
                return [];
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
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
        const { data: workflow, error } = await supabaseAdmin
            .from('approval_workflows')
            .insert({
                record_id: data.recordId,
                module: data.module,
                approver_id: data.approverId,
                notes: data.notes,
                status: "PENDING"
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/approval");
        return { success: true, data: workflow };
    } catch (error) {
        return { success: false, error: "Gagal mengajukan persetujuan" };
    }
}
