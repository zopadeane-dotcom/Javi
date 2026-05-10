export type Role = "admin" | "employee"

export type ContractType =
  | "indefinido"
  | "temporal"
  | "formacion"
  | "practicas"
  | "obra_servicio"

export type VatRate = 0 | 4 | 10 | 21

export type HaccpControlType = "temperatura" | "limpieza" | "plagas" | "otro"

export type HaccpStatus = "ok" | "incidencia"

export type CertificateStatus = "vigente" | "caducado" | "pendiente"

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business
        Insert: Omit<Business, "id" | "created_at">
        Update: Partial<Omit<Business, "id" | "created_at">>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at">
        Update: Partial<Omit<Profile, "id" | "created_at">>
      }
      employees: {
        Row: Employee
        Insert: Omit<Employee, "id" | "created_at">
        Update: Partial<Omit<Employee, "id" | "created_at">>
      }
      time_records: {
        Row: TimeRecord
        Insert: Omit<TimeRecord, "id" | "created_at">
        Update: Partial<Omit<TimeRecord, "id" | "created_at">>
      }
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, "id" | "created_at">
        Update: Partial<Omit<Supplier, "id" | "created_at">>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, "id" | "created_at">
        Update: Partial<Omit<Invoice, "id" | "created_at">>
      }
      haccp_templates: {
        Row: HaccpTemplate
        Insert: Omit<HaccpTemplate, "id" | "created_at">
        Update: Partial<Omit<HaccpTemplate, "id" | "created_at">>
      }
      haccp_controls: {
        Row: HaccpControl
        Insert: Omit<HaccpControl, "id" | "created_at">
        Update: Partial<Omit<HaccpControl, "id" | "created_at">>
      }
      allergen_products: {
        Row: AllergenProduct
        Insert: Omit<AllergenProduct, "id" | "created_at">
        Update: Partial<Omit<AllergenProduct, "id" | "created_at">>
      }
      supplier_sheets: {
        Row: SupplierSheet
        Insert: Omit<SupplierSheet, "id" | "created_at">
        Update: Partial<Omit<SupplierSheet, "id" | "created_at">>
      }
      food_handler_certificates: {
        Row: FoodHandlerCertificate
        Insert: Omit<FoodHandlerCertificate, "id" | "created_at">
        Update: Partial<Omit<FoodHandlerCertificate, "id" | "created_at">>
      }
    }
  }
}

export interface Business {
  id: string
  owner_id: string
  name: string
  trade_name: string | null
  cif: string
  address: string
  city: string
  province: string
  postal_code: string
  phone: string | null
  email: string | null
  activity_license: string | null
  created_at: string
}

export interface Profile {
  id: string
  business_id: string | null
  role: Role
  full_name: string
  email: string
  created_at: string
}

export interface Employee {
  id: string
  business_id: string
  user_id: string | null
  full_name: string
  dni: string
  social_security_number: string | null
  position: string
  contract_type: ContractType
  start_date: string
  end_date: string | null
  hourly_rate: number | null
  weekly_hours: number
  is_active: boolean
  created_at: string
}

export interface TimeRecord {
  id: string
  employee_id: string
  business_id: string
  check_in: string
  check_out: string | null
  date: string
  notes: string | null
  created_at: string
}

export interface Supplier {
  id: string
  business_id: string
  name: string
  nif: string | null
  address: string | null
  phone: string | null
  email: string | null
  contact_person: string | null
  created_at: string
}

export interface Invoice {
  id: string
  business_id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  base_amount: number
  vat_rate: VatRate
  vat_amount: number
  total_amount: number
  quarter: 1 | 2 | 3 | 4
  year: number
  is_deductible: boolean
  concept: string | null
  file_url: string | null
  created_at: string
}

export interface HaccpTemplate {
  id: string
  business_id: string
  name: string
  control_type: HaccpControlType
  description: string | null
  min_value: number | null
  max_value: number | null
  unit: string | null
  is_active: boolean
  created_at: string
}

export interface HaccpControl {
  id: string
  business_id: string
  template_id: string
  recorded_by: string
  control_date: string
  value: number | null
  status: HaccpStatus
  notes: string | null
  created_at: string
}

export interface AllergenProduct {
  id: string
  business_id: string
  name: string
  description: string | null
  gluten: boolean
  crustaceans: boolean
  eggs: boolean
  fish: boolean
  peanuts: boolean
  soy: boolean
  dairy: boolean
  nuts: boolean
  celery: boolean
  mustard: boolean
  sesame: boolean
  sulphites: boolean
  lupin: boolean
  molluscs: boolean
  created_at: string
}

export interface SupplierSheet {
  id: string
  business_id: string
  supplier_id: string
  rgseaa_number: string | null
  supplied_products: string | null
  last_audit_date: string | null
  next_audit_date: string | null
  notes: string | null
  file_urls: string[]
  created_at: string
}

export interface FoodHandlerCertificate {
  id: string
  business_id: string
  employee_id: string
  obtained_date: string
  expiry_date: string | null
  certificate_number: string | null
  status: CertificateStatus
  file_url: string | null
  created_at: string
}
