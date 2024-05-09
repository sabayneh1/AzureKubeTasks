// Connect to the admin database to create a new user with roles for both databases
db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: '1234',
  roles: [
    {
      role: 'dbOwner',
      db: 'userService',
    },
    {
      role: 'dbOwner',
      db: 'todoService',
    }
  ],
});

// Switch to the userService database and create an initial collection
db = db.getSiblingDB('userService');
db.createCollection('someInitialCollection');

// Switch to the todoService database and create an initial collection
db = db.getSiblingDB('todoService');
db.createCollection('someInitialCollection');
