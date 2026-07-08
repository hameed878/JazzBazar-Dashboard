import { db } from "./db";
import { users, withdrawals, ads, settings, type User, type Withdrawal, type Ad } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateUserInput {
  name: string;
  phone: string;
  password: string;
  pkg: string;
  paymentMethod: string;
  transactionImage: string;
}

export interface AdminUserUpdate {
  name?: string;
  phone?: string;
  pkg?: string;
  status?: string;
  balance?: string;
  adsWatchedToday?: number;
  isBanned?: boolean;
  password?: string;
}

export interface CreateWithdrawalInput {
  userId: number;
  amount: string;
  method: string;
  accountNumber: string;
  accountName: string;
}

export interface AdInput {
  title: string;
  brand: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  active?: boolean;
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

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async updateAdsWatched(id: number, adsWatchedToday: number, lastAdDate: string, newBalance: string, totalAdsWatched: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ adsWatchedToday, lastAdDate, balance: newBalance, totalAdsWatched })
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

  async adminUpdateUser(id: number, patch: AdminUserUpdate): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async deleteUser(id: number): Promise<void> {
    await db.delete(withdrawals).where(eq(withdrawals.userId, id));
    await db.delete(users).where(eq(users.id, id));
  },

  async createWithdrawal(input: CreateWithdrawalInput): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values(input)
      .returning();
    return withdrawal;
  },

  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  },

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  },

  async updateWithdrawalStatus(id: number, status: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db
      .update(withdrawals)
      .set({ status })
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  },

  async getSetting(key: string): Promise<string | undefined> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row?.value;
  },

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  },

  async getAllAds(): Promise<Ad[]> {
    return db.select().from(ads).orderBy(desc(ads.createdAt));
  },

  async getActiveAds(): Promise<Ad[]> {
    return db.select().from(ads).where(eq(ads.active, true)).orderBy(desc(ads.createdAt));
  },

  async createAd(input: AdInput): Promise<Ad> {
    const [ad] = await db.insert(ads).values(input).returning();
    return ad;
  },

  async updateAd(id: number, patch: Partial<AdInput>): Promise<Ad | undefined> {
    const [ad] = await db.update(ads).set(patch).where(eq(ads.id, id)).returning();
    return ad;
  },

  async deleteAd(id: number): Promise<void> {
    await db.delete(ads).where(eq(ads.id, id));
  },
};
