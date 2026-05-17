const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkSchema() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
  });

  try {
    const [bookings] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'reservation' AND table_name = 'bookings'");
    console.log('--- reservation.bookings ---');
    console.table(bookings);

    const [users] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'account' AND table_name = 'users'");
    console.log('--- account.users ---');
    console.table(users);

    const [locations] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'parking_lot' AND table_name = 'locations'");
    console.log('--- parking_lot.locations ---');
    console.table(locations);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
