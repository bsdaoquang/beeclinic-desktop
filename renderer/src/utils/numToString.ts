/** @format */

export const numToString = (num: number) => {
	return num < 9 ? `0${num}` : `${num}`;
};
