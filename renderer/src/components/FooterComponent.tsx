/** @format */

import { Affix, Typography } from 'antd';
import { useEffect, useState } from 'react';

const FooterComponent = () => {
	const [version, setVersion] = useState('');

	useEffect(() => {
		getVersion();
	}, []);

	const getVersion = async () => {
		const response = await (window as any).beeclinicAPI.getVersion();
		setVersion(response.version);
	};

	return (
		<Affix offsetBottom={0}>
			<div
				style={{
					padding: '10px',
					backgroundColor: '#f3f3f3',
					minHeight: 20,
				}}>
				<div className='row'>
					<div className='col'>
						<Typography.Text>
							<a href='https://yhocso.com' target='_blank'>
								Y Học Số Co., Ltd.
							</a>{' '}
							© 2025
						</Typography.Text>
					</div>
					<div className='col text-end'>
						<Typography.Text>
							<i>Phiên bản: {version}</i> - <a href=''>All rights reserved</a>
						</Typography.Text>
					</div>
				</div>
			</div>
		</Affix>
	);
};

export default FooterComponent;
