/** @format */

import {
	Button,
	DatePicker,
	Drawer,
	Form,
	Input,
	Select,
	Space,
	Upload,
	type UploadProps,
	message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { parseDateInput } from '../utils/datetime';
import { handleSaveFile } from '../utils/handleFile';
import type { PatientModel } from '../types/PatientModel';

export interface AddPatientProps {
	visible: boolean;
	onClose: () => void;
	patient?: PatientModel;
	onFinish?: () => void;
}

const AddPatient = (props: AddPatientProps) => {
	const { visible, onClose, onFinish, patient } = props;

	const [filelists, setFilelists] = useState<any>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [messageAPI, messHolder] = message.useMessage();

	const [form] = Form.useForm();

	useEffect(() => {
		if (patient) {
			form.setFieldsValue({
				...patient,
				age: patient.age ? dayjs(patient.age) : null,
			});

			patient.photoUrl &&
				setFilelists([
					{
						uid: '-1',
						name: patient.photoUrl.split('/').pop(),
						status: 'done',
						url: patient.photoUrl,
					},
				]);
		}
	}, [patient]);

	const handleChangeImage: UploadProps['onChange'] = ({
		fileList: newFileList,
	}) => {
		setFilelists(
			newFileList.map((file) => ({
				...file,
				status: 'success',
			}))
		);
	};

	const handleAddPatient = async (vals: any) => {
		setIsLoading(true);
		try {
			const data = {
				...vals,
				photoUrl:
					vals.photoUrl && vals.photoUrl.file
						? await handleSaveFile(vals.photoUrl.file)
						: '',
				age: vals.age ? new Date(vals.age) : '',
				weight: '',
				ma_dinh_danh_y_te: '',
			};

			// console.log(data);

			patient
				? await (window as any).beeclinicAPI.updatePatientById(
						`${patient.id}`,
						data
				  )
				: await (window as any).beeclinicAPI.addPatient(data);
			messageAPI.success('Lưu thông tin bệnh nhân thành công');
			handleClose();
			onFinish && onFinish();
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setFilelists([]);
		form.resetFields();
		onClose();
	};

	return (
		<>
			{messHolder}
			<Drawer
				loading={isLoading}
				open={visible}
				onClose={handleClose}
				title='Thêm bệnh nhân mới'
				width={'100%'}
				footer={null}>
				<div className='container-fluid'>
					<div className='container'>
						<Form
							form={form}
							onFinish={handleAddPatient}
							size='large'
							layout='vertical'
							variant='filled'
							initialValues={{
								gender: 'male',
							}}>
							<Form.Item name='photoUrl'>
								<Upload
									type='select'
									onChange={handleChangeImage}
									fileList={filelists}
									listType='picture-circle'
									maxCount={1}
									accept='image/*'>
									{filelists.length > 0 ? null : 'Tải lên'}
								</Upload>
							</Form.Item>
							<div className='row'>
								<div className='col'>
									<Form.Item
										name='name'
										label='Họ và tên'
										rules={[
											{ required: true, message: 'Vui lòng nhập họ và tên' },
										]}>
										<Input
											onBlur={(e) =>
												form.setFieldValue('name', e.target.value.toUpperCase())
											}
											autoComplete=''
											autoFocus
											placeholder='Nhập họ và tên'
											allowClear
										/>
									</Form.Item>
									<div className='row'>
										<div className='col'>
											<Form.Item name='gender' label='Giới tính'>
												<Select
													allowClear
													options={[
														{ label: 'Nam', value: 'male' },
														{ label: 'Nữ', value: 'female' },
													]}
												/>
											</Form.Item>
										</div>
										<div className='col'>
											<Form.Item name='age' label='Ngày sinh'>
												<DatePicker
													format={'DD/MM/YYYY'}
													style={{ width: '100%' }}
													onBlur={(val: any) => {
														const value = val.target.value;

														if (
															(value && value.length < 8) ||
															(value && !value.includes('/'))
														) {
															const dateStr = value
																? parseDateInput(value)
																: null;

															if (dateStr) {
																form.setFieldValue(
																	'age',
																	dayjs(dateStr, 'YYYY-MM-DD', true)
																);
															} else {
																form.setFieldValue('age', null);
															}
														} else {
															return;
														}
													}}
												/>
											</Form.Item>
										</div>
									</div>
									<div className='row'>
										<div className='col'>
											<Form.Item name='phone' label='Số điện thoại'>
												<Input
													placeholder='Nhập số điện thoại'
													allowClear
													maxLength={10}
												/>
											</Form.Item>
										</div>
										<div className='col'>
											<Form.Item name='citizenId' label='Số CMND/CCCD'>
												<Input allowClear />
											</Form.Item>
										</div>
									</div>
									<div className='row'>
										<div className='col'>
											<Form.Item name='bhyt' label='Số thẻ BHYT'>
												<Input placeholder='Mã số thẻ BHYT' allowClear />
											</Form.Item>
										</div>
										<div className='col'>
											<Form.Item name='email' label='Email'>
												<Input
													type='email'
													autoComplete='email'
													placeholder='Nhập email'
													allowClear
												/>
											</Form.Item>
										</div>
									</div>
									<Form.Item name='address' label='Địa chỉ'>
										<Input
											autoComplete='address'
											placeholder='Nhập địa chỉ'
											allowClear
										/>
									</Form.Item>

									<Form.Item name='guardian' label='Thông tin liên hệ khẩn cấp'>
										<Input
											allowClear
											placeholder='Mối quan hệ, Tên, Số điện thoại người thân khi cần liên hệ'
										/>
									</Form.Item>
								</div>
								<div className='col'>
									<Form.Item name='medicalHistory' label='Lịch sử bệnh án'>
										<Input.TextArea
											autoComplete='medicalHistory'
											placeholder='Nhập lịch sử bệnh án'
											allowClear
											rows={4}
										/>
									</Form.Item>
									<Form.Item name='allergies' label='Dị ứng'>
										<Input.TextArea
											autoComplete='allergies'
											placeholder='Nhập thông tin dị ứng'
											allowClear
											rows={4}
										/>
									</Form.Item>
									<Form.Item name='notes' label='Ghi chú thêm'>
										<Input.TextArea
											autoComplete='notes'
											placeholder='Nhập ghi chú thêm'
											allowClear
											rows={4}
										/>
									</Form.Item>
								</div>
							</div>
						</Form>

						<div className='mt-3 text-end'>
							<Space>
								<Button onClick={handleClose} size='large' className='px-5'>
									Huỷ bỏ
								</Button>
								<Button
									className='px-5'
									type='primary'
									onClick={() => form.submit()}
									size='large'>
									Đồng ý
								</Button>
							</Space>
						</div>
					</div>
				</div>
			</Drawer>
		</>
	);
};

export default AddPatient;
