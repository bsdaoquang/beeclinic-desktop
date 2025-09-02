/** @format */

import {
	Button,
	Card,
	Checkbox,
	Descriptions,
	Divider,
	Form,
	Input,
	List,
	message,
	Popover,
	Select,
	Space,
	Spin,
	Tabs,
	Tooltip,
	Typography,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useRef, useState } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import { BsArrowRight } from 'react-icons/bs';
import { FaSave } from 'react-icons/fa';
import { FaPrint } from 'react-icons/fa6';
import { RxInfoCircled } from 'react-icons/rx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ServicesList } from '../components';
import MedicinesList from '../components/MedicinesList';
import { PrescriptionPrint } from '../printPages';
import type { ClinicModel } from '../types/ClinicModel';
import type { PatientModel } from '../types/PatientModel';
import type {
	PrescriptionItem,
	PrescriptionModel,
} from '../types/PrescriptionModel';
import type { ServiceModel } from '../types/ServiceModel';
import { formatDateToString, getShortDateTime } from '../utils/datetime';
import { numToString } from '../utils/numToString';
import { generatePrescriptionCode } from '../utils/prescriptions';
import { replaceName } from '../utils/replaceName';
import { useDebounce } from 'use-debounce';

const AddPrescription = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [patient, setPatient] = useState<PatientModel>();
	const [prescriptionItems, setPrescriptionItems] = useState<
		PrescriptionItem[]
	>([]);
	const [prescriptionServices, setPrescriptionServices] = useState<
		ServiceModel[]
	>([]);
	const [prescriptionCode, setPrescriptionCode] = useState('');
	const [isAsync, setIsAsync] = useState<null | boolean>(null);
	const [diagnostics, setDiagnostics] = useState<string[]>([]);
	const [isPrint, setIsPrint] = useState(false);

	const [prescriptionsByPatient, setPrescriptionsByPatient] = useState<
		PrescriptionModel[]
	>([]);
	const [congkham, setCongkham] = useState(0);
	const [diagnosisOptions, setDiagnosisOptions] = useState<
		{
			label: string;
			value: string;
		}[]
	>([]);

	const query = new URLSearchParams(useLocation().search);
	const patientId = query.get('patient-id');
	const [form] = Form.useForm();
	const [formPres] = Form.useForm();
	const [messageAPI, messHolder] = message.useMessage();
	const [searchText, setSearchText] = useState('');
	const [searchKey] = useDebounce(searchText, 300);

	const printRef = useRef<HTMLDivElement>(null);
	const clinic: ClinicModel | undefined = localStorage.getItem('clinic')
		? JSON.parse(localStorage.getItem('clinic')!)
		: undefined;

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
		setPrescriptionCode(generatePrescriptionCode(clinic?.CSKCBID ?? '', 'c'));
		clinic && clinic.CongKham && setCongkham(clinic.CongKham);

		// Kiểm tra xem có accesstoken của hệ thống đơn thuốc quốc gia không? nếu có thì bật đồng bộ, không thì thôi

		// Lấy danh sách những chẩn đoán trước đó của phòng khám
		getAllDiagnosis();

		// Lấy danh sách lịch sử khám của bệnh nhân
		getPrescriptionsByPatientId();
	}, []);

	useEffect(() => {
		if (patientId) {
			getPatientDetail();
		}
	}, [patientId]);

	useEffect(() => {
		if (searchKey && searchKey.length >= 3) {
			getIcd10Diagnosis(searchKey);
		}
	}, [searchKey]);

	const getIcd10Diagnosis = async (key: string) => {
		const text = replaceName(key);
		try {
			const res = await (window as any).beeclinicAPI.searchIcdDiagnosis(text);
			setDiagnosisOptions(
				res.map((item: any) => ({
					label: item,
					value: item,
				}))
			);
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

		if (prescriptionItems.length === 0 && prescriptionServices.length === 0) {
			messageAPI.error(
				'Vui lòng thêm ít nhất một thuốc hoặc một dịch vụ vào đơn'
			);
			return;
		}
		const prescriptionData = {
			ma_don_thuoc: prescriptionCode,
			patient_id: patient.id,
			loai_don_thuoc: vals.loai_don_thuoc,
			diagnosis: vals.diagnosis.toString(),
			note: vals.note ?? '',
			ngay_gio_ke_don: new Date().toISOString(),
			ngay_tai_kham: vals.ngay_tai_kham ?? null,
			thong_tin_don_thuoc_json: prescriptionItems,
			thong_tin_dich_vu_json: prescriptionServices,
			// Tổng tiền = tiền thuốc + tiền dịch vụ + công khám
			total:
				prescriptionItems.reduce(
					(acc, item) => acc + (item.gia_ban || 0) * (item.quantity || 0),
					0
				) +
				prescriptionServices.reduce((acc, item) => acc + (item.gia || 0), 0) +
				(congkham ?? 0),
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
				navigate(-1);
			}
		} catch (error) {
			console.log(error);
			messageAPI.error('Lưu đơn thuốc thất bại');
		}
	};

	const getAllDiagnosis = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getDiagnosis();
			setDiagnosisOptions(
				res.map((item: any) => ({
					label: item,
					value: item,
				}))
			);
		} catch (error) {
			console.log(error);
		}
	};

	const getPrescriptionsByPatientId = async () => {
		try {
			const res = await (
				window as any
			).beeclinicAPI.getPrescriptionsByPatientId(patientId);
			setPrescriptionsByPatient(res);
		} catch (error) {
			console.log(error);
		}
	};

	const handleAsyncPrescription = async (prescriptionData: any) => {
		console.log('Sending prescription to national system:', prescriptionData);
	};

	return (
		<div className='container-fluid'>
			{messHolder}
			<div className='py-3'>
				{isLoading ? (
					<div className='text-center p-5'>
						<Spin />
					</div>
				) : patient ? (
					<>
						<div className='row'>
							<div className='col-3 d-sm-none d-md-block'>
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
										<List
											style={{
												maxHeight: '320px',
												overflowY: 'auto',
											}}
											bordered={false}
											dataSource={prescriptionsByPatient}
											rowKey={(item) => `${item.ma_don_thuoc}`}
											renderItem={(item) => (
												<List.Item
													actions={[
														<Popover
															content={() => {
																const vals: PrescriptionItem[] =
																	item.thong_tin_don_thuoc_json
																		? JSON.parse(item.thong_tin_don_thuoc_json)
																		: [];

																return (
																	<div
																		style={{
																			width: 450,
																		}}>
																		<List
																			style={{
																				maxHeight: '50vh',
																				overflowY: 'auto',
																			}}
																			dataSource={vals}
																			renderItem={(medicine, index) => (
																				<List.Item key={`medicine${item.id}`}>
																					<List.Item.Meta
																						title={`${numToString(
																							index + 1
																						)}. ${medicine.ten_thuoc} x ${
																							medicine.quantity
																						} ${medicine.unit}`}
																						description={medicine.instruction}
																					/>
																				</List.Item>
																			)}
																		/>
																		<div className='text-end'>
																			<Button
																				iconPosition='end'
																				icon={<BsArrowRight size={16} />}
																				type='link'
																				onClick={() => {
																					form.setFieldsValue({
																						diagnosis: item.diagnosis.replace(
																							', ',
																							'/'
																						),
																					});
																					setPrescriptionItems(vals);
																				}}>
																				Sử dụng lại
																			</Button>
																		</div>
																	</div>
																);
															}}
															title='Thông tin thuốc'>
															<RxInfoCircled size={22} />
														</Popover>,
													]}>
													<List.Item.Meta
														title={item.diagnosis.replace(',', ' / ')}
														description={getShortDateTime(
															item.created_at as string
														)}
													/>
												</List.Item>
											)}
										/>
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
									<Form
										layout='vertical'
										variant='filled'
										onFinish={handleAddPrescription}
										form={form}>
										<div className='row'>
											<div className='col-8'>
												<Form.Item name={'reason_for_visit'}>
													<Input placeholder='Lý do đến khám' allowClear />
												</Form.Item>
											</div>
											<div className='col'>
												<Form.Item name={'loai_don_thuoc'}>
													<Select
														placeholder='Loại đơn thuốc'
														onChange={(val) => {
															const newCode = generatePrescriptionCode(
																clinic?.CSKCBID ?? '',
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

										<Form.Item name={'disease_progression'}>
											<TextArea
												rows={3}
												allowClear
												placeholder='Diễn tiến bệnh'
											/>
										</Form.Item>

										<Form.Item
											help='Nhập hoặc tìm kiếm chẩn đoán, có thể chọn nhiều chẩn đoán bằng cách nhập và nhấn Enter.'
											rules={[
												{
													required: true,
													message: 'Nhập chẩn đoán',
												},
											]}
											name={'diagnosis'}>
											<Select
												mode='tags'
												onChange={(val) => setDiagnostics(val)}
												showSearch
												options={diagnosisOptions}
												filterOption={(input, option) => {
													return option
														? replaceName(option.label).includes(
																replaceName(input)
														  )
														: false;
												}}
												onSearch={async (val) => {
													if (val && val.length >= 3) {
														setSearchText(val);
													} else {
														getAllDiagnosis();
													}
												}}
												onSelect={() => setSearchText('')}
												allowClear
												placeholder='Chẩn đoán'
												notFoundContent={'Không tìm thấy chẩn đoán phù hợp'}
											/>
										</Form.Item>
									</Form>
									<Tabs
										className='mt-5'
										size='small'
										type='card'
										items={[
											{
												key: '1',
												label: 'Thuốc',
												children: (
													<MedicinesList
														prescriptionItems={prescriptionItems}
														onChange={setPrescriptionItems}
														clinic={clinic}
													/>
												),
											},
											{
												key: '2',
												label: 'Dịch vụ - Thủ thuật',
												children: (
													<ServicesList
														prescriptionItems={prescriptionServices}
														onChange={setPrescriptionServices}
													/>
												),
											},
										]}
									/>
								</Card>
							</div>
							<div className='col-3 d-sm-none d-md-block'>
								<Card
									title='Thông tin phiên khám'
									size='small'
									style={{
										height: 'calc(100vh - 190px)',
										overflow: 'auto',
									}}>
									<Descriptions column={1} size='small'>
										<Descriptions.Item label='Ngày khám'>
											{new Date().toLocaleString('vi-VN')}
										</Descriptions.Item>
										<Descriptions.Item label='Công khám'>
											<Typography.Text
												className='mb-0'
												editable={{
													text: congkham.toLocaleString('vi-VN', {
														style: 'currency',
														currency: 'VND',
													}),
													onChange: (value) => {
														setCongkham(value ? parseInt(value, 10) : 0);
													},
												}}>
												{congkham.toLocaleString('vi-VN', {
													style: 'currency',
													currency: 'VND',
												})}
											</Typography.Text>
										</Descriptions.Item>
										<Descriptions.Item label='Thuốc'>
											{prescriptionItems
												.reduce(
													(acc, item) =>
														acc + (item.gia_ban ?? 0) * (item.quantity ?? 0),
													0
												)
												.toLocaleString('vi-VN', {
													style: 'currency',
													currency: 'VND',
												})}
										</Descriptions.Item>
										<Descriptions.Item label='Dịch vụ'>
											{prescriptionServices
												.reduce((acc, item) => acc + (item.gia ?? 0), 0)
												.toLocaleString('vi-VN', {
													style: 'currency',
													currency: 'VND',
												})}
										</Descriptions.Item>
										<Divider />
										<Descriptions.Item label='Tổng tiền'>
											<Typography.Title level={5} className='mb-1'>
												{(
													congkham +
													prescriptionItems.reduce(
														(acc, item) =>
															acc + (item.gia_ban ?? 0) * (item.quantity ?? 0),
														0
													) +
													prescriptionServices.reduce(
														(acc, item) => acc + (item.gia ?? 0),
														0
													)
												).toLocaleString('vi-VN', {
													style: 'currency',
													currency: 'VND',
												})}
											</Typography.Title>
										</Descriptions.Item>
									</Descriptions>
									<Divider />
									<Space className='mt-1'>
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
											type='primary'>
											Lưu và In
										</Button>
									</Space>
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
						clinic={clinic}
						patient={patient}
						prescriptionItems={prescriptionItems}
						diagnostic={diagnostics.toString()}
						prescriptionCode={prescriptionCode}
					/>
				</div>
			)}
		</div>
	);
};

export default AddPrescription;
