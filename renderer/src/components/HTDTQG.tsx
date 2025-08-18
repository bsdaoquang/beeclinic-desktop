/** @format */

import { Steps, Typography, type StepProps } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ClinicModel } from '../types/ClinicModel';
import LoginCSKCB from './LoginCSKCB';

const HTDTQG = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepStatus, setStepStatus] = useState<StepProps[]>([
		{
			title: 'CSKCB',
			description: 'Đăng nhập CSKCB',
			status: 'process',
		},
		{
			title: 'Bác sĩ',
			description: 'Thêm Bác sĩ vào hệ thống',
			status: 'wait',
		},
		{
			title: 'Hoàn thành',
			description: 'Đồng bộ đơn thuốc',
			status: 'wait',
		},
	]);

	const res = localStorage.getItem('clinic');
	const clinic: ClinicModel = res ? JSON.parse(res) : null;

	useEffect(() => {
		// nếu cskcb có cskcbid và clinicaccesstoken thì set bước 1 thành 'finish'
		if (clinic && clinic.CSKCBID && clinic.ClinicAccessToken) {
			setStepStatus((prev) => {
				const newSteps = [...prev];
				newSteps[0].status = 'finish';
				newSteps[0].description = 'Đã đăng nhập';
				newSteps[1].status = 'process';
				return newSteps;
			});
			setCurrentStep(1);
		}
	}, [clinic]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<Typography.Title level={5}>
							Đăng nhập cơ sở khám chữa bệnh
						</Typography.Title>
						<Typography.Paragraph type='secondary'>
							Mỗi phòng khám/cơ sở y tế cần có tài khoản được cấp bởi Bộ Y tế để
							truy cập hệ thống đơn thuốc quốc gia.
						</Typography.Paragraph>
						<Typography.Paragraph type='secondary'>
							Người dùng nhập Mã liên thông CSKCB và Mật khẩu do Bộ Y tế cấp.
							Sau khi đăng nhập thành công, hệ thống sẽ cấp token (cskcbToken)
							có hiệu lực 7 ngày.
						</Typography.Paragraph>
						<Typography.Paragraph type='secondary'>
							Token này dùng để quản lý thông tin cơ sở và liên kết bác sĩ.
						</Typography.Paragraph>
						<Link
							to={
								'https://donthuocquocgia.vn/dang-ky-ma-lien-thong-co-so-kham-chua-benh'
							}
							target='_blank'>
							Đăng ký & quản lý tài khoản CSKCB
						</Link>
						<LoginCSKCB
							onOK={async (token) => {
								// update clinic infos
								await (window as any).electronAPI.updateClinic({
									CSKCBID: clinic.CSKCBID,
									ClinicAccessToken: token,
								});

								// update local storage
								localStorage.setItem(
									'clinic',
									JSON.stringify({
										...clinic,
										CSKCBID: clinic.CSKCBID,
										ClinicAccessToken: token,
									})
								);

								// set bước 0 thành finish, chuyển đến bước 1
								setStepStatus((prev) => {
									const newSteps = [...prev];
									newSteps[0].status = 'finish';
									newSteps[0].description = 'Đã đăng nhập';
									newSteps[1].status = 'process';

									return newSteps;
								});
								setCurrentStep(1);
							}}
							onError={(error) => {
								// set step 0 is error
								setStepStatus((prev) => {
									const newSteps = [...prev];
									newSteps[0].status = 'error';
									newSteps[0].description = error;
									return newSteps;
								});
							}}
						/>
					</div>
				);
			case 1:
				return (
					<div>
						<Typography.Paragraph type='secondary'>
							Đang phát triển...
						</Typography.Paragraph>
					</div>
				);
			case 2:
				return <div>Content for Hoàn thành</div>;
			default:
				return null;
		}
	};

	return (
		<div className='container-fluid'>
			<div className='container'>
				<div className='pb-4'>
					<Typography.Title level={3} type='secondary' className='mb-0'>
						Hệ thống Đơn thuốc Quốc Gia
					</Typography.Title>
					<Typography.Text type='secondary'>
						Đơn thuốc Quốc Gia là hệ thống quản lý đơn thuốc được xây dựng nhằm
						mục đích cung cấp thông tin đầy đủ và chính xác về đơn thuốc cho
						người bệnh và các cơ sở y tế.
					</Typography.Text>
				</div>
				<Steps items={stepStatus} />
				<div className='py-4'>{renderStepContent()}</div>
			</div>
		</div>
	);
};

export default HTDTQG;
