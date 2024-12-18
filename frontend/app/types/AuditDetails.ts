export interface AuditDetails {
    au_idx: number;
    au_audit_date: string;
    au_number_of_days: number;
    au_leadauditor_idx: number;
    au_leadauditee_idx: number;
    au_auditstatus: string;
    au_place: string;
    au_theme: string;
    au_typ: string;
}