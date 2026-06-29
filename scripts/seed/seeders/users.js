const User = require('../../../src/models/User');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Edusn@12345';

const seedUsers = async () => {
  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@edusn.online',
      full_name: 'EDUSN Super Admin',
      role: 'super_admin',
      status: 'active',
    },
    {
      username: 'admin',
      email: 'admin@edusn.online',
      full_name: 'EDUSN Admin',
      role: 'admin',
      status: 'active',
    },
    {
      username: 'staff',
      email: 'staff@edusn.online',
      full_name: 'EDUSN Staff',
      role: 'staff',
      status: 'active',
      department: 'Support',
      position: 'Staff',
    },
    {
      username: 'viewer',
      email: 'viewer@edusn.online',
      full_name: 'EDUSN Viewer',
      role: 'viewer',
      status: 'active',
    },
  ];

  for (const entry of users) {
    await User.create({
      ...entry,
      password: DEFAULT_PASSWORD,
    });
  }

  console.log(`  users: ${users.length} (password: ${DEFAULT_PASSWORD})`);
};

module.exports = seedUsers;
