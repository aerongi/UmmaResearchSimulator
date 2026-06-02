'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyAlI7rSlbR6S1n3WMiU3jCH10j5PgFsAjA",
  authDomain: "ummasimulatorstats.firebaseapp.com",
  projectId: "ummasimulatorstats",
  storageBucket: "ummasimulatorstats.firebasestorage.app",
  messagingSenderId: "689724661581",
  appId: "1:689724661581:web:d453b10e698a68bca6e104",
  measurementId: "G-8G6H71Q1L9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const inc = firebase.firestore.FieldValue.increment;

window.Stats = {
  async recordChoice(eventId, choiceId) {
    try {
      await db.collection('events').doc(eventId).set({
        counts: { [choiceId]: inc(1) }
      }, { merge: true });
    } catch (e) { console.warn('recordChoice', e); }
  },

  async fetchChoices(eventId) {
    try {
      const doc = await db.collection('events').doc(eventId).get();
      return doc.exists ? (doc.data().counts || {}) : {};
    } catch (e) { console.warn('fetchChoices', e); return {}; }
  },

  async recordEnding(d) {
    try {
      const batch = db.batch();
      batch.set(db.collection('endings').doc('childType'),    { [d.childType]: inc(1) },    { merge: true });
      batch.set(db.collection('endings').doc('initialMbti'),  { [d.initialMbti]: inc(1) },  { merge: true });
      batch.set(db.collection('endings').doc('finalMbti'),    { [d.finalMbti]: inc(1) },    { merge: true });
      const su = { _count: inc(1) };
      for (const k in d.finalStats) su[k] = inc(d.finalStats[k]);
      batch.set(db.collection('endings').doc('finalStatsSum'), su, { merge: true });
      await batch.commit();
    } catch (e) { console.warn('recordEnding', e); }
  },

// [테스트용] 캐릭터 생성 시 성별 + 초기 MBTI 기록
  async recordCreation(d) {
    try {
      const batch = db.batch();
      batch.set(db.collection('endings').doc('childType'),   { [d.childType]: inc(1) },   { merge: true });
      batch.set(db.collection('endings').doc('initialMbti'), { [d.initialMbti]: inc(1) }, { merge: true });
      await batch.commit();
    } catch (e) { console.warn('recordCreation', e); }
  },

  async fetchAggregates() {
    try {
      const [child, initMbti, finalMbti, statsSum] = await Promise.all([
        db.collection('endings').doc('childType').get(),
        db.collection('endings').doc('initialMbti').get(),
        db.collection('endings').doc('finalMbti').get(),
        db.collection('endings').doc('finalStatsSum').get(),
      ]);
      return {
        childType:     child.exists    ? child.data()    : {},
        initialMbti:   initMbti.exists ? initMbti.data() : {},
        finalMbti:     finalMbti.exists ? finalMbti.data() : {},
        finalStatsSum: statsSum.exists ? statsSum.data() : {},
      };
    } catch (e) { console.warn('fetchAggregates', e); return null; }
  },
};