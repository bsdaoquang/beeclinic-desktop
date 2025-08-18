/** @format */

import { Affix, Typography } from 'antd';

const FooterComponent = () => {
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
							Ver - <a href=''>All rights reserved</a>
						</Typography.Text>
					</div>
				</div>
			</div>
		</Affix>
	);
};

export default FooterComponent;
