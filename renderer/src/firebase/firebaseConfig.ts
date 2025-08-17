/** @format */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyBK8omDy3Q8zJITItwatPFDBgZmIXMP6xU',
	authDomain: 'clinic-scheduler-e62c2.firebaseapp.com',
	projectId: 'clinic-scheduler-e62c2',
	storageBucket: 'clinic-scheduler-e62c2.appspot.com',
	messagingSenderId: '1081533478969',
	appId: '1:1081533478969:web:3f8e7cce77a2a5771b75e8',
	measurementId: 'G-PCKPR6W8KW',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
