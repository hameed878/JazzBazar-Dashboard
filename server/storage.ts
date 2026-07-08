import { db } from "./db";
import { users, withdrawals, type User, type Withdrawal } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface CreateUserInput {
  name: string;
  phone: string;
  password: string;
  pkg: string;
  paymentMethod: string;
  transactionImage: string;
}

export const storage = {
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  },

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        phone: input.phone,
        password: input.password,
        pkg: input.pkg,
        paymentMethod: input.paymentMethod,
        transactionImage: input.transactionImage,
      })
      .returning();
    return user;
  },

  async getPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.status, "pending"));
  },

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  },

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async updateAdsWatched(id: number, adsWatchedToday: number, lastAdDate: string, newBalance: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ adsWatchedToday, lastAdDate, balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async deductBalance(id: number, newBalance: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async createWithdrawal(userId: number, amount: string): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({ userId, amount })
      .returning();
    return withdrawal;
  },

  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).where(eq(withdrawals.userId, userId));
  },

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return db.select().from(withdrawals);
  },

  async updateWithdrawalStatus(id: number, status: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .update(withdrawals)
      .set({ status })
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  },
};
