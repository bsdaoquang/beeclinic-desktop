/** @format */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PatientModel } from '../types/PatientModel';
import {
	AutoComplete,
	Button,
	Card,
	Checkbox,
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
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { generatePrescriptionCode, randomAlnum } from '../utils/prescriptions';
import TextArea from 'antd/es/input/TextArea';
import { IoIosAdd } from 'react-icons/io';
import { BiEdit, BiInfoCircle, BiTrash } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import { FaSave } from 'react-icons/fa';
import { PrescriptionPrint } from '../printPages';
import { useReactToPrint } from 'react-to-print';

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
	const [isAsync, setIsAsync] = useState<null | boolean>(null);
	const [diagnossic, setDiagnossic] = useState('');
	const [isPrint, setIsPrint] = useState(false);

	const query = new URLSearchParams(useLocation().search);
	const patientId = query.get('patient-id');
	const [form] = Form.useForm();
	const [formPres] = Form.useForm();
	const [messageAPI, messHolder] = message.useMessage();

	const medicineNameRef = useRef<any>(null);
	const quantityRef = useRef<any>(null);
	const printRef = useRef<HTMLDivElement>(null);

	const printPrescription = useReactToPrint({
		contentRef: printRef,
		pageStyle: `
			@page {
				size: A5 portrait;
				margin: 1cm;
			}
			@media print {
				body {
					-webkit-print-color-adjust: exact;
				}
			}
		`,
		onAfterPrint: () => {
			navigate(-1);
		},
	});

	const navigate = useNavigate();

	useEffect(() => {
		form.setFieldValue('loai_don_thuoc', 'c');
		formPres.setFieldValue('unit', 'viên');
		setPrescriptionCode(generatePrescriptionCode(facilityCode, 'c'));

		// Kiểm tra xem có accesstoken của hệ thống đơn thuốc quốc gia không? nếu có thì bật đồng bộ, không thì thôi
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

	const handleAddPrescription = async (vals: any) => {
		// save to database
		if (!patient) {
			messageAPI.error('Không tìm thấy thông tin bệnh nhân');
			return;
		}

		if (prescriptionItems.length === 0) {
			messageAPI.error('Vui lòng thêm ít nhất một thuốc vào đơn');
			return;
		}
		/*
				Prescription in DB
				ma_don_thuoc,
				patient_id,
				loai_don_thuoc,
				diagnosis,
				note,
				ngay_gio_ke_don,
				ngay_tai_kham,
				thong_tin_don_thuoc_json,
				sent,
				sent_at,
				created_at,
				reason_for_visit,
				disease_progression
			*/
		const prescriptionData = {
			ma_don_thuoc: prescriptionCode,
			patient_id: patient.id,
			loai_don_thuoc: vals.loai_don_thuoc,
			diagnosis: vals.diagnosis,
			note: vals.note ?? '',
			ngay_gio_ke_don: new Date().toISOString(),
			ngay_tai_kham: vals.ngay_tai_kham ?? null,
			thong_tin_don_thuoc_json: JSON.stringify(prescriptionItems),
			sent: isAsync ? 1 : 0,
			sent_at: null,
			created_at: new Date().toISOString(),
			reason_for_visit: vals.reason_for_visit ?? '',
			disease_progression: vals.disease_progression ?? '',
		};
		try {
			isAsync && handleAsyncPrescription(prescriptionData);

			await (window as any).beeclinicAPI.addPrescription(prescriptionData);
			messageAPI.success('Lưu đơn thuốc thành công');

			if (isPrint) {
				printPrescription();
			} else {
				// navigate(-1);
			}
		} catch (error) {
			console.log(error);
			messageAPI.error('Lưu đơn thuốc thất bại');
		}
	};

	const handleAddMedicine = async (vals: any) => {
		if (!vals.quantity || vals.quantity <= 0) {
			messageAPI.error('Số lượng thuốc phải lớn hơn 0');
			quantityRef.current.focus();
			return;
		}
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
						quantity: count < 0 ? 0 : count,
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

	const handleAsyncPrescription = async (prescriptionData: any) => {
		console.log('Sending prescription to national system:', prescriptionData);
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
																	onChange={(val) => setDiagnossic(val)}
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
																				formPres.setFieldsValue({
																					...medicine,
																					quantity: 1,
																				});
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
										renderItem={(item, index) => (
											<List.Item
												style={{
													alignItems: 'flex-start',
												}}
												key={`${item.id}`}
												extra={
													<Space>
														{`${item.quantity} ${item.unit}`}
														<Divider type='vertical' />
														<Tooltip title='Chỉnh sửa'>
															<Button
																type='link'
																icon={<BiEdit size={20} />}
																size='small'
																onClick={() => {
																	formPres.setFieldsValue(item);
																	quantityRef.current.focus();
																}}
															/>
														</Tooltip>
														<Tooltip title='Xoá khỏi đơn thuốc'>
															<Button
																type='link'
																danger
																icon={<IoClose size={23} />}
																size='small'
																onClick={() => {
																	setMedicines([...medicines, item]);
																	const newItems = [...prescriptionItems];
																	newItems.splice(index, 1);
																	setPrescriptionItems(newItems);
																}}
															/>
														</Tooltip>
													</Space>
												}>
												<List.Item.Meta
													title={`${item.ten_thuoc}`}
													description={
														<Typography.Text
															type='secondary'
															style={{
																fontSize: 13,
															}}>{`${item.instruction}`}</Typography.Text>
													}
												/>
											</List.Item>
										)}
									/>
								</Card>
							</div>
						</div>

						<div className='row mt-3'>
							<div className='col'>
								<Checkbox
									disabled={!isAsync}
									checked={isAsync ?? false}
									onChange={(e) => setIsAsync(e.target.checked)}>
									Đồng bộ lên hệ thống đơn thuốc Quốc Gia{' '}
									<Tooltip title='Đồng bộ lên hệ thống đơn thuốc Quốc Gia để quản lý và theo dõi, đăng nhập vào hệ thống để lấy access token'>
										<BiInfoCircle
											size={18}
											style={{ fontSize: 12, marginLeft: 4 }}
										/>
									</Tooltip>
								</Checkbox>
							</div>

							<div className='col text-end'>
								<Space>
									<Button danger type='text' onClick={() => navigate(-1)}>
										Huỷ bỏ
									</Button>
									<Divider type='vertical' />
									<Button
										onClick={() => form.submit()}
										icon={<FaSave size={16} className='text-muted' />}>
										Lưu
									</Button>
									<Button
										icon={<FaPrint size={16} className='text-white' />}
										onClick={() => {
											setIsPrint(true);
											form.submit();
										}}
										className='px-5'
										type='primary'>
										Lưu và In
									</Button>
								</Space>
							</div>
						</div>
					</>
				) : (
					<Typography.Paragraph type='secondary'>
						Không tìm thấy thông tin bệnh nhân
					</Typography.Paragraph>
				)}
			</div>

			{prescriptionItems.length > 0 && patient && (
				<div className='d-none d-print-block' ref={printRef}>
					<PrescriptionPrint
						patient={patient}
						prescriptionItems={prescriptionItems}
						diagnostic={diagnossic}
						prescriptionCode={prescriptionCode}
					/>
				</div>
			)}
		</div>
	);
};

export default AddPrescription;
