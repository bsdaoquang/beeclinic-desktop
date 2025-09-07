/** @format */

import axiosClient from './axiosClient';

const handleAPI = async (
	url: string,
	data?: any,
	method?: 'post' | 'put' | 'get' | 'delete',
	isFile?: boolean
) => {
	try {
		if (!url) return;
		const response = await axiosClient(url, {
			method: method ?? 'get',
			data,
			headers: {
				'Content-Type': isFile ? 'multipart/form-data' : 'application/json',
			},
		});
		return response as any;
	} catch (error) {
		throw error as any;
	}
};
export default handleAPI;
