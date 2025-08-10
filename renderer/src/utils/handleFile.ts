/** @format */

import { replaceName } from './replaceName';

export const handleSaveFile = async (file: any) => {
	const { originFileObj } = file;

	const reader = new FileReader();

	reader.onload = () => {
		const buffer = reader.result;
		(window as any).beeclinicAPI.saveFileToAssets({
			fileName: replaceName(file.name),
			buffer,
		});
	};
	reader.readAsArrayBuffer(originFileObj);
	return `/assets/files/${replaceName(file.name)}`;
};
