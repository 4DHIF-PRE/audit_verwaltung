export interface FindingDetails {
  f_id: number;
  f_level: number;
  f_creation_date: string; 
  f_timeInDays: number;
  f_status: "offen" | "geschlossen";
  f_au_audit_idx: number;
  f_qu_question_idx: number;
  f_u_auditor_id: string;
  f_auditor_comment?: string;
  f_finding_comment?: string; 
}