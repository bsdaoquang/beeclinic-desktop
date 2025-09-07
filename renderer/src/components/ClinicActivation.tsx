/** @format */

import { useDispatch, useSelector } from 'react-redux';
import type { ClinicModel } from '../types/ClinicModel';
import { addClinic, clinicSelector } from '../store/reducers/clinic-reducer';
import { Alert, Button, Input, message, Typography } from 'antd';
import { getDateTimeString } from '../utils/datetime';
import { useEffect, useState } from 'react';
import { baseURL } from '../apis/axiosClient';
import handleAPI from '../apis/handleAPI';

const ClinicActivation = () => {
	const [activationCode, setActivationCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errorText, setErrorText] = useState('');
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	const clinic: ClinicModel = useSelector(clinicSelector);
	const [messageAPI, messageHolder] = message.useMessage();
	const dispatch = useDispatch();

	// listener for online/offline status
	useEffect(() => {
		const handleOnline = () => {
			// console.log('You are online');
			setIsOnline(true);
			messageAPI.success(
				'Bạn đã kết nối internet. Vui lòng thử lại kích hoạt.'
			);
		};

		const handleOffline = () => {
			// console.log('You are offline');
			setIsOnline(false);
			messageAPI.error('Bạn đã mất kết nối internet. Vui lòng kiểm tra lại.');
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Calculate trial period days left
	// Assuming CreatedAt is a valid date string
	// Trial period is 14 days from CreatedAt

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

	const handleActivation = async () => {
		// Logic to handle activation
		// For example, send the activation code to the backend for verification
		// Update the clinic state based on the response
		if (activationCode.length !== 32) {
			setErrorText('Mã kích hoạt phải gồm 32 ký tự.');
			return;
		}

		if (!isOnline) {
			setErrorText('Vui lòng kết nối internet để kích hoạt phần mềm.');
			return;
		}

		try {
			setIsLoading(true);
			setErrorText('');
			await handleAPI(
				`/clinic/verify-activation-key`,
				{
					activationKey: activationCode,
					machineId: clinic?.MachineId,
					clinicId: clinic?._id,
				},
				'post'
			);

			// success
			messageAPI.success('Phần mềm đã được kích hoạt thành công.');
			dispatch(
				addClinic({
					...clinic,
					ActivationKey: activationCode,
				})
			);
		} catch (error: any) {
			setErrorText(
				error?.error || 'Kích hoạt không thành công. Vui lòng thử lại.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const renderActivationContent = () => (
		<div className='mt-5 bg-white text-center'>
			{errorText && (
				<Alert
					className='mb-3'
					message={errorText}
					type='error'
					showIcon
					banner
				/>
			)}
			<Typography.Paragraph>
				Nhập mã kích hoạt để sử dụng vĩnh viễn đầy đủ tính năng của phần mềm:
			</Typography.Paragraph>
			<div className='row'>
				<div className='col sm-12 col-md-8 offset-md-2'>
					<Typography.Text type='secondary'>
						Mã kích hoạt là một chuỗi gồm 32 ký tự, bao gồm chữ và số, không
						phân biệt chữ hoa chữ thường. Mã này được gửi qua email sau khi bạn
						thanh toán phí kích hoạt.
					</Typography.Text>

					<div className='mt-3'>
						<Input
							className='mb-4'
							size='large'
							allowClear
							maxLength={32}
							showCount
							value={activationCode}
							onChange={(e) => setActivationCode(e.target.value)}
							placeholder='Nhập mã kích hoạt'
						/>
						<Button
							disabled={isLoading || activationCode.length !== 32}
							size='large'
							className={'px-5'}
							type='primary'
							onClick={handleActivation}>
							Kích hoạt phần mềm
						</Button>

						<div className='mt-4'>
							<Typography.Paragraph>
								Bạn có thắc mắc về việc kích hoạt phần mềm? Vui lòng liên hệ với
								chúng tôi qua email{' '}
								<Typography.Text copyable>bsdaoquang@gmail.com</Typography.Text>{' '}
								hoặc số điện thoại{' '}
								<Typography.Text copyable>0328323686</Typography.Text>.
							</Typography.Paragraph>
							<Button
								type='link'
								onClick={() =>
									window.beeclinicAPI.openExternal(
										`${baseURL}/docs/huong-dan-mua-ma-kich-hoat-vinh-vien`
									)
								}
								target='_blank'>
								Hướng dẫn mua mã kích hoạt
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
	return (
		<div className='container'>
			{messageHolder}
			<>
				{isActive ? (
					<div>
						<Typography.Title level={4} type='success'>
							Phần mềm của bạn đã được kích hoạt
						</Typography.Title>
						<Typography.Paragraph className=''>
							Cảm ơn bạn đã kích hoạt phần mềm. Nếu bạn có bất kỳ câu hỏi nào,
							vui lòng liên hệ với chúng tôi qua email{' '}
							<Typography.Text copyable type='warning'>
								bsdaoquang@gmail.com
							</Typography.Text>{' '}
							hoặc số điện thoại{' '}
							<Typography.Text copyable type='warning'>
								0328323686
							</Typography.Text>
							.
						</Typography.Paragraph>
						<div className='mt-3'>
							<Typography.Paragraph className='' type='secondary'>
								Mã kích hoạt này đã được gắn với thiết bị của bạn và có giá trị
								vĩnh viễn.
							</Typography.Paragraph>
						</div>
						<div className='mt-3'>
							<Typography.Paragraph className='' type='secondary'>
								Lưu ý: Mã kích hoạt chỉ sử dụng cho 1 máy. Nếu bạn cài đặt phần
								mềm ở máy khác hoặc copy sang máy khác, phần mềm sẽ không giữ
								được trạng thái kích hoạt.
							</Typography.Paragraph>
						</div>
					</div>
				) : isTrial ? (
					<>
						<Typography.Title level={4} type='warning'>
							Phần mềm của bạn đang trong thời gian dùng thử
						</Typography.Title>
						<Typography.Paragraph className=''>
							Bạn còn {trialPeriodDaysLeft} ngày trong thời gian dùng thử, thời
							gian dùng thử kết thúc vào{' '}
							{clinic
								? getDateTimeString(
										new Date(
											new Date(clinic?.CreatedAt).getTime() +
												14 * 24 * 60 * 60 * 1000
										)
								  )
								: null}
							.
						</Typography.Paragraph>
						<Alert
							description='Khi hết thời gian dùng thử, dữ liệu của bạn vẫn được giữ nguyên.'
							type='info'
							banner
						/>
						<Typography.Paragraph className='mt-3'>
							Trong thời gian này, bạn có thể trải nghiệm đầy đủ các tínhnăng
							của phần mềm, bao gồm:
						</Typography.Paragraph>
						<ul>
							<li>Quản lý bệnh nhân và phiên khám.</li>
							<li>Kê đơn thuốc, in đơn thuốc.</li>
							<li>Quản lý danh sách thuốc và dịch vụ.</li>
							<li>Tìm kiếm ICD-10 và chẩn đoán.</li>
							<li>Sửa ngày kê đơn trong phạm vi cho phép.</li>
							<li>Sao lưu dữ liệu lên Google Drive.</li>
							<li>Báo cáo chi tiết hoạt động phòng khám.</li>
							<li>Quản lý lịch hẹn và gửi nhắc hẹn.</li>
							<li>Quản lý file cận lâm sàng (PDF, hình ảnh).</li>
							<li>Đồng bộ dữ liệu online và cập nhật phiên bản mới.</li>
						</ul>
						<Typography.Paragraph>
							Khi hết thời gian dùng thử, các tính năng nâng cao sẽ bị khoá, bao
							gồm:
						</Typography.Paragraph>
						<ul>
							<li>Quản lý kho thuốc vật tư</li>
							<li>Quản lý danh mục dịch vụ thủ thuật</li>
							<li>Sao lưu dữ liệu lên Google Drive.</li>
							<li>Báo cáo chi tiết hoạt động phòng khám.</li>
							<li>Quản lý lịch hẹn và gửi nhắc hẹn.</li>
							<li>Quản lý file cận lâm sàng (PDF, hình ảnh).</li>
							<li>Đồng bộ dữ liệu online và cập nhật phiên bản mới.</li>
						</ul>
						{renderActivationContent()}
					</>
				) : (
					<>
						<Typography.Title level={4} type='danger'>
							Thời gian dùng thử BeeClinic của bạn đã kết thúc
						</Typography.Title>
						<Typography.Paragraph>
							Bạn vẫn có thể xem lại dữ liệu đã nhập, tuy nhiên tất cả tính năng
							nâng cao đã bị khoá:
						</Typography.Paragraph>
						<ul>
							<li>Không thể sao lưu hoặc khôi phục dữ liệu trên cloud.</li>
							<li>Không thể tạo lịch hẹn, gửi nhắc hẹn cho bệnh nhân.</li>
							<li>Không thể xem báo cáo chi tiết hoạt động phòng khám.</li>
							<li>Không thể lưu trữ hoặc xem file cận lâm sàng.</li>
							<li>
								Không thể đồng bộ dữ liệu online và cập nhật phiên bản mới.
							</li>
						</ul>
						{renderActivationContent()}
					</>
				)}
			</>
		</div>
	);
};

export default ClinicActivation;
