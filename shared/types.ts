// ========================================
// SHARED TYPES - Used by both Frontend & Backend
// ========================================

// User Roles
export type UserRole = 'admin' | 'manager' | 'member' | 'guest';

// Subscription Plans
export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

// Project Status
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

// Task Priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task Status
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

// Payment Status
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ========================================
// USER TYPES
// ========================================
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  subscription: ISubscription;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserUpdate {
  name?: string;
  email?: string;
  avatar?: string;
}

// ========================================
// SUBSCRIPTION TYPES
// ========================================
export interface ISubscription {
  plan: PlanType;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  startDate: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  features: IPlanFeatures;
}

export interface IPlanFeatures {
  maxProjects: number;
  maxTeamMembers: number;
  storageGB: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  apiAccess: boolean;
}

export interface IPlan {
  id: PlanType;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: IPlanFeatures;
  description: string;
  popular?: boolean;
}

// ========================================
// PROJECT TYPES
// ========================================
export interface IProject {
  _id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: string | IUser;
  members: IProjectMember[];
  tags: string[];
  dueDate?: Date;
  progress: number;
  taskCount: { total: number; completed: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectMember {
  user: string | IUser;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface IProjectCreate {
  name: string;
  description: string;
  dueDate?: Date;
  tags?: string[];
  members?: string[];
}

export interface IProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: Date;
  tags?: string[];
}

// ========================================
// TASK TYPES
// ========================================
export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string | IProject;
  assignee?: string | IUser;
  reporter: string | IUser;
  dueDate?: Date;
  completedAt?: Date;
  labels: string[];
  comments: IComment[];
  attachments: IAttachment[];
  estimatedHours?: number;
  loggedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  projectId: string;
  assigneeId?: string;
  dueDate?: Date;
  labels?: string[];
  estimatedHours?: number;
}

export interface ITaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  labels?: string[];
  loggedHours?: number;
}

// ========================================
// COMMENT TYPES
// ========================================
export interface IComment {
  _id: string;
  author: string | IUser;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// ATTACHMENT TYPES
// ========================================
export interface IAttachment {
  _id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string | IUser;
  uploadedAt: Date;
}

// ========================================
// PAYMENT TYPES
// ========================================
export interface IPayment {
  _id: string;
  user: string | IUser;
  amount: number;
  currency: string;
  status: PaymentStatus;
  plan: PlanType;
  transactionId: string;
  description: string;
  createdAt: Date;
}

export interface IPaymentCreate {
  planId: PlanType;
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
}

// ========================================
// ANALYTICS TYPES
// ========================================
export interface IAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalTeamMembers: number;
  projectsByStatus: Record<ProjectStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  recentActivity: IActivityLog[];
  productivityScore: number;
}

export interface IActivityLog {
  _id: string;
  user: string | IUser;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

// ========================================
// ADMIN DASHBOARD TYPES
// ========================================
export interface IAdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalProjects: number;
  totalTasks: number;
  subscriptionBreakdown: Record<PlanType, number>;
  recentPayments: IPayment[];
  userGrowth: ITimeSeriesData[];
  revenueGrowth: ITimeSeriesData[];
}

export interface ITimeSeriesData {
  date: string;
  value: number;
}

// ========================================
// API RESPONSE TYPES
// ========================================
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// AUTH TYPES
// ========================================
export interface IAuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

// ========================================
// NOTIFICATION TYPES
// ========================================
export interface INotification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: Date;
}
