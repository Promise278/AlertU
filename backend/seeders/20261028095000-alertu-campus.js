'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const id = '00000000-0000-4000-8000-000000000001';
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM campuses WHERE id = :id LIMIT 1',
      {
        replacements: { id },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length === 0) {
      await queryInterface.bulkInsert('campuses', [
        {
          id,
          name: 'AlertU Campus',
          slug: 'alertu-campus',
          timezone: 'UTC',
          centerLatitude: 6.5244,
          centerLongitude: 3.3792,
          boundary: JSON.stringify({
            type: 'Point',
            coordinates: [3.3792, 6.5244],
          }),
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('campuses', {
      id: '00000000-0000-4000-8000-000000000001',
    });
  },
};
