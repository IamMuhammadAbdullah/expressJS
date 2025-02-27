var admin = require("firebase-admin");

var serviceAccount = require("./seviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://crudapp-b9302-default-rtdb.firebaseio.com/"
});

const db = admin.database();

module.exports = db;
