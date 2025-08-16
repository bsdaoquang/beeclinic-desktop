/** @format */

import { Button, Divider, Menu, Space, Typography } from 'antd';
import { IoNotificationsOutline, IoSettingsOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import { formatDateToString } from '../utils/datetime';

const HeaderComponent = () => {
	const navigate = useNavigate();

	return (
		<div
			style={{
				padding: '10px',
				backgroundColor: '#f3f3f3',
				minHeight: 20,
			}}>
			<div className='row'>
				<div className='col'>
					<Menu
						onClick={() => {
							// setKeySelected(e.key);
							null;
						}}
						mode='horizontal'
						selectedKeys={[]}
						items={[
							{
								label: <Link to='/'>Trang chủ</Link>,
								key: 'home',
							},
							{
								label: <Link to='/patients'>Bệnh nhân</Link>,
								key: 'patients',
							},
							{
								label: <Link to={'/prescriptions'}>Đơn thuốc</Link>,
								key: 'prescriptions',
							},
							{
								label: <Link to={'/storages'}>Kho</Link>,
								key: 'storages',
							},
						]}
						style={{
							lineHeight: '20px',
							marginBottom: 0,
							backgroundColor: 'transparent',
							border: 'none',
							textDecoration: 'none',
						}}
					/>
				</div>
				<div className='col text-end'>
					<Space>
						<Button
							onClick={() => navigate('/settings')}
							icon={<IoSettingsOutline size={18} />}
							type='text'
							size='small'
						/>
						<Divider type='vertical' />
						<Button
							icon={<IoNotificationsOutline size={18} />}
							type='text'
							size='small'
						/>
						<Divider type='vertical' />
						<Typography.Text>{formatDateToString(new Date())}</Typography.Text>
					</Space>
				</div>
			</div>
		</div>
	);
};

export default HeaderComponent;
