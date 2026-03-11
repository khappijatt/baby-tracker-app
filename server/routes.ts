import type { Express } from "express";
  import { db } from "./db";
  import { 
    children, insertChildSchema,
    feedingLogs, insertFeedingLogSchema,
    diaperChanges, insertDiaperChangeSchema,
    sleepLogs, insertSleepLogSchema,
    growthMeasurements, insertGrowthMeasurementSchema,
    milestones, insertMilestoneSchema,
    appointments, insertAppointmentSchema,
    vaccinations, insertVaccinationSchema,
    medicineLogs, insertMedicineLogSchema,
    photoDiary, insertPhotoDiarySchema,
    feedSchedules, insertFeedScheduleSchema,
    educationalResources
  } from "@shared/schema";
  import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

  export function registerRoutes(app: Express): Express {
    
    // ============ CHILDREN ROUTES ============
    
    // Get all children (scoped to Firebase UID if provided)
    app.get("/api/children", async (req, res) => {
      try {
        const firebaseUid = req.headers["x-firebase-uid"] as string | undefined;
        const allChildren = firebaseUid
          ? await db.select().from(children).where(eq(children.firebaseUid, firebaseUid)).orderBy(desc(children.createdAt))
          : await db.select().from(children).where(sql`${children.firebaseUid} IS NULL`).orderBy(desc(children.createdAt));
        res.json(allChildren);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get single child
    app.get("/api/children/:id", async (req, res) => {
      try {
        const child = await db.select().from(children).where(eq(children.id, req.params.id));
        if (child.length === 0) {
          return res.status(404).json({ error: "Child not found" });
        }
        res.json(child[0]);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create child (bind to Firebase UID if provided)
    app.post("/api/children", async (req, res) => {
      try {
        const firebaseUid = req.headers["x-firebase-uid"] as string | undefined;
        const validatedData = insertChildSchema.parse({
          ...req.body,
          firebaseUid: firebaseUid ?? null,
        });
        const newChild = await db.insert(children).values(validatedData).returning();
        res.status(201).json(newChild[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Update child
    app.put("/api/children/:id", async (req, res) => {
      try {
        const body = { ...req.body };
        if (body.dateOfBirth) body.dateOfBirth = new Date(body.dateOfBirth);
        const updated = await db
          .update(children)
          .set({ ...body, updatedAt: new Date() })
          .where(eq(children.id, req.params.id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Child not found" });
        }
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // Delete child
    app.delete("/api/children/:id", async (req, res) => {
      try {
        await db.delete(children).where(eq(children.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ FEEDING LOGS ROUTES ============
    
    app.get("/api/children/:childId/feeding", async (req, res) => {
      try {
        const logs = await db
          .select()
          .from(feedingLogs)
          .where(eq(feedingLogs.childId, req.params.childId))
          .orderBy(desc(feedingLogs.timestamp));
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/feeding", async (req, res) => {
      try {
        const validatedData = insertFeedingLogSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newLog = await db.insert(feedingLogs).values(validatedData).returning();
        res.status(201).json(newLog[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/feeding/:id", async (req, res) => {
      try {
        await db.delete(feedingLogs).where(eq(feedingLogs.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ DIAPER CHANGES ROUTES ============
    
    app.get("/api/children/:childId/diaper", async (req, res) => {
      try {
        const logs = await db
          .select()
          .from(diaperChanges)
          .where(eq(diaperChanges.childId, req.params.childId))
          .orderBy(desc(diaperChanges.timestamp));
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/diaper", async (req, res) => {
      try {
        const validatedData = insertDiaperChangeSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newLog = await db.insert(diaperChanges).values(validatedData).returning();
        res.status(201).json(newLog[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/diaper/:id", async (req, res) => {
      try {
        await db.delete(diaperChanges).where(eq(diaperChanges.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ SLEEP LOGS ROUTES ============
    
    app.get("/api/children/:childId/sleep", async (req, res) => {
      try {
        const logs = await db
          .select()
          .from(sleepLogs)
          .where(eq(sleepLogs.childId, req.params.childId))
          .orderBy(desc(sleepLogs.startTime));
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/sleep", async (req, res) => {
      try {
        const validatedData = insertSleepLogSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newLog = await db.insert(sleepLogs).values(validatedData).returning();
        res.status(201).json(newLog[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/sleep/:id", async (req, res) => {
      try {
        // Calculate duration if endTime is provided
        let updateData = { ...req.body };
        if (req.body.endTime && req.body.startTime) {
          const start = new Date(req.body.startTime).getTime();
          const end = new Date(req.body.endTime).getTime();
          updateData.duration = Math.floor((end - start) / 60000); // minutes
        }
        
        const updated = await db
          .update(sleepLogs)
          .set(updateData)
          .where(eq(sleepLogs.id, req.params.id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Sleep log not found" });
        }
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/sleep/:id", async (req, res) => {
      try {
        await db.delete(sleepLogs).where(eq(sleepLogs.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ GROWTH MEASUREMENTS ROUTES ============
    
    app.get("/api/children/:childId/growth", async (req, res) => {
      try {
        const measurements = await db
          .select()
          .from(growthMeasurements)
          .where(eq(growthMeasurements.childId, req.params.childId))
          .orderBy(desc(growthMeasurements.measurementDate));
        res.json(measurements);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/growth", async (req, res) => {
      try {
        const validatedData = insertGrowthMeasurementSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newMeasurement = await db.insert(growthMeasurements).values(validatedData).returning();
        res.status(201).json(newMeasurement[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/growth/:id", async (req, res) => {
      try {
        await db.delete(growthMeasurements).where(eq(growthMeasurements.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ MILESTONES ROUTES ============
    
    app.get("/api/children/:childId/milestones", async (req, res) => {
      try {
        const allMilestones = await db
          .select()
          .from(milestones)
          .where(eq(milestones.childId, req.params.childId))
          .orderBy(milestones.ageRange, desc(milestones.createdAt));
        res.json(allMilestones);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/milestones", async (req, res) => {
      try {
        const validatedData = insertMilestoneSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newMilestone = await db.insert(milestones).values(validatedData).returning();
        res.status(201).json(newMilestone[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/milestones/:id", async (req, res) => {
      try {
        const updated = await db
          .update(milestones)
          .set(req.body)
          .where(eq(milestones.id, req.params.id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Milestone not found" });
        }
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/milestones/:id", async (req, res) => {
      try {
        await db.delete(milestones).where(eq(milestones.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ APPOINTMENTS ROUTES ============
    
    app.get("/api/children/:childId/appointments", async (req, res) => {
      try {
        const allAppointments = await db
          .select()
          .from(appointments)
          .where(eq(appointments.childId, req.params.childId))
          .orderBy(desc(appointments.appointmentDate));
        res.json(allAppointments);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/appointments", async (req, res) => {
      try {
        const validatedData = insertAppointmentSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newAppointment = await db.insert(appointments).values(validatedData).returning();
        res.status(201).json(newAppointment[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/appointments/:id", async (req, res) => {
      try {
        const updated = await db
          .update(appointments)
          .set(req.body)
          .where(eq(appointments.id, req.params.id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Appointment not found" });
        }
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/appointments/:id", async (req, res) => {
      try {
        await db.delete(appointments).where(eq(appointments.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ VACCINATIONS ROUTES ============
    
    app.get("/api/children/:childId/vaccinations", async (req, res) => {
      try {
        const allVaccinations = await db
          .select()
          .from(vaccinations)
          .where(eq(vaccinations.childId, req.params.childId))
          .orderBy(vaccinations.dueDate);
        res.json(allVaccinations);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/vaccinations", async (req, res) => {
      try {
        const validatedData = insertVaccinationSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newVaccination = await db.insert(vaccinations).values(validatedData).returning();
        res.status(201).json(newVaccination[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/vaccinations/:id", async (req, res) => {
      try {
        const updated = await db
          .update(vaccinations)
          .set(req.body)
          .where(eq(vaccinations.id, req.params.id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Vaccination not found" });
        }
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/vaccinations/:id", async (req, res) => {
      try {
        await db.delete(vaccinations).where(eq(vaccinations.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ MEDICINE LOGS ROUTES ============
    
    app.get("/api/children/:childId/medicine", async (req, res) => {
      try {
        const logs = await db
          .select()
          .from(medicineLogs)
          .where(eq(medicineLogs.childId, req.params.childId))
          .orderBy(desc(medicineLogs.timestamp));
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/medicine", async (req, res) => {
      try {
        const validatedData = insertMedicineLogSchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newLog = await db.insert(medicineLogs).values(validatedData).returning();
        res.status(201).json(newLog[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/medicine/:id", async (req, res) => {
      try {
        await db.delete(medicineLogs).where(eq(medicineLogs.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ PHOTO DIARY ROUTES ============
    
    app.get("/api/children/:childId/photos", async (req, res) => {
      try {
        const photos = await db
          .select()
          .from(photoDiary)
          .where(eq(photoDiary.childId, req.params.childId))
          .orderBy(desc(photoDiary.dateTaken));
        res.json(photos);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/photos", async (req, res) => {
      try {
        const validatedData = insertPhotoDiarySchema.parse({
          ...req.body,
          childId: req.params.childId
        });
        const newPhoto = await db.insert(photoDiary).values(validatedData).returning();
        res.status(201).json(newPhoto[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/photos/:id", async (req, res) => {
      try {
        await db.delete(photoDiary).where(eq(photoDiary.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ EDUCATIONAL RESOURCES ROUTES ============
    
    app.get("/api/resources", async (req, res) => {
      try {
        const { category, ageRange } = req.query;
        let query = db.select().from(educationalResources);
        
        const conditions = [];
        if (category) conditions.push(eq(educationalResources.category, category as string));
        if (ageRange) {
          conditions.push(
            sql`${educationalResources.ageRange} = ${ageRange} OR ${educationalResources.ageRange} = 'all'`
          );
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        
        const resources = await query.orderBy(educationalResources.category, educationalResources.title);
        res.json(resources);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ FEED SCHEDULE ROUTES ============

    app.get("/api/children/:childId/schedule", async (req, res) => {
      try {
        const schedules = await db.select().from(feedSchedules)
          .where(eq(feedSchedules.childId, req.params.childId))
          .orderBy(desc(feedSchedules.createdAt));
        res.json(schedules);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/children/:childId/schedule", async (req, res) => {
      try {
        const data = insertFeedScheduleSchema.parse({ ...req.body, childId: req.params.childId });
        const newSchedule = await db.insert(feedSchedules).values(data).returning();
        res.status(201).json(newSchedule[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.put("/api/schedule/:id", async (req, res) => {
      try {
        const updated = await db.update(feedSchedules)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(feedSchedules.id, req.params.id))
          .returning();
        if (updated.length === 0) return res.status(404).json({ error: "Schedule not found" });
        res.json(updated[0]);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    app.delete("/api/schedule/:id", async (req, res) => {
      try {
        await db.delete(feedSchedules).where(eq(feedSchedules.id, req.params.id));
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ ANALYTICS ROUTES ============

    app.get("/api/children/:childId/analytics", async (req, res) => {
      try {
        const { type = 'feeding', period = 'weekly' } = req.query;
        const childId = req.params.childId;
        const now = new Date();
        let startDate: Date;

        if (period === 'daily') {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'monthly') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
        } else {
          // weekly
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
        }

        let data: any[] = [];

        if (type === 'feeding') {
          data = await db.select().from(feedingLogs)
            .where(and(eq(feedingLogs.childId, childId), gte(feedingLogs.timestamp, startDate)))
            .orderBy(feedingLogs.timestamp);
        } else if (type === 'sleep') {
          data = await db.select().from(sleepLogs)
            .where(and(eq(sleepLogs.childId, childId), gte(sleepLogs.startTime, startDate)))
            .orderBy(sleepLogs.startTime);
        } else if (type === 'diaper') {
          data = await db.select().from(diaperChanges)
            .where(and(eq(diaperChanges.childId, childId), gte(diaperChanges.timestamp, startDate)))
            .orderBy(diaperChanges.timestamp);
        } else if (type === 'medicine') {
          data = await db.select().from(medicineLogs)
            .where(and(eq(medicineLogs.childId, childId), gte(medicineLogs.timestamp, startDate)))
            .orderBy(medicineLogs.timestamp);
        }

        res.json({ type, period, startDate, data });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // ============ DASHBOARD/SUMMARY ROUTES ============
    
    app.get("/api/children/:childId/dashboard", async (req, res) => {
      try {
        const childId = req.params.childId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get today's activities
        const [todayFeeding, todayDiaper, todaySleep, todayMedicine] = await Promise.all([
          db.select().from(feedingLogs)
            .where(and(
              eq(feedingLogs.childId, childId),
              gte(feedingLogs.timestamp, today)
            ))
            .orderBy(desc(feedingLogs.timestamp)),
          
          db.select().from(diaperChanges)
            .where(and(
              eq(diaperChanges.childId, childId),
              gte(diaperChanges.timestamp, today)
            ))
            .orderBy(desc(diaperChanges.timestamp)),
          
          db.select().from(sleepLogs)
            .where(and(
              eq(sleepLogs.childId, childId),
              gte(sleepLogs.startTime, today)
            ))
            .orderBy(desc(sleepLogs.startTime)),
          
          db.select().from(medicineLogs)
            .where(and(
              eq(medicineLogs.childId, childId),
              gte(medicineLogs.timestamp, today)
            ))
            .orderBy(desc(medicineLogs.timestamp))
        ]);
        
        // Get upcoming appointments (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const upcomingAppointments = await db
          .select()
          .from(appointments)
          .where(and(
            eq(appointments.childId, childId),
            gte(appointments.appointmentDate, today),
            lte(appointments.appointmentDate, thirtyDaysFromNow),
            eq(appointments.completed, false)
          ))
          .orderBy(appointments.appointmentDate);
        
        // Get upcoming vaccinations
        const upcomingVaccinations = await db
          .select()
          .from(vaccinations)
          .where(and(
            eq(vaccinations.childId, childId),
            eq(vaccinations.completed, false)
          ))
          .orderBy(vaccinations.dueDate);
        
        res.json({
          todayFeeding,
          todayDiaper,
          todaySleep,
          todayMedicine,
          upcomingAppointments,
          upcomingVaccinations
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
    return app;
  }