/** @format */

import {
	DatePicker,
	Drawer,
	Form,
	Input,
	Select,
	Typography,
	Upload,
	type UploadProps,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { parseDateInput } from '../utils/datetime';

export interface AddPatientProps {
	visible: boolean;
	onClose: () => void;
	patient?: any;
}

const AddPatient = (props: AddPatientProps) => {
	const { visible, onClose } = props;

	const [filelists, setFilelists] = useState<any>([]);

	const [form] = Form.useForm();

	const handleChangeImage: UploadProps['onChange'] = ({
		fileList: newFileList,
	}) => {
		setFilelists(newFileList);
	};

	return (
		<Drawer
			open={visible}
			onClose={onClose}
			title='Thêm bệnh nhân mới'
			width={'100%'}
			footer={null}>
			<div className='container-fluid'>
				<div className='container'>
					<div className='row'>
						<div className='col-8 offset-2'>
							<Form
								form={form}
								size='large'
								layout='vertical'
								variant='filled'
								initialValues={{
									gender: 'male',
								}}>
								<div className='row'>
									<div className='col'>
										<Form.Item name='photoUrl'>
											<Upload
												type='select'
												listType='picture-circle'
												fileList={filelists}
												maxCount={1}
												accept='image/*'
												onChange={handleChangeImage}>
												{filelists.length > 0 ? null : 'Tải lên'}
											</Upload>
											<div className='mt-2'>
												<Typography.Text type='secondary'>
													Ảnh đại diện của bệnh nhân
												</Typography.Text>
											</div>
										</Form.Item>
									</div>
									<div className='col-8'>
										<Form.Item
											name='name'
											label='Họ và tên'
											rules={[
												{ required: true, message: 'Vui lòng nhập họ và tên' },
											]}>
											<Input
												onBlur={(e) =>
													form.setFieldValue(
														'name',
														e.target.value.toUpperCase()
													)
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
															// form.setFieldValue(
															// 	'age',
															// 	parseDateInput(val.target.value) !== null
															// 		? parseDateInput(val.target.value)
															// 		: val.target.value
															// );
														}}
													/>
												</Form.Item>
											</div>
										</div>
									</div>
								</div>
							</Form>
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
};

export default AddPatient;
