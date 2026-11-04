// Replaces the old made-up job listings with a small set of realistic gig jobs.
//
//   npm run seed-jobs                      clean up fake jobs, then add the demo employers + gig jobs
//   npm run seed-jobs -- --dry-run         show what would change, change nothing
//   npm run seed-jobs -- --remove-demo     delete the demo employers and their jobs again
//
// "Fake" means a job whose employer_id does not belong to any user (the old random seed created
// 1,500 of those). Jobs posted by real accounts are never touched.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../Model/User');
const Employer = require('../Model/Employer');
const Job = require('../Model/Job');
const Skill = require('../Model/Skill');
const { DEMO_PASSWORD, EMPLOYERS, JOBS } = require('./data/gigJobs');

const dryRun = process.argv.includes('--dry-run');
const removeDemo = process.argv.includes('--remove-demo');
const say = (msg) => console.log(`${dryRun ? '[dry run] ' : ''}${msg}`);

// Delete everything in any collection that points at the given jobs (applications, assessments, ...).
const deleteJobReferences = async (db, jobIds) => {
  if (jobIds.length === 0) return;
  for (const { name } of await db.listCollections().toArray()) {
    if (name === 'job') continue;
    const filter = { job_id: { $in: jobIds } };
    const n = await db.collection(name).countDocuments(filter);
    if (!n) continue;
    say(`  ${dryRun ? 'would remove' : 'removing'} ${n} record(s) in "${name}" that pointed at removed jobs`);
    if (!dryRun) await db.collection(name).deleteMany(filter);
  }
};

const demoUsers = () => User.find({ phone_number: { $in: EMPLOYERS.map((e) => e.phone_number) } });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  if (removeDemo) {
    const users = await demoUsers();
    const ids = users.map((u) => u._id);
    const jobIds = (await Job.find({ employer_id: { $in: ids } }).select('_id')).map((j) => j._id);
    say(`${jobIds.length} demo job(s), ${users.length} demo employer(s) to remove`);
    await deleteJobReferences(db, jobIds);
    if (!dryRun) {
      await Job.deleteMany({ _id: { $in: jobIds } });
      await Employer.deleteMany({ user_id: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
    }
    say('Demo data removed.');
    return mongoose.disconnect();
  }

  // 1. Remove the fake jobs (employer does not exist) and everything attached to them.
  const userIds = new Set((await User.find({}).select('_id')).map((u) => String(u._id)));
  const fake = (await Job.find({}).select('employer_id')).filter((j) => !userIds.has(String(j.employer_id)));
  const fakeIds = fake.map((j) => j._id);
  say(`${fakeIds.length} fake job(s) with a missing employer to remove`);
  await deleteJobReferences(db, fakeIds);
  if (!dryRun && fakeIds.length) await Job.deleteMany({ _id: { $in: fakeIds } });

  // 2. Demo employers (created once; re-running reuses them).
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const employerIdByKey = {};
  for (const e of EMPLOYERS) {
    let user = await User.findOne({ phone_number: e.phone_number });
    if (!user) {
      say(`creating demo employer "${e.company_name}" (phone ${e.phone_number})`);
      if (!dryRun) {
        user = await User.create({ name: e.name, phone_number: e.phone_number, password: passwordHash, role: 'provider', city: e.city, language: 'en' });
        await Employer.create({ user_id: user._id, company_name: e.company_name, company_type: e.company_type, gstin_number: e.gstin_number });
      }
    }
    employerIdByKey[e.key] = user ? user._id : null;
  }

  // 3. Gig jobs (replace the demo employers' previous listings so re-running never duplicates).
  const skillByName = new Map((await Skill.find({})).map((s) => [s.name, s._id]));
  const missing = [...new Set(JOBS.flatMap((j) => j.skills))].filter((n) => !skillByName.has(n));
  if (missing.length) throw new Error(`These skills are not in the database yet (run seedSkills first): ${missing.join(', ')}`);

  const demoEmployerIds = Object.values(employerIdByKey).filter(Boolean);
  if (!dryRun) {
    const oldDemoJobs = (await Job.find({ employer_id: { $in: demoEmployerIds } }).select('_id')).map((j) => j._id);
    await deleteJobReferences(db, oldDemoJobs);
    await Job.deleteMany({ _id: { $in: oldDemoJobs } });
    await Job.insertMany(JOBS.map((j) => ({
      employer_id: employerIdByKey[j.employer], title: j.title, description: j.description, responsibilities: j.responsibilities,
      skills_required: j.skills.map((n) => skillByName.get(n)), experience_required: j.experience_required, assessment_required: false,
      number_of_openings: j.number_of_openings, job_type: j.job_type, duration: j.duration, wage_type: j.wage_type,
      salary_min: j.salary_min, salary_max: j.salary_max, negotiable: j.negotiable, leaves_allowed: 0,
      city: j.city, location: { type: 'Point', coordinates: j.coordinates },
    })));
  }
  say(`${dryRun ? 'would add' : 'added'} ${JOBS.length} gig job(s) across ${EMPLOYERS.length} demo employers`);
  say(`demo employer login: phone 9000000101 to 9000000107, password ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
