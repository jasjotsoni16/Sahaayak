// One-off: give users who have a city but no coordinates a real location.
// Usage: npm run backfill-locations            (applies the changes)
//        npm run backfill-locations -- --dry-run (only prints what would change)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Model/User');
const { resolveLocation } = require('../services/geocoding');

const dryRun = process.argv.includes('--dry-run');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({
    city: { $exists: true, $ne: '' },
    $or: [{ location: { $exists: false } }, { 'location.coordinates.0': { $exists: false } }],
  });
  console.log(`${users.length} user(s) have a city but no coordinates${dryRun ? ' (dry run)' : ''}`);

  let updated = 0;
  for (const user of users) {
    const { city, location } = await resolveLocation({ city: user.city }); // rate-limited by the service
    if (!location) { console.log(`  - ${user._id} "${user.city}": not found, left unchanged`); continue; }
    console.log(`  - ${user._id} "${user.city}" -> ${city} [${location.coordinates.join(', ')}]`);
    if (!dryRun) { user.city = city; user.location = location; await user.save(); }
    updated += 1;
  }
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${updated} user(s).`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
