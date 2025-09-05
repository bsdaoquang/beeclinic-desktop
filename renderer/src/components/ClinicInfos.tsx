/** @format */

/*
  Clinic model
  CSKCBID: string; // Mã cơ sở KCB (bắt buộc khi gửi đơn thuốc quốc gia)
	TenCSKCB: string; // Tên cơ sở KCB
	DiaChi: string; // Địa chỉ
	DienThoai?: string; // Điện thoại (có thể để trống)
	Email?: string; // Email liên hệ (nếu có)

	// Giấy phép hoạt động
	SoGiayPhepHoatDong: string; // Số giấy phép hoạt động
	NgayCapGiayPhep?: string; // Ngày cấp giấy phép (yyyy-MM-dd)
	NoiCapGiayPhep?: string; // Nơi cấp

	// Thông tin bác sĩ phụ trách kê đơn
	HoTenBS: string; // Họ tên bác sĩ
	SoChungChiHanhNghe: string; // Số chứng chỉ hành nghề
	KhoaPhong?: string; // Khoa/phòng (nếu có)
	ChucVu?: string; // Chức vụ (BSCKI, BSCKII, ThS, TS...)

	// Thông tin hệ thống quản lý
	MachineId: string; // Mã máy (tự sinh khi cài app)
	AppVersion: string; // Phiên bản phần mềm
	ActivationKey?: string; // Mã kích hoạt (nếu có)

	// Metadata
	CreatedAt?: string; // Ngày tạo (ISO string)
	UpdatedAt?: string; // Ngày cập nhật gần nhất
*/

import {
	AutoComplete,
	Button,
	DatePicker,
	Descriptions,
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Space,
	Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { BiEdit } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { clinicSelector, updateClinic } from '../store/reducers/clinic-reducer';
import type { ClinicModel } from '../types/ClinicModel';
import {
	formatDateToString,
	getShortDateTime,
	parseDateInput,
} from '../utils/datetime';

const ClinicInfos = () => {
	const [isEditing, setIsEditing] = useState(false);

	const [messageAPI, messageHolder] = message.useMessage();
	const [form] = Form.useForm();

	const clinic = useSelector(clinicSelector);
	const dispatch = useDispatch();

	useEffect(() => {
		if (isEditing && clinic) {
			form.setFieldsValue({
				...clinic,
				NgayCapGiayPhep: clinic.NgayCapGiayPhep
					? dayjs(clinic.NgayCapGiayPhep)
					: null,
			});
		}
	}, [isEditing]);

	const handleUpdateClinic = async (values: ClinicModel) => {
		// gọi cập nhật, sau đó chuyển đến màn hình view, load lại clinic
		try {
			const data = {
				...values,
				NgayCapGiayPhep: values.NgayCapGiayPhep
					? dayjs(values.NgayCapGiayPhep).format('YYYY-MM-DD')
					: null,
			};
			await (window as any).beeclinicAPI.updateClinicById(1, data);

			messageAPI.success('Cập nhật thông tin phòng khám thành công');
			dispatch(updateClinic(data));
			setIsEditing(false); // switch back to view mode
		} catch (error) {
			messageAPI.error('Cập nhật thông tin phòng khám thất bại');
			console.log(`Không thể cập nhật thông tin phòng khám: ${error}`); // eslint-disable-line no-console
		}
	};

	const renderClinicInfos = () => {
		return isEditing ? (
			<>
				<Form
					form={form}
					onFinish={handleUpdateClinic}
					layout='vertical'
					variant='filled'
					size='large'>
					<Form.Item
						rules={[
							{
								required: true,
								message: 'Tên phòng khám là bắt buộc',
							},
						]}
						name={'TenCSKCB'}
						label='Tên phòng khám'>
						<Input allowClear maxLength={150} />
					</Form.Item>
					<Form.Item name={'DiaChi'} label='Địa chỉ'>
						<Input allowClear />
					</Form.Item>
					<div className='row'>
						<div className=' col'>
							<Form.Item name={'DienThoai'} label='Điện thoại'>
								<Input allowClear />
							</Form.Item>
						</div>
						<div className=' col-8'>
							<Form.Item name={'Email'} label='Email'>
								<Input type='email' autoComplete='email' allowClear />
							</Form.Item>
						</div>
					</div>
					<div className='row'>
						<div className='col-3'>
							<Form.Item name={'SoGiayPhepHoatDong'} label='Số GPHD'>
								<Input allowClear />
							</Form.Item>
						</div>
						<div className='col-3'>
							<Form.Item name={'NgayCapGiayPhep'} label='Ngày cấp'>
								<DatePicker
									format={'DD/MM/YYYY'}
									style={{ width: '100%' }}
									onBlur={(val: any) => {
										const value = val.target.value;

										if (
											(value && value.length < 8) ||
											(value && !value.includes('/'))
										) {
											const dateStr = value ? parseDateInput(value) : null;

											if (dateStr) {
												form.setFieldValue(
													'expDate',
													dayjs(dateStr, 'YYYY-MM-DD', true)
												);
											} else {
												form.setFieldValue('expDate', null);
											}
										} else {
											return;
										}
									}}
								/>
							</Form.Item>
						</div>
						<div className='col-6'>
							<Form.Item name={'NoiCapGiayPhep'} label='Nơi cấp'>
								<Input allowClear />
							</Form.Item>
						</div>
					</div>

					<div className='row'>
						<div className='col-3'>
							<Form.Item name={'ChucVu'} label='Chức vụ'>
								<AutoComplete
									allowClear
									options={[
										{ value: 'Bác sĩ', label: 'Bác sĩ' },
										{ value: 'Y sĩ', label: 'Y sĩ' },
										{ value: 'Điều dưỡng', label: 'Điều dưỡng' },
										{ value: 'Dược sĩ', label: 'Dược sĩ' },
										{ value: 'Kỹ thuật viên', label: 'Kỹ thuật viên' },
										{ value: 'Hộ sinh', label: 'Hộ sinh' },
									]}
								/>
							</Form.Item>
						</div>
						<div className='col-6'>
							<Form.Item name={'HoTenBS'} label='Họ tên bác sĩ'>
								<Input allowClear maxLength={150} />
							</Form.Item>
						</div>
						<div className='col-3'>
							<Form.Item name={'SoChungChiHanhNghe'} label='Số CCHN'>
								<Input allowClear />
							</Form.Item>
						</div>
					</div>
					<Form.Item name={'CongKham'} label='Công khám'>
						<InputNumber
							min={0}
							style={{ width: '100%' }}
							placeholder='Chi phí cho một lần khám'
						/>
					</Form.Item>
				</Form>
			</>
		) : (
			<>
				<Descriptions column={1}>
					<Descriptions.Item label='Mã CSKCB'>
						{clinic?.CSKCBID || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Tên CSKCB'>
						{clinic?.TenCSKCB || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Địa chỉ'>
						{clinic?.DiaChi || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Điện thoại'>
						{clinic?.DienThoai || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Email'>
						{clinic?.Email || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Số giấy phép hoạt động'>
						{clinic?.SoGiayPhepHoatDong || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Ngày cấp giấy phép'>
						{clinic?.NgayCapGiayPhep
							? formatDateToString(new Date(clinic.NgayCapGiayPhep))
							: ''}
					</Descriptions.Item>
					<Descriptions.Item label='Nơi cấp giấy phép'>
						{clinic?.NoiCapGiayPhep || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Công khám'>
						{clinic?.CongKham || '0'}
					</Descriptions.Item>
					<Descriptions.Item label='Họ tên bác sĩ'>
						{clinic?.HoTenBS || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Số CCHN'>
						{clinic?.SoChungChiHanhNghe || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Khoa/Phòng'>
						{clinic?.KhoaPhong || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Chức vụ'>
						{clinic?.ChucVu || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Mã máy'>
						{clinic?.MachineId || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Phiên bản phần mềm'>
						{clinic?.AppVersion || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Mã kích hoạt'>
						{clinic?.ActivationKey || ''}
					</Descriptions.Item>
					<Descriptions.Item label='Ngày tạo'>
						{clinic?.CreatedAt ? getShortDateTime(clinic.CreatedAt) : ''}
					</Descriptions.Item>
					<Descriptions.Item label='Ngày cập nhật'>
						{clinic?.UpdatedAt ? getShortDateTime(clinic.UpdatedAt) : ''}
					</Descriptions.Item>
				</Descriptions>
			</>
		);
	};

	return (
		<div>
			{messageHolder}
			<Flex align='center' justify='space-between'>
				<div>
					<Typography.Title level={3} className='mb-0' type='secondary'>
						Thông tin phòng khám
					</Typography.Title>
					<div className='col-8'>
						<Typography.Text type='secondary'>
							Những thông tin này sẽ được sử dụng để gửi đơn thuốc Quốc Gia và
							in đơn thuốc, một số thông tin có thể được cập nhật sau khi đăng
							nhập vào hệ thống đơn thuốc Quốc Gia
						</Typography.Text>
					</div>
				</div>
				<Space>
					{isEditing && (
						<Button onClick={() => setIsEditing(false)} type='text' danger>
							Huỷ bỏ
						</Button>
					)}
					<Button
						type='link'
						icon={<BiEdit size={20} />}
						onClick={() => (isEditing ? form.submit() : setIsEditing(true))}>
						{isEditing ? 'Cập nhật' : 'Chỉnh sửa'}
					</Button>
				</Space>
			</Flex>
			<div className='mt-3'>
				<div className='row'>
					<div className='col-md-8 '>{renderClinicInfos()}</div>
				</div>
			</div>
		</div>
	);
};

export default ClinicInfos;
