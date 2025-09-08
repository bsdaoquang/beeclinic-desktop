/** @format */

import { Empty, Form, Input, message, Modal, Switch, Typography } from 'antd';
import type { ClinicModel } from '../types/ClinicModel';
import { useDispatch, useSelector } from 'react-redux';
import { clinicSelector, updateClinic } from '../store/reducers/clinic-reducer';
import { useEffect, useState } from 'react';
import bcrypt from 'bcryptjs-react';

const SecurityScreen = () => {
	const clinic: ClinicModel = useSelector(clinicSelector);
	const [isSecurity, setIsSecurity] = useState(
		clinic?.lockscreen_password ? true : false
	);
	const [isChangePassword, setIsChangePassword] = useState(
		clinic?.lockscreen_password ? true : false
	);
	const [isVisibleModalPassword, setIsVisibleModalPassword] = useState(false);

	const [form] = Form.useForm();
	const [formConfirm] = Form.useForm();
	const [messageApi, contextHolder] = message.useMessage();
	const [modal, modalContextHolder] = Modal.useModal();
	const dispatch = useDispatch();

	useEffect(() => {
		setIsSecurity(!!clinic?.lockscreen_password);
	}, [clinic]);

	const changeSecurityStatus = async (status: boolean) => {
		setIsSecurity(status);

		if (!clinic) return;

		// Call API to update security status
		if (status === true && !clinic.lockscreen_password) {
			// Enable security
			setIsVisibleModalPassword(true);
		}

		if (status === false && clinic.lockscreen_password) {
			// Disable security
			handleDisableSecurity();
		}
	};

	const handleEnableSecurity = async (vals: {
		oldPassword?: string;
		password: string;
		confirmPassword: string;
	}) => {
		if (!clinic) return;

		// Call API to enable security
		try {
			const pass = bcrypt.hashSync(vals.password, 10); // eslint-disable-line --- IGNORE ---

			await window.beeclinicAPI.updateClinicById(clinic.id, {
				lockscreen_password: pass,
			});
			messageApi.success(
				`${isChangePassword ? 'Đổi' : 'Thiết lập'} khoá màn hình thành công`
			);
			dispatch(
				updateClinic({
					lockscreen_password: pass,
				})
			);
			setIsSecurity(true);
		} catch (error) {
			messageApi.error('Có lỗi xảy ra. Vui lòng thử lại.');
			console.log(error);
		} finally {
			handleClose();
		}
	};

	const handleDisableSecurity = async () => {
		if (!clinic) return;

		if (!clinic.lockscreen_password) {
			messageApi.error('Chưa thiết lập khoá màn hình');
		}

		// show modal confirm disable with password input, then compare with clinic.lockscreen_password
		// if match, then disable security => update clinic.lockscreen_password to null
		modal.confirm({
			onOk: () => formConfirm.submit(),
			onCancel: () => {
				console.log('Cancel');
				formConfirm.resetFields();
			},
			okText: 'Xác nhận',
			cancelText: 'Huỷ',
			title: 'Tắt khoá màn hình',
			content: (
				<Form
					form={formConfirm}
					size='large'
					variant='filled'
					layout='vertical'
					onFinish={async (vals) => {
						if (!clinic) return;

						const isMatch = bcrypt.compareSync(
							vals.password,
							clinic.lockscreen_password as string
						);
						if (!isMatch) {
							messageApi.error('Mật khẩu không đúng');
							return;
						} else {
							// Call API to disable security
							await window.beeclinicAPI.updateClinicById(clinic.id, {
								lockscreen_password: null,
							});
							messageApi.success('Tắt khoá màn hình thành công');
							dispatch(updateClinic({ lockscreen_password: null }));
							setIsSecurity(false);
						}
						formConfirm.resetFields();
					}}>
					<Form.Item
						name='password'
						label='Mật khẩu'
						rules={[
							{ required: true, message: 'Vui lòng nhập mật khẩu' },
							{
								min: 6,
								max: 6,
								message: 'Mật khẩu phải gồm 6 ký tự',
							},
						]}>
						<Input.Password maxLength={6} />
					</Form.Item>
				</Form>
			),
		});
	};

	const handleClose = () => {
		form.resetFields();
		setIsVisibleModalPassword(false);
		if (!clinic?.lockscreen_password) {
			setIsSecurity(false);
		}
	};

	return clinic ? (
		<div className='container'>
			{contextHolder}
			{modalContextHolder}
			<Typography.Title className='mb-1' level={4}>
				Bảo mật
			</Typography.Title>
			<Typography.Text>
				{`Tính năng Khoá màn hình giúp bảo vệ dữ liệu phòng khám khi bạn rời máy
				tính. `}
			</Typography.Text>
			<Typography.Paragraph>
				Khi bật, BeeClinic sẽ yêu cầu nhập mật khẩu mỗi lần mở ứng dụng và sẽ tự
				động khoá sau một khoảng thời gian không sử dụng.
			</Typography.Paragraph>

			<div className='mt-5'>
				<Switch
					checked={isSecurity}
					onChange={(val) => {
						if (val) {
							setIsVisibleModalPassword(true);
						} else {
							handleDisableSecurity();
						}
					}}
				/>{' '}
				<Typography.Text
					onClick={() =>
						isSecurity
							? handleDisableSecurity()
							: setIsVisibleModalPassword(true)
					}
					className='ms-2'>
					{`${isSecurity ? 'Tắt' : 'Bật'} tính năng khoá màn hình`}
				</Typography.Text>
			</div>

			<Modal
				title={
					isChangePassword && clinic?.lockscreen_password
						? 'Đổi khoá màn hình'
						: 'Thiết lập khoá màn hình'
				}
				open={isVisibleModalPassword}
				onCancel={handleClose}
				okText='Kích hoạt'
				cancelText='Huỷ'
				onOk={() => form.submit()}>
				<Form
					className='my-4'
					size='large'
					variant='filled'
					form={form}
					layout='vertical'
					onFinish={handleEnableSecurity}>
					{isChangePassword && clinic?.lockscreen_password && (
						<Form.Item
							name='oldPassword'
							label='Mật khẩu cũ'
							rules={[
								{ required: true, message: 'Vui lòng nhập mật khẩu cũ' },
								{
									min: 6,
									max: 6,
									message: 'Mật khẩu phải gồm 6 ký tự',
								},
							]}>
							<Input.Password maxLength={6} />
						</Form.Item>
					)}
					<Form.Item
						name='password'
						label='Mật khẩu mới'
						rules={[
							{ required: true, message: 'Vui lòng nhập mật khẩu mới' },
							{
								min: 6,
								max: 6,
								message: 'Mật khẩu phải gồm 6 ký tự',
							},
						]}>
						<Input.Password maxLength={6} />
					</Form.Item>
					<Form.Item
						name='confirmPassword'
						label='Xác nhận mật khẩu'
						dependencies={['password']}
						rules={[
							{ required: true, message: 'Vui lòng xác nhận mật khẩu' },
							{
								min: 6,
								max: 6,
								message: 'Mật khẩu phải gồm 6 ký tự',
							},
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(
										new Error('Mật khẩu xác nhận không khớp')
									);
								},
							}),
						]}>
						<Input.Password maxLength={6} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	) : (
		<Empty description='Chưa có dữ liệu' />
	);
};

export default SecurityScreen;
