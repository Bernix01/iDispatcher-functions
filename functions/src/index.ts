import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const deactivateUser = functions.auth.user().onDelete(async user => {
  const usersRef = db.collection("users");
  const queryRef = usersRef.where("uid", "==", user.uid).limit(1);
  const userSnapshot = await queryRef.get();
  const userData = userSnapshot.docs[0].data();
  await db
    .collection("users")
    .doc(userData.id)
    .update({ active: false });
});

export const report = functions.https.onRequest((req, res) => {
  res.send("reported!");
});

export const device = functions.https.onCall(async (data, context) => {
  const deviceUID = data.duid;
  const d = await db
    .collection("devices")
    .doc(deviceUID)
    .get();
  const dd = d.data();
  console.info(dd);
  const f = await db
    .collection("formulas")
    .doc(dd.formula)
    .get();
  const ff = f.data();
  return { device: dd, formula: ff };
});
