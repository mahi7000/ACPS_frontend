// Core Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'APPLICANT' | 'REVIEW_OFFICER' | 'INSPECTOR' | 'SENIOR_OFFICER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  subcity_id?: string;
  land_certificate_number?: string;
  tin?: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'AWAITING_ASSIGNMENT'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUIRED'
  | 'AWAITING_SENIOR_APPROVAL'
  | 'CONSENT_ISSUED'
  | 'PERMIT_ISSUED'
  | 'UNDER_CONSTRUCTION'
  | 'COMPLETION_DECLARED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'PAYMENT_EXPIRED';

export interface Application {
  application_id: string;
  arn: string;
  building_category: 'A' | 'B' | 'C';
  status: ApplicationStatus;
  calculated_fee: number | null;
  subcity_id: string;
  woreda: string;
  plot_address: string;
  plot_gps_lat: number;
  plot_gps_lng: number;
  height_m: number;
  floors_above: number;
  floors_below: number;
  floor_area_sqm: number;
  intended_use: string;
  architect_name: string;
  architect_license: string;
  contractor_name?: string;
  contractor_license?: string;
  project_value_etb: number;
  revision_cycle: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  comment_id: string;
  application: string;
  document?: string;
  author: string;
  author_name: string;
  category: 'MISSING_INFO' | 'DRAWING_ERROR' | 'CODE_NON_COMPLIANCE' | 'CLARIFICATION' | 'OTHER';
  content: string;
  resolution_status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
  created_at: string;
}

export interface ChecklistItem {
  item_id: string;
  item_text: string;
  result: 'PASS' | 'FAIL' | 'NA' | '';
  notes: string;
}

export interface InspectionPhoto {
  photo_id: string;
  file: string;
  taken_at: string;
}

export interface Inspection {
  inspection_id: string;
  inspection_type: string;
  scheduled_date: string;
  assigned_inspector_name?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  overall_result?: 'PASSED' | 'FAILED';
  failure_summary?: string;
  checklist_items?: ChecklistItem[];
  photos?: InspectionPhoto[];
}

// Notification Types
export interface Notification {
  notification_id: string;
  title: string;
  body: string;
  notification_type: string;
  reference_id: string;
  reference_type: string;
  is_read: boolean;
  created_at: string;
}
