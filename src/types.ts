export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role: "student" | "tutor";
  subjects?: string[];
  grade?: string;
  maxFee?: number;
  rate?: number;
  exp?: string;
  bio?: string;
  qual?: string;
  online?: boolean;
  avatar?: string;
  color?: string;
  rating?: number;
  reviewsCount?: number;
  walletBalance?: number;
  totalEarned?: number;
  withdrawn?: number;
  totalSpent?: number;
}

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
  subject: string;
  date: string;
  time: string;
  mode: "Online" | "Offline";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  rate: number;
  msg?: string;
  createdAt?: string;
}

export interface Chat {
  id: string; // usually combination, e.g. studentId + "_" + tutorId
  studentId: string;
  tutorId: string;
  lastMsg: string;
  updatedAt: number;
  studentName?: string;
  tutorName?: string;
  studentColor?: string;
  tutorColor?: string;
  studentAvatar?: string;
  tutorAvatar?: string;
  studentUnread?: number;
  tutorUnread?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string; // readable e.g. "10:15 AM"
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: "payment" | "earn" | "withdraw" | "add";
  desc: string;
  amount: number;
  date: string;
}
