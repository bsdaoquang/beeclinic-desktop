/** @format */

import { numToString } from './numToString';

/**
 * Nhận dạng chuỗi ngày tháng đầu vào và trả về đối tượng dayjs nếu hợp lệ
 */
export const parseDateInput = (input: string | null) => {
	if (!input) return null;

	const sanitized = input.replace(/\D/g, ''); // loại bỏ ký tự không phải số
	const len = sanitized.length;

	let day = '01';
	let month = '01';
	let year = '';

	if (len === 4) {
		// 1987 => 01/01/1987
		year = sanitized;
	} else if (len === 6) {
		// 122024 => 01/12/2024 (MMYYYY)
		month = sanitized.slice(0, 2);
		year = sanitized.slice(2);
	} else if (len === 7) {
		// 2431987 => 24/03/1987
		day = sanitized.slice(0, 2);
		month = '0' + sanitized.slice(2, 3);
		year = sanitized.slice(3);
	} else if (len === 8) {
		// 24031987 => 24/03/1987
		day = sanitized.slice(0, 2);
		month = sanitized.slice(2, 4);
		year = sanitized.slice(4);
	} else {
		return null;
	}

	const dayNum = parseInt(day, 10);
	const monthNum = parseInt(month, 10);
	const yearNum = parseInt(year, 10);

	if (
		dayNum < 1 ||
		dayNum > 31 ||
		monthNum < 1 ||
		monthNum > 12 ||
		yearNum < 1000 ||
		yearNum > 3000
	) {
		return null;
	}

	const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

	return dateStr;
};

/**
 * Chuyển đổi ngày tháng từ Dayjs sang định dạng DD/MM/YYYY
 */
export function formatDateToString(date: Date): string {
	return `${numToString(date.getDate())}/${numToString(
		date.getMonth() + 1
	)}/${date.getFullYear()}`;
}

export const getYearOld = (dob: string): number => {
	// dob ở dạng YYYY-MM-DD hoặc YYYY/MM/DD
	const birthDate = new Date(dob);
	const today = new Date();

	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	const dayDiff = today.getDate() - birthDate.getDate();

	// Nếu chưa tới sinh nhật trong năm nay thì trừ đi 1 tuổi
	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age--;
	}

	return age < 1 ? 1 : age;
};

export const getDateTimeString = () => {
	const date = new Date();

	return `${numToString(date.getHours())}:${numToString(
		date.getMinutes()
	)}:${numToString(date.getSeconds())}, Ngày ${numToString(
		date.getDate()
	)} Tháng ${numToString(date.getMonth() + 1)} Năm ${numToString(
		date.getFullYear()
	)}`;
};

export const getShortDateTime = (date: string) => {
	const d = new Date(date);

	return `${numToString(d.getHours())}:${numToString(
		d.getMinutes()
	)}, ${numToString(d.getDate())}/${numToString(
		d.getMonth() + 1
	)}/${numToString(d.getFullYear())}`;
};
