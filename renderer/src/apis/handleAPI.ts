/** @format */

import axiosClient from './axiosClient';

const handleAPI = async (
	url: string,
	data?: any,
	method?: 'post' | 'put' | 'get' | 'delete',
	isFile?: boolean
) => {
	return (
		url &&
		((await axiosClient(url, {
			method: method ?? 'get',
			data,
			headers: {
				'Content-Type': isFile ? 'multipart/form-data' : 'application/json',
			},
		})) as any)
	);
};
export default handleAPI;
