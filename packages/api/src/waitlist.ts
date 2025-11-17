import { Request, Response } from 'express';

interface WaitlistEntry {
  email: string;
  timestamp: number;
}

// In-memory storage (in production, use a database)
const waitlist: WaitlistEntry[] = [];

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Add email to waitlist
 */
export async function addToWaitlist(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  // Validate email presence
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  // Normalize email to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Check for duplicates
  const exists = waitlist.some((entry) => entry.email === normalizedEmail);
  if (exists) {
    res.status(409).json({ error: 'Email already on waitlist' });
    return;
  }

  // Add to waitlist
  waitlist.push({
    email: normalizedEmail,
    timestamp: Date.now(),
  });

  res.status(201).json({
    success: true,
    message: 'Added to waitlist successfully',
  });
}

/**
 * Get waitlist statistics
 */
export function getWaitlistStats(): { total: number; emails: WaitlistEntry[] } {
  return {
    total: waitlist.length,
    emails: [...waitlist].sort((a, b) => a.timestamp - b.timestamp),
  };
}
