const { PrismaClient } = require('@prisma/client');
const { SINGLE_CONCERT_ID } = require('../src/config/constants');
const prisma = new PrismaClient();

async function seed() {
  // Delete existing concert if it exists
  await prisma.concert.deleteMany({});
  
  const concert = await prisma.concert.create({
    data: {
      id: SINGLE_CONCERT_ID,
      imageUrl: 'https://res.cloudinary.com/do8kgobvd/image/upload/v1770058181/d3dml4ifhwdiujdhwh6n.jpg',
      name: 'Hukum World Tour Bengaluru',
      date: new Date('2025-12-20T20:00:00Z'),     // Example ISO date
      venue: 'Terraform Arena, Yelahanka',
      gatesOpenTime: new Date('2025-12-20T17:00:00Z'),  // Gates open 2 hours before
      about: 'From a musical prodigy to one among the most sought-after composers in South Indian cinema, Anirudh Ravichander has come a long way since his sensational debut in the Kollywood romantic-psychological thriller 3 (2012).',
      languages: 'Tamil, Telugu, Hindi',
      organizedBy: 'KVN Productions',
      totalSeats: 10000,  // Will be overwritten by sum below
      availableSeats: 10000,  // Will be overwritten
    },
  });

  // Create categories (sum to totalSeats)
  const categories = [
    { name: 'fanpit', price: 200.0, totalSeats: 1000, availableSeats: 1000 },
    { name: 'platinum', price: 150.0, totalSeats: 2000, availableSeats: 2000 },
    { name: 'gold', price: 100.0, totalSeats: 3000, availableSeats: 3000 },
    { name: 'silver', price: 50.0, totalSeats: 4000, availableSeats: 4000 },
  ];

  let totalSeatsSum = 0;
  let availableSeatsSum = 0;

  for (const cat of categories) {
    await prisma.ticketCategory.create({
      data: {
        ...cat,
        concertId: concert.id,
      },
    });
    totalSeatsSum += cat.totalSeats;
    availableSeatsSum += cat.availableSeats;
  }

  // Sync sums to concert
  await prisma.concert.update({
    where: { id: concert.id },
    data: {
      totalSeats: totalSeatsSum,
      availableSeats: availableSeatsSum,
    },
  });

  console.log('Seeded concert with categories');
}

seed().finally(() => prisma.$disconnect());