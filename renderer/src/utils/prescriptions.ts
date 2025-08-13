/** @format */

const randomAlnumLower = (len = 7): string => {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	let s = '';
	for (let i = 0; i < len; i++)
		s += chars[Math.floor(Math.random() * chars.length)];
	return s;
};

const generatePrescriptionCode = (
	facilityCode: string,
	type: 'c' | 'n' | 'h' | 'y'
) => {
	// facilityCode must be 5 chars — caller đảm bảo hoặc pad/truncate
	const f = (facilityCode || '').toString().padStart(5, '0').slice(0, 5);
	const mid = randomAlnumLower(7);
	return `${f}${mid}-${type}`;
};

export { randomAlnumLower, generatePrescriptionCode };
