/** @format */

import {
	Button,
	Divider,
	Flex,
	Menu,
	Popover,
	Space,
	Tooltip,
	Typography,
} from 'antd';
import { useState } from 'react';
import { IoIosInformationCircleOutline } from 'react-icons/io';
import { IoSettingsOutline } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { baseURL } from '../apis/axiosClient';
import { LockScreenModal } from '../modals';
import { clinicSelector } from '../store/reducers/clinic-reducer';
import type { ClinicModel } from '../types/ClinicModel';
import { formatDateToString } from '../utils/datetime';

const HeaderComponent = () => {
	const [isLockScreen, setIsLockScreen] = useState(false);

	const navigate = useNavigate();
	const clinic: ClinicModel = useSelector(clinicSelector);

	const trialPeriodDaysLeft = clinic?.CreatedAt
		? Math.max(
				0,
				14 -
					Math.floor(
						(new Date().getTime() - new Date(clinic.CreatedAt).getTime()) /
							(1000 * 60 * 60 * 24)
					)
		  )
		: 0;

	const isActive = Boolean(clinic && clinic?.ActivationKey);
	const isTrial = Boolean(
		clinic && !clinic?.ActivationKey && trialPeriodDaysLeft > 0
	);
	return (
		<div
			style={{
				padding: '10px',
				backgroundColor: '#f3f3f3',
				minHeight: 20,
			}}>
			<div className='row'>
				<div className='col-8'>
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
								label:
									isTrial || isActive ? (
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
								label:
									isTrial || isActive ? (
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
								label:
									isTrial || isActive ? (
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
							{
								key: 'reports',
								label:
									isTrial || isActive ? (
										<Link to={'/reports'}>Báo cáo</Link>
									) : (
										<Tooltip title='Chức năng này chỉ khả dụng khi có mã kích hoạt'>
											<Typography.Text type='secondary'>
												Báo cáo
											</Typography.Text>
										</Tooltip>
									),
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
						{!isActive && trialPeriodDaysLeft > 0 && (
							<Space>
								<Typography.Text type='secondary'>
									Dùng thử còn {trialPeriodDaysLeft} ngày
								</Typography.Text>
								<Popover
									placement='bottomRight'
									title='Chính sách dùng thử'
									content={() => (
										<div style={{ maxWidth: 450 }}>
											<Typography.Paragraph>
												Bạn sẽ được sử dụng đầy đủ tất cả các tính năng trong 14
												ngày kể từ ngày đăng ký. Sau 14 ngày, hệ thống sẽ giới
												hạn một số tính năng. Để tiếp tục sử dụng đầy đủ các
												tính năng. Vui lòng nhập mã kích hoạt.
											</Typography.Paragraph>
											<Typography.Paragraph className='mb-1'>
												Các tính năng không bị giới hạn sau thời gian dùng thử:
											</Typography.Paragraph>
											<ul>
												<li>
													Quản lý bệnh nhân (bao gồm cả lịch sử khám bệnh)
												</li>
												<li>
													Kê đơn, in đơn thuốc (Vẫn có thể thêm thuốc, dịch vụ
													mới)
												</li>
											</ul>
											<Flex justify='space-between' className='mt-2 text-end'>
												<Button
													type='link'
													className='text-muted'
													onClick={async () =>
														await window.beeclinicAPI.openExternal(
															`${baseURL}/docs/huong-dan-mua-ma-kich-hoat-vinh-vien`
														)
													}>
													Hướng dẫn mua mã kích hoạt
												</Button>
												<Link to='/settings?tabKey=activation'>
													Nhập mã kích hoạt
												</Link>
											</Flex>
										</div>
									)}>
									<IoIosInformationCircleOutline
										size={18}
										className='text-muted'
									/>
								</Popover>
							</Space>
						)}
						<Divider type='vertical' />
						{/* <Tooltip title='Khoá màn hình'>
							<Button
								disabled={!isActive && !isTrial}
								onClick={() => {
									if (clinic?.lockscreen_password) {
										navigate('/');
										setIsLockScreen(true);
									} else {
										navigate('/settings?tabKey=security');
									}
								}}
								icon={<BsFillShieldLockFill className='text-muted' size={18} />}
								type='text'
								size='small'
							/>
						</Tooltip>
						<Divider type='vertical' /> */}
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
			<LockScreenModal
				visible={isLockScreen}
				onClose={() => setIsLockScreen(false)}
			/>
		</div>
	);
};

export default HeaderComponent;
