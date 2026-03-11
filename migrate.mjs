import { drizzle } from 'drizzle-orm/node-postgres';
  import { migrate } from 'drizzle-orm/node-postgres/migrator';
  import pg from 'pg';
  import * as schema from './shared/schema.js';

  const { Pool } = pg;

  async function runMigration() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log('Running migrations...');
    
    try {
      // Create tables directly using SQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS children (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          date_of_birth TIMESTAMP NOT NULL,
          gender TEXT,
          photo_url TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS feeding_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          timestamp TIMESTAMP NOT NULL,
          type TEXT NOT NULL,
          amount TEXT,
          duration INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS diaper_changes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          timestamp TIMESTAMP NOT NULL,
          type TEXT NOT NULL,
          consistency TEXT,
          color TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sleep_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          duration INTEGER,
          sleep_type TEXT,
          quality TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS growth_measurements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          measurement_date TIMESTAMP NOT NULL,
          weight DECIMAL(5, 2),
          height DECIMAL(5, 2),
          head_circumference DECIMAL(5, 2),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS milestones (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          age_range TEXT NOT NULL,
          category TEXT NOT NULL,
          achieved BOOLEAN DEFAULT FALSE NOT NULL,
          achieved_date TIMESTAMP,
          photo_url TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          appointment_date TIMESTAMP NOT NULL,
          doctor_name TEXT,
          appointment_type TEXT,
          location TEXT,
          notes TEXT,
          completed BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vaccinations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          vaccine_name TEXT NOT NULL,
          scheduled_age TEXT,
          administered_date TIMESTAMP,
          due_date TIMESTAMP,
          location TEXT,
          batch_number TEXT,
          reactions TEXT,
          completed BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS medicine_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          medicine_name TEXT NOT NULL,
          dosage TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          frequency TEXT,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS photo_diary (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          photo_url TEXT NOT NULL,
          caption TEXT,
          date_taken TIMESTAMP NOT NULL,
          age_at_photo TEXT,
          tags JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS educational_resources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          age_range TEXT NOT NULL,
          content_type TEXT NOT NULL,
          content TEXT,
          external_url TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      console.log('✅ All tables created successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  runMigration().catch(console.error);
  