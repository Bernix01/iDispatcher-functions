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

export const report = functions.https.onCall(
  async (data: { duid: string; action: string }, context) => {
    const { duid, action } = data;
    const uid = context.auth.uid;
    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();
    const user = userDoc.data();
    const deviceUID = duid;
    const dRef = await db.collection("devices").doc(deviceUID);
    await dRef.update({ last_signal: new Date() });
    const d = await dRef.get();
    const device = d.data();
    console.info(device);
    const f = await db
      .collection("formulas")
      .doc(device.formula)
      .get();
    const formula = f.data();
    const reportData = {
      user,
      device,
      formula,
      action: action,
      when: new Date()
    };
    await db.collection("reports").add(reportData);
    return true;
  }
);

export const fetchDevice = functions.https.onCall(async (data, context) => {
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
