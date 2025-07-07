import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any; // หรือกำหนด type ที่ชัดเจน เช่น { id: string; email: string }
    }
  }
}
