/** @format */

import axios from 'axios';
import queryString from 'query-string';

const axiosClient = axios.create({
	// baseURL: 'https://beeclinic.vercel.app/',
	baseURL: 'http://localhost:8000',
	paramsSerializer: (params) => queryString.stringify(params),
});

axiosClient.interceptors.request.use(async (config: any) => {
	config.headers = {
		Accept: 'application/json',
		...config.headers,
	};
	config.data;
	return config;
});

axiosClient.interceptors.response.use(
	(res) => {
		if (res.data && res.status >= 200 && res.status < 300) {
			return res.data.data;
		} else {
			return Promise.reject(res.data);
		}
	},
	(error) => {
		const { response } = error;

		return Promise.reject(response.data.message as string);
	}
);

export default axiosClient;
