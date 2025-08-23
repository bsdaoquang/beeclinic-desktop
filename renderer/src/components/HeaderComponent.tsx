/** @format */

import { Button, Divider, Menu, Space, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import type { ClinicModel } from '../types/ClinicModel';
import { formatDateToString, getShortDateTime } from '../utils/datetime';

const HeaderComponent = ({ clinic }: { clinic?: ClinicModel }) => {
	const [isActive, setIsActive] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (clinic) {
			const hasActivationKey = !!clinic.ActivationKey;
			const createdAt = clinic.CreatedAt
				? new Date(clinic.CreatedAt)
				: undefined;
			const now = new Date();
			const isWithinTrial =
				createdAt &&
				(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 14;
			setIsActive(hasActivationKey || !!isWithinTrial);
		} else {
			setIsActive(false);
		}
	}, [clinic]);

	const expDate =
		clinic && clinic.CreatedAt
			? new Date(
					new Date(clinic.CreatedAt).getTime() + 14 * 24 * 60 * 60 * 1000
			  )
			: undefined;

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
								label: isActive ? (
									<Link to={'/prescriptions'}>Đơn thuốc</Link>
								) : (
									<Tooltip title='Chức năng này chỉ khả dụng khi có mã kích hoạt'>
										<Typography.Text type='secondary'>
											Đơn thuốc
										</Typography.Text>
									</Tooltip>
								),
								key: 'prescriptions',
							},
							{
								label: isActive ? (
									<Link to={'/storages'}>Thuốc - Vật tư</Link>
								) : (
									<Tooltip title='Chức năng này chỉ khả dụng khi có mã kích hoạt'>
										<Typography.Text type='secondary'>
											Thuốc - Vật tư
										</Typography.Text>
									</Tooltip>
								),
								key: 'storages',
							},
							{
								label: isActive ? (
									<Link to={'/services'}>Dịch vụ - Thủ thuật</Link>
								) : (
									<Tooltip title='Chức năng này chỉ khả dụng khi có mã kích hoạt'>
										<Typography.Text type='secondary'>
											Dịch vụ - Thủ thuật
										</Typography.Text>
									</Tooltip>
								),
								key: 'services',
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
						{!clinic?.ActivationKey &&
							new Date().getTime() -
								new Date(clinic?.CreatedAt || '').getTime() <=
								14 * 24 * 60 * 60 * 1000 && (
								<>
									<Tooltip
										title={`Hết hạn vào lúc ${
											expDate ? getShortDateTime(expDate.toISOString()) : ''
										}`}>
										<Tag color='gold'>Dùng thử</Tag>
									</Tooltip>
									<Divider type='vertical' />
								</>
							)}
						<Button
							onClick={() => navigate('/settings')}
							icon={<IoSettingsOutline size={18} />}
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
