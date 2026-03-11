// Seed data for testing the parenting app
  // Run this to add sample children and tracking data

  async function seedDatabase() {
    try {
      // Create a sample child
      const childResponse = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Emma',
          dateOfBirth: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
          gender: 'female',
        }),
      });

      if (!childResponse.ok) {
        throw new Error('Failed to create child');
      }

      const child = await childResponse.json();
      console.log('Created child:', child);

      // Add sample feeding logs
      const feedingTypes = ['breast', 'bottle', 'solid'];
      for (let i = 0; i < 5; i++) {
        await fetch(`/api/children/${child.id}/feeding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date(Date.now() - i * 3 * 60 * 60 * 1000).toISOString(),
            type: feedingTypes[i % 3],
            amount: '120ml',
            notes: i === 0 ? 'Fed well' : undefined,
          }),
        });
      }

      // Add sample diaper changes
      const diaperTypes = ['pee', 'poop', 'both'];
      for (let i = 0; i < 4; i++) {
        await fetch(`/api/children/${child.id}/diaper`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
            type: diaperTypes[i % 3],
            consistency: 'normal',
          }),
        });
      }

      // Add sample sleep logs
      for (let i = 0; i < 3; i++) {
        const startTime = new Date(Date.now() - (i + 1) * 8 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 120 * 60 * 1000); // 2 hours
        
        await fetch(`/api/children/${child.id}/sleep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: 120,
            sleepType: i === 0 ? 'night' : 'nap',
            quality: 'good',
          }),
        });
      }

      // Add sample growth measurements
      await fetch(`/api/children/${child.id}/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementDate: new Date().toISOString(),
          weight: '10.5',
          height: '75',
          headCircumference: '46',
        }),
      });

      // Add sample milestones
      const milestones = [
        {
          title: 'First Smile',
          description: 'Smiled for the first time',
          ageRange: '0-12mo',
          category: 'social',
          achieved: true,
          achievedDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          title: 'Rolling Over',
          description: 'Can roll from back to tummy',
          ageRange: '0-12mo',
          category: 'physical',
          achieved: true,
          achievedDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          title: 'First Words',
          description: 'Said first word',
          ageRange: '0-12mo',
          category: 'language',
          achieved: false,
        },
        {
          title: 'Walking',
          description: 'Takes first steps independently',
          ageRange: '1-2yr',
          category: 'physical',
          achieved: false,
        },
      ];

      for (const milestone of milestones) {
        await fetch(`/api/children/${child.id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestone),
        });
      }

      // Add sample appointments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await fetch(`/api/children/${child.id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: futureDate.toISOString(),
          doctorName: 'Dr. Smith',
          appointmentType: 'checkup',
          location: 'Pediatric Clinic',
          notes: '12-month checkup',
        }),
      });

      // Add sample vaccinations
      await fetch(`/api/children/${child.id}/vaccinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaccineName: 'MMR',
          scheduledAge: '12-15 months',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          completed: false,
        }),
      });

      console.log('✅ Database seeded successfully!');
      console.log('Sample child created with ID:', child.id);
      console.log('Added feeding logs, diaper changes, sleep logs, growth data, milestones, appointments, and vaccinations');

    } catch (error) {
      console.error('❌ Error seeding database:', error);
    }
  }

  // Export for use
  if (typeof window !== 'undefined') {
    (window as any).seedDatabase = seedDatabase;
  }

  export { seedDatabase };
  