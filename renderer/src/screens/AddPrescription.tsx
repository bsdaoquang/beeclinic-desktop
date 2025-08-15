/** @format */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { PatientModel } from '../types/PatientModel';
import {
	AutoComplete,
	Button,
	Card,
	Divider,
	Flex,
	Form,
	Input,
	InputNumber,
	List,
	message,
	Select,
	Space,
	Spin,
	Tooltip,
	Typography,
} from 'antd';
import { FaPrint } from 'react-icons/fa6';
import { Descriptions } from 'antd';
import { formatDateToString } from '../utils/datetime';
import type { PrescriptionItem } from '../modals/PrescriptionModel';
import { generatePrescriptionCode, randomAlnum } from '../utils/prescriptions';
import TextArea from 'antd/es/input/TextArea';
import { IoIosAdd } from 'react-icons/io';
import { BiEdit } from 'react-icons/bi';

/** @format */
/*
  Add new prescription by patient id in query
*/

const facilityCode = '12345';

const AddPrescription = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [patient, setPatient] = useState<PatientModel>();
	const [prescriptionItems, setPrescriptionItems] = useState<
		PrescriptionItem[]
	>([]);
	const [prescriptionCode, setPrescriptionCode] = useState('');
	const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);

	const query = new URLSearchParams(useLocation().search);
	const patientId = query.get('patient-id');
	const [form] = Form.useForm();
	const [formPres] = Form.useForm();
	const [messageAPI, messHolder] = message.useMessage();

	const medicineNameRef = useRef<any>(null);
	const quantityRef = useRef<any>(null);

	useEffect(() => {
		form.setFieldValue('loai_don_thuoc', 'c');
		formPres.setFieldValue('unit', 'viên');
		setPrescriptionCode(generatePrescriptionCode(facilityCode, 'c'));
	}, []);

	useEffect(() => {
		patientId && getPatientDetail();
		getAllMedicines();
	}, [patientId]);

	const getAllMedicines = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getMedicines();
			setMedicines(res);
		} catch (error) {
			console.log(error);
		}
	};

	const getPatientDetail = async () => {
		setIsLoading(true);
		try {
			const res = await (window as any).beeclinicAPI.getPatientById(patientId);
			setPatient(res);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddPrescription = (vals: any) => {
		console.log(vals);
	};

	const handleAddMedicine = async (vals: any) => {
		// formPres.resetFields();
		// medicineNameRef.current.focus();
		// Kiểm tra trong kho có thuốc này chưa, nếu chưa có thì tạo mã thuốc tự động gồm 4 ký tự và thêm vào với số lượng 0,
		// nếu đã có và số lượng > 0 thì trừ trong kho theo quantity và cập nhật lại kho
		//
		const items = [...medicines];

		const indexMedicine = prescriptionItems.findIndex(
			(element) => element.ten_thuoc === vals.ten_thuoc
		);

		if (indexMedicine === -1) {
			const isExitsMedicine = items.find(
				(element) =>
					element.ma_thuoc === vals.ma_thuoc &&
					element.ten_thuoc === vals.ten_thuoc
			);

			if (isExitsMedicine) {
				// Đã có thuốc tương tự
				// nếu số lượng khác 0 tức là có quản lý
				// Cập nhật số lượng trong kho

				if (isExitsMedicine.quantity > 0) {
					const count = isExitsMedicine.quantity - vals.quantity;
					// update to database

					const newData = {
						...isExitsMedicine,
						quantity: count,
					};

					await (window as any).beeclinicAPI.updateMedicineById(
						isExitsMedicine.id,
						newData
					);
					// update in result
				}

				// bỏ khỏi danh sách medicine vì đã thêm vào rồi
				const index = items.findIndex(
					(element) => element.ma_thuoc === vals.ma_thuoc
				);
				items.splice(index, 1);
				setMedicines(items);
			} else {
				// Chưa có, tạo mã và thêm thuốc vào kho với số lượng là 0
				const newMedicine: PrescriptionItem = {
					ten_thuoc: vals.ten_thuoc,
					ma_thuoc: randomAlnum(),
					unit: vals.unit ?? '',
					instruction: vals.instruction ?? '',
					quantity: 0,
				};

				items.push(newMedicine);
				setMedicines(items);
				await (window as any).beeclinicAPI.addMedicine(newMedicine);
			}
			prescriptionItems.push(vals);
		} else {
			const newPresItems = [...prescriptionItems];
			newPresItems[indexMedicine] = vals;
			setPrescriptionItems(newPresItems);
		}

		formPres.resetFields();
		medicineNameRef.current.focus();
	};

	return (
		<div className='container-fluid'>
			{messHolder}
			<div className='container py-3'>
				{isLoading ? (
					<div className='text-center p-5'>
						<Spin />
					</div>
				) : patient ? (
					<>
						<div className='row'>
							<div className='col-4 d-sm-none d-md-block'>
								<Card
									title='Thông tin bệnh nhân'
									size='small'
									style={{
										height: 'calc(100vh - 190px)',
										overflow: 'auto',
									}}>
									<Descriptions column={1} size='small'>
										<Descriptions.Item label='Họ tên'>
											{patient.name}
										</Descriptions.Item>
										<Descriptions.Item label='Giới tính'>
											{patient.gender === 'male' ? 'Nam' : 'Nữ'}
										</Descriptions.Item>
										<Descriptions.Item label='Ngày sinh'>
											{patient.age
												? formatDateToString(new Date(patient.age))
												: ''}
										</Descriptions.Item>
										<Descriptions.Item label='Số điện thoại'>
											{patient.phone}
										</Descriptions.Item>
										<Descriptions.Item label='Địa chỉ'>
											{patient.address}
										</Descriptions.Item>
										<Descriptions.Item label='Cân nặng'>
											{patient.weight ?? ''}
										</Descriptions.Item>
										<Descriptions.Item label='Ngày khám'>
											{new Date().toLocaleString()}
										</Descriptions.Item>
									</Descriptions>
									<Divider className='mb-3' />
									<>
										<Typography.Paragraph style={{ fontWeight: 'bold' }}>
											Dị ứng
										</Typography.Paragraph>
										<Typography.Text type='secondary'>
											{patient.allergies ?? ''}
										</Typography.Text>
									</>
									<Divider className='mb-3' />
									<>
										<Typography.Paragraph style={{ fontWeight: 'bold' }}>
											Lịch sử khám bệnh
										</Typography.Paragraph>
										<List />
									</>
								</Card>
							</div>
							<div className='col'>
								<Card
									title='Đơn thuốc'
									size='small'
									style={{
										height: 'calc(100vh - 190px)',
										overflow: 'auto',
									}}
									extra={
										<Typography.Text type='secondary'>{`Mã đơn: ${prescriptionCode.toUpperCase()}`}</Typography.Text>
									}>
									<List
										header={
											<>
												<Form
													layout='vertical'
													variant='filled'
													onFinish={handleAddPrescription}
													form={form}>
													<Form.Item name={'reason_for_visit'}>
														<Input placeholder='Lý do đến khám' allowClear />
													</Form.Item>

													<Form.Item name={'disease_progression'}>
														<TextArea
															rows={3}
															allowClear
															placeholder='Diễn tiến bệnh'
														/>
													</Form.Item>
													<div className='row'>
														<div className='col-8'>
															<Form.Item
																rules={[
																	{
																		required: true,
																		message: 'Nhập chẩn đoán',
																	},
																]}
																name={'diagnosis'}>
																<AutoComplete
																	options={[
																		{
																			label: 'Viêm phế quản',
																			value: 'Viêm phế quản',
																		},
																	]}
																	allowClear
																	placeholder='Chẩn đoán'
																/>
															</Form.Item>
														</div>
														<div className='col'>
															<Form.Item name={'loai_don_thuoc'}>
																<Select
																	placeholder='Loại đơn thuốc'
																	onChange={(val) => {
																		const newCode = generatePrescriptionCode(
																			facilityCode,
																			val
																		);
																		setPrescriptionCode(newCode);
																	}}
																	options={[
																		{ label: 'Cơ bản', value: 'c' },
																		{ label: 'Gây nghiện', value: 'n' },
																		{ label: 'Hướng thần', value: 'h' },
																		{ label: 'YHCT', value: 'y' },
																	]}
																/>
															</Form.Item>
														</div>
													</div>
												</Form>
												<Form
													layout='vertical'
													className='mb-0'
													form={formPres}
													onFinish={handleAddMedicine}
													variant='filled'>
													<div
														className='row'
														style={{
															padding: 0,
															margin: 0,
														}}>
														<div
															className='col-11'
															style={{
																padding: 0,
															}}>
															<div className='row'>
																<div className='col-4'>
																	<div className='d-none'>
																		<Form.Item name={'ma_thuoc'}>
																			<Input />
																		</Form.Item>
																	</div>

																	<Form.Item
																		rules={[
																			{
																				required: true,
																				message: 'Nhập tên thuốc',
																			},
																		]}
																		name={'ten_thuoc'}
																		label='Tên thuốc'>
																		<AutoComplete
																			ref={medicineNameRef}
																			autoFocus
																			onSelect={(name) => {
																				const medicine = medicines.find(
																					(element) =>
																						element.ten_thuoc === name
																				);
																				formPres.setFieldsValue(medicine);

																				quantityRef.current.focus();
																			}}
																			placeholder='Tên thuốc'
																			allowClear
																			options={medicines.map((item) => ({
																				label: item.ten_thuoc,
																				value: item.ten_thuoc,
																			}))}
																		/>
																	</Form.Item>
																</div>
																<div className='col-2'>
																	<Form.Item
																		rules={[
																			{
																				required: true,
																				message: 'Nhập số lượng thuốc',
																			},
																		]}
																		name={'quantity'}
																		label='Số lượng'>
																		<InputNumber
																			ref={quantityRef}
																			placeholder=''
																			min={0}
																		/>
																	</Form.Item>
																</div>
																<div className='col-2'>
																	<Form.Item name={'unit'} label='ĐVT'>
																		<Select
																			options={[
																				{ label: 'Viên', value: 'viên' },
																				{ label: 'Ống', value: 'ống' },
																				{ label: 'Gói', value: 'gói' },
																				{ label: 'Chai', value: 'chai' },
																				{ label: 'Lọ', value: 'lọ' },
																				{ label: 'Tuýp', value: 'tuýp' },
																				{ label: 'Vỉ', value: 'vỉ' },
																				{ label: 'Ml', value: 'ml' },
																				{ label: 'Gam', value: 'g' },
																				{ label: 'Miếng', value: 'miếng' },
																			]}
																		/>
																	</Form.Item>
																</div>
																<div className='col-4'>
																	<Form.Item
																		name={'instruction'}
																		label='Cách dùng'>
																		<AutoComplete
																			onSelect={handleAddMedicine}
																			allowClear
																			options={[
																				{
																					label:
																						'Uống sau ăn, sáng 1 viên, chiều 1 viên',
																					value:
																						'Uống sau ăn, sáng 1 viên, chiều 1 viên',
																				},
																				{
																					label: 'Uống trước ăn, sáng 1 viên',
																					value: 'Uống trước ăn, sáng 1 viên',
																				},
																				{
																					label:
																						'Uống sau ăn, ngày 2 lần, mỗi lần 1 viên',
																					value:
																						'Uống sau ăn, ngày 2 lần, mỗi lần 1 viên',
																				},
																				{
																					label: 'Uống trước khi ngủ, 1 viên',
																					value: 'Uống trước khi ngủ, 1 viên',
																				},
																				{
																					label: 'Uống sáng 1 viên, tối 1 viên',
																					value: 'Uống sáng 1 viên, tối 1 viên',
																				},
																				{
																					label: 'Uống mỗi 8 giờ, 1 viên/lần',
																					value: 'Uống mỗi 8 giờ, 1 viên/lần',
																				},
																			]}
																		/>
																	</Form.Item>
																</div>
															</div>
														</div>
														<div
															className='col text-end'
															style={{
																padding: 0,
															}}>
															<Form.Item label=' '>
																<Tooltip title='Thêm thuốc vào đơn thuốc'>
																	<Button
																		type='primary'
																		onClick={() => formPres.submit()}
																		icon={<IoIosAdd size={20} />}
																	/>
																</Tooltip>
															</Form.Item>
														</div>
													</div>
												</Form>
											</>
										}
										dataSource={prescriptionItems}
										renderItem={(item) => (
											<List.Item
												key={`${item.id}`}
												extra={
													<Space>
														{`${item.quantity} ${item.unit}`}
														<Divider type='vertical' />
														<Button
															type='link'
															icon={<BiEdit size={20} />}
															size='small'
															onClick={() => {
																formPres.setFieldsValue(item);
																quantityRef.current.focus();
															}}
														/>
													</Space>
												}>
												<List.Item.Meta title={`${item.ten_thuoc}`} />
											</List.Item>
										)}
									/>
								</Card>
							</div>
						</div>

						<div className='text-end mt-3'>
							<Space>
								<Button danger type='text'>
									Huỷ bỏ
								</Button>
								<Divider type='vertical' />
								<Button type='link'>Gửi lên HTDTQG</Button>
								<Divider type='vertical' />
								<Button icon={<FaPrint size={16} className='text-muted' />}>
									In
								</Button>
								<Button
									onClick={() => form.submit()}
									className='px-5'
									type='primary'>
									Lưu và In
								</Button>
							</Space>
						</div>
					</>
				) : (
					<Typography.Paragraph type='secondary'>
						Không tìm thấy thông tin bệnh nhân
					</Typography.Paragraph>
				)}
			</div>
		</div>
	);
};

export default AddPrescription;
