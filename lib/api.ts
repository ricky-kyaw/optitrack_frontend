const API_BASE = "/api/v1"

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (accessToken) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    setAccessToken(null)
    window.location.href = "/login"
    throw new ApiError(401, "Unauthorized")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error.message || "An error occurred")
  }

  return response.json()
}

// Auth
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface User {
  id: number
  email: string
  name: string
  employee_code: string
  department: string
  role: string
  is_admin: boolean
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
  setAccessToken(response.access)
  return response
}

export async function logout() {
  setAccessToken(null)
}

// Dashboard / Tracker
export interface LiveData {
  currently_clocked_in: number
}

export interface UserSummary {
  today_hours: number
  week_overtime_hours: number
  recent_sessions: WorkSession[]
  is_clocked_in: boolean
  current_session_start?: string
}

export interface WorkSession {
  id: number
  date: string
  clock_in: string
  clock_out: string | null
  duration_hours: number
  source: "web" | "manual"
}

export function getLiveData(): Promise<LiveData> {
  return request<LiveData>("/tracker/live/")
}

export function getUserSummary(): Promise<UserSummary> {
  return request<UserSummary>("/tracker/my-summary/")
}

// Attendance
export function clockIn(): Promise<WorkSession> {
  return request<WorkSession>("/attendance/clock-in/", { method: "POST" })
}

export function clockOut(): Promise<WorkSession> {
  return request<WorkSession>("/attendance/clock-out/", { method: "POST" })
}

export function listSessions(params?: {
  employee?: string
}): Promise<WorkSession[]> {
  const searchParams = new URLSearchParams()
  if (params?.employee) searchParams.set("employee", params.employee)
  const query = searchParams.toString()
  return request<WorkSession[]>(`/attendance/sessions/${query ? `?${query}` : ""}`)
}

// Employees
export interface Employee {
  id: number
  name: string
  email: string
  employee_code: string
  department: string
  role: string
  employment_status: "active" | "inactive" | "terminated"
}

export interface CreateEmployeeData {
  name: string
  email: string
  employee_code: string
  department: string
  role: string
}

export function listEmployees(): Promise<Employee[]> {
  return request<Employee[]>("/users/employees/")
}

export function createEmployee(data: CreateEmployeeData): Promise<Employee> {
  return request<Employee>("/users/employees/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Overtime
export interface OvertimeEntry {
  id: number
  period_start: string
  period_end: string
  hours_regular: number
  hours_overtime: number
  overtime_amount: number
  rule_name: string
  is_locked: boolean
  employee_id?: number
  employee_name?: string
}

export function listOvertimeEntries(params?: {
  all_employees?: boolean
}): Promise<OvertimeEntry[]> {
  const searchParams = new URLSearchParams()
  if (params?.all_employees) searchParams.set("all_employees", "true")
  const query = searchParams.toString()
  return request<OvertimeEntry[]>(`/overtime/entries/${query ? `?${query}` : ""}`)
}

export function recalculateOvertime(period: {
  period_start: string
  period_end: string
}): Promise<{ message: string }> {
  return request<{ message: string }>("/overtime/entries/recalculate/", {
    method: "POST",
    body: JSON.stringify(period),
  })
}

// Overtime Rules
export interface OvertimeRule {
  id: number
  name: string
  scope: "daily" | "weekly"
  threshold_hours: number
  multiplier: number
  department: string | null
  role: string | null
  is_active: boolean
}

export interface CreateOvertimeRuleData {
  name: string
  scope: "daily" | "weekly"
  threshold_hours: number
  multiplier: number
  department?: string
  role?: string
  is_active: boolean
}

export function listOvertimeRules(): Promise<OvertimeRule[]> {
  return request<OvertimeRule[]>("/overtime/rules/")
}

export function createOvertimeRule(data: CreateOvertimeRuleData): Promise<OvertimeRule> {
  return request<OvertimeRule>("/overtime/rules/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateOvertimeRule(id: number, data: Partial<CreateOvertimeRuleData>): Promise<OvertimeRule> {
  return request<OvertimeRule>(`/overtime/rules/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
