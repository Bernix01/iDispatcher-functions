import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

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
  async (data: { uid: string; duid: string; action: string, operationId:string }, context) => {
    const { duid, action, uid, operationId } = data;
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
      operationId,
      when: new Date()
    };
    console.info(reportData)
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
  const f = await db
    .collection("formulas")
    .doc(dd.formula)
    .get();
  const ff = f.data();
  return { device: { ...dd, id: deviceUID }, formula: ff };
});

export const doAuth = functions.https.onCall(async (data, context) => {
  const deviceUID = data.duid;
  const userUID: string = data.uid;
  if (!deviceUID || !userUID) {
    return { succces: false, user: null };
  }
  const u = await db
    .collection("users")
    .doc(userUID.replace("\n", ""))
    .get();
  const d = await db
    .collection("devices")
    .doc(deviceUID)
    .get();
  const dd = d.data();
  const user = u.data();
  if (!user || !dd) {
    return { success: false, user: null };
  }

  if (!user.active || user.org !== dd.org) {
    return { success: false, user: null };
  }

  return { success: user !== undefined, user: { ...user, id: userUID.replace("\n", "") } };
});
