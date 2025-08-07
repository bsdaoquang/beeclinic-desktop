/** @format */

import { Divider, Menu, Typography } from 'antd';
import { useState } from 'react';
import { IoNotificationsOutline } from 'react-icons/io5';

const HeaderComponent = () => {
	const [keySelected, setKeySelected] = useState('home');

	const topMenu = [{}];

	return (
		<div
			style={{
				padding: '10px',
				backgroundColor: '#f3f3f3',
				minHeight: 20,
			}}>
			<div className='row'>
				<div className='col'>
					{/* <Menu
						onClick={(e) => {
							setKeySelected(e.key);
							window.location.href = `/${e.key}`;
						}}
						mode='horizontal'
						selectedKeys={[keySelected]}
						items={[]}
						style={{
							lineHeight: '20px',
							marginBottom: 0,
							backgroundColor: 'transparent',
							border: 'none',
							textDecoration: 'none',
						}}
					/> */}
				</div>
				<div className='col text-end'>
					<IoNotificationsOutline size={18} />
					<Divider type='vertical' />
					<Typography.Text>
						{new Date().toLocaleDateString('vi-VN')}
					</Typography.Text>
				</div>
			</div>
		</div>
	);
};

export default HeaderComponent;
