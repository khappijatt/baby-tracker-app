import { pgTable, text, integer, timestamp, boolean, decimal, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const coerceDate = z.coerce.date();
const coerceDateOptional = z.coerce.date().optional().nullable();

// Children profiles table
export const children = pgTable("children", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid"),
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChildSchema = createInsertSchema(children).extend({
  dateOfBirth: coerceDate,
  createdAt: coerceDateOptional,
  updatedAt: coerceDateOptional,
});
export const selectChildSchema = createSelectSchema(children);

// Feeding logs table
export const feedingLogs = pgTable("feeding_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  type: text("type").notNull(),
  amount: text("amount"),
  duration: integer("duration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedingLogSchema = createInsertSchema(feedingLogs).extend({
  timestamp: coerceDate,
  createdAt: coerceDateOptional,
});
export const selectFeedingLogSchema = createSelectSchema(feedingLogs);

// Diaper changes table
export const diaperChanges = pgTable("diaper_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  type: text("type").notNull(),
  consistency: text("consistency"),
  color: text("color"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiaperChangeSchema = createInsertSchema(diaperChanges).extend({
  timestamp: coerceDate,
  createdAt: coerceDateOptional,
});
export const selectDiaperChangeSchema = createSelectSchema(diaperChanges);

// Sleep logs table
export const sleepLogs = pgTable("sleep_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  sleepType: text("sleep_type"),
  quality: text("quality"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSleepLogSchema = createInsertSchema(sleepLogs).extend({
  startTime: coerceDate,
  endTime: coerceDateOptional,
  createdAt: coerceDateOptional,
});
export const selectSleepLogSchema = createSelectSchema(sleepLogs);

// Growth measurements table
export const growthMeasurements = pgTable("growth_measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  measurementDate: timestamp("measurement_date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  headCircumference: decimal("head_circumference", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGrowthMeasurementSchema = createInsertSchema(growthMeasurements).extend({
  measurementDate: coerceDate,
  createdAt: coerceDateOptional,
});
export const selectGrowthMeasurementSchema = createSelectSchema(growthMeasurements);

// Milestones table
export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ageRange: text("age_range").notNull(),
  category: text("category").notNull(),
  achieved: boolean("achieved").default(false).notNull(),
  achievedDate: timestamp("achieved_date"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).extend({
  achievedDate: coerceDateOptional,
  createdAt: coerceDateOptional,
});
export const selectMilestoneSchema = createSelectSchema(milestones);

// Doctor appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  doctorName: text("doctor_name"),
  appointmentType: text("appointment_type"),
  location: text("location"),
  notes: text("notes"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).extend({
  appointmentDate: coerceDate,
  createdAt: coerceDateOptional,
});
export const selectAppointmentSchema = createSelectSchema(appointments);

// Vaccinations table
export const vaccinations = pgTable("vaccinations", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  vaccineName: text("vaccine_name").notNull(),
  scheduledAge: text("scheduled_age"),
  administeredDate: timestamp("administered_date"),
  dueDate: timestamp("due_date"),
  location: text("location"),
  batchNumber: text("batch_number"),
  reactions: text("reactions"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).extend({
  administeredDate: coerceDateOptional,
  dueDate: coerceDateOptional,
  createdAt: coerceDateOptional,
});
export const selectVaccinationSchema = createSelectSchema(vaccinations);

// Medicine logs table
export const medicineLogs = pgTable("medicine_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  medicineName: text("medicine_name").notNull(),
  dosage: text("dosage").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  frequency: text("frequency"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicineLogSchema = createInsertSchema(medicineLogs).extend({
  timestamp: coerceDate,
  startDate: coerceDateOptional,
  endDate: coerceDateOptional,
  createdAt: coerceDateOptional,
});
export const selectMedicineLogSchema = createSelectSchema(medicineLogs);

// Photo diary table
export const photoDiary = pgTable("photo_diary", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  dateTaken: timestamp("date_taken").notNull(),
  ageAtPhoto: text("age_at_photo"),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoDiarySchema = createInsertSchema(photoDiary).extend({
  dateTaken: coerceDate,
  createdAt: coerceDateOptional,
});
export const selectPhotoDiarySchema = createSelectSchema(photoDiary);

// Feed schedules table
export const feedSchedules = pgTable("feed_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  intervalMinutes: integer("interval_minutes").notNull().default(180), // default every 3h
  reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeedScheduleSchema = createInsertSchema(feedSchedules).extend({
  createdAt: coerceDateOptional,
  updatedAt: coerceDateOptional,
});
export const selectFeedScheduleSchema = createSelectSchema(feedSchedules);

// Educational resources table
export const educationalResources = pgTable("educational_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ageRange: text("age_range").notNull(),
  contentType: text("content_type").notNull(),
  content: text("content"),
  externalUrl: text("external_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEducationalResourceSchema = createInsertSchema(educationalResources).extend({
  createdAt: coerceDateOptional,
});
export const selectEducationalResourceSchema = createSelectSchema(educationalResources);
