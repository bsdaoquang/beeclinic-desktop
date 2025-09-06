/** @format */

import {
	AutoComplete,
	Button,
	Checkbox,
	Divider,
	Drawer,
	Form,
	Input,
	InputNumber,
	List,
	message,
	Select,
	Space,
	Tooltip,
	Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { IoIosAdd } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import type { ClinicModel } from '../types/ClinicModel';
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { randomAlnum } from '../utils/prescriptions';
import { replaceName } from '../utils/replaceName';

export interface MedicineListProps {
	prescriptionItems: PrescriptionItem[];
	onChange: (prescriptionItems: PrescriptionItem[]) => void;
	clinic?: ClinicModel;
}

const MedicinesList = ({ prescriptionItems, onChange }: MedicineListProps) => {
	const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);

	const [messageAPI, messHolder] = message.useMessage();
	const [isAddMedicine, setIsAddMedicine] = useState(false);
	const [dosages, setDosages] = useState<{
		sang: number | null;
		trua: number | null;
		toi: number | null;
	}>({
		sang: null,
		trua: null,
		toi: null,
	});
	const [days, setDays] = useState(7);

	const quantityRef = useRef<any>(null);
	const medicineNameRef = useRef<any>(null);
	const sangref = useRef<any>(null);
	const truaRef = useRef<any>(null);
	const toiRef = useRef<any>(null);
	const [formPres] = Form.useForm();

	useEffect(() => {
		getAllMedicines();
	}, []);

	useEffect(() => {
		formPres.setFieldValue('unit', 'viên');
	}, [isAddMedicine]);

	useEffect(() => {
		handleQuantity();
	}, [dosages, days]);

	const handleQuantity = (val?: string) => {
		if (days) {
			const unit = (
				val ? val : formPres.getFieldValue('unit') ?? ''
			).toLowerCase();
			formPres.setFieldValue(
				'instruction',
				`Uống ${days ? `${days} ngày: ` : ''}${
					dosages.sang ? `sáng ${dosages.sang} ${unit}, ` : ''
				}${dosages.trua ? `trưa ${dosages.trua} ${unit}, ` : ''}${
					dosages.toi ? `tối ${dosages.toi} ${unit}` : ''
				}`
			);

			const total =
				(dosages.sang ?? 0) + (dosages.trua ?? 0) + (dosages.toi ?? 0);

			formPres.setFieldValue('quantity', total * days);
		}
	};

	const getAllMedicines = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getMedicines();
			setMedicines(res);
		} catch (error) {
			console.log(error);
		}
	};

	const handleAddMedicine = async (vals: any) => {
		if (!vals.quantity || vals.quantity <= 0) {
			messageAPI.error('Số lượng thuốc phải lớn hơn 0');
			quantityRef.current.focus();
			return;
		}

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
				// Cập nhật số lượng trong kho nếu có khóa kích hoạt

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
					expDate: vals.expDate ? vals.expDate.toISOString() : null,
					gia_mua: vals.gia_mua ?? 0,
					gia_ban: vals.gia_ban ?? 0,
				};

				items.push(newMedicine);
				setMedicines(items);
				await (window as any).beeclinicAPI.addMedicine(newMedicine);
				onChange([...prescriptionItems, vals]);
			}
			// prescriptionItems.push(vals);
			onChange([...prescriptionItems, vals]);

			const isContinue = vals.isContinue;
			setDosages({
				sang: null,
				toi: null,
				trua: null,
			});

			if (isContinue) {
				formPres.resetFields();
				setDays(7);
				formPres.setFieldValue('quantity', null);
			} else {
				setIsAddMedicine(false);
			}
		} else {
			const newPresItems = [...prescriptionItems];
			newPresItems[indexMedicine] = vals;
			onChange(newPresItems);
		}

		formPres.resetFields();
		medicineNameRef.current.focus();
	};

	return (
		<div className='mt-0'>
			{messHolder}
			<List
				footer={
					<div className='text-center'>
						<Button
							onClick={() => setIsAddMedicine(true)}
							type='link'
							icon={<IoIosAdd size={22} />}>
							Thêm thuốc
						</Button>
					</div>
				}
				header={null}
				dataSource={prescriptionItems}
				locale={{ emptyText: 'Chưa có thuốc trong đơn' }}
				renderItem={(item, index) => (
					<List.Item
						style={{
							alignItems: 'flex-start',
						}}
						key={`prescription-item-${index}`}
						extra={
							<Space>
								<Typography.Text
									style={{ fontSize: 16 }}
									editable={{
										onChange: (val) => {
											const newItems = [...prescriptionItems];
											newItems[index].quantity = Number(val);
											onChange(newItems);
										},
									}}>
									{item.quantity}
								</Typography.Text>
								<Typography.Text>{item.unit ? item.unit : ''}</Typography.Text>
								<Divider type='vertical' />

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
											onChange(newItems);
										}}
									/>
								</Tooltip>
							</Space>
						}>
						<List.Item.Meta
							title={`${item.ten_thuoc}`}
							description={
								<Typography.Text
									editable={{
										onChange: (val) => {
											const newItems = [...prescriptionItems];
											newItems[index].instruction = val;
											onChange(newItems);
										},
									}}
									type='secondary'
									style={{
										fontSize: 13,
									}}>{`${item.instruction}`}</Typography.Text>
							}
						/>
					</List.Item>
				)}
			/>
			<Drawer
				placement='right'
				onClose={() => {
					setIsAddMedicine(false);
					formPres.resetFields();
					setDays(7);
					setDosages({
						sang: null,
						toi: null,
						trua: null,
					});
					formPres.setFieldValue('quantity', null);
				}}
				open={isAddMedicine}
				width={'30%'}
				title='Kê đơn thuốc'>
				<Form
					layout='vertical'
					size='large'
					form={formPres}
					onFinish={handleAddMedicine}
					variant='filled'>
					<div className='d-none'>
						<Form.Item name='ma_thuoc'>
							<Input />
						</Form.Item>
						<Form.Item name='isContinue'>
							<Checkbox />
						</Form.Item>
					</div>
					<Form.Item
						name='ten_thuoc'
						label='Tên thuốc'
						rules={[{ required: true, message: 'Vui lòng nhập tên thuốc' }]}>
						<AutoComplete
							ref={medicineNameRef}
							autoFocus
							showSearch
							filterOption={(inputValue, option) =>
								replaceName(option!.value).includes(replaceName(inputValue))
							}
							filterSort={(optionA, optionB) =>
								(optionA!.value ?? '')
									.toLowerCase()
									.localeCompare((optionB!.value ?? '').toLowerCase())
							}
							style={{ width: '100%' }}
							onSelect={(name) => {
								const medicine = medicines.find(
									(element) => element.ten_thuoc === name
								);
								formPres.setFieldsValue({
									...medicine,
								});
								quantityRef.current?.focus();
								handleQuantity(medicine?.unit ?? undefined);
							}}
							placeholder='Tên thuốc'
							allowClear
							showSearch
							style={{ width: '100%' }}
							filterSort={(optionA, optionB) =>
								(optionA?.value ?? '').localeCompare(optionB?.value ?? '')
							}
							filterOption={(inputValue, option) =>
								replaceName(option?.value ?? '').includes(
									replaceName(inputValue)
								)
							}
							options={medicines.map((item) => ({
								label: item.ten_thuoc,
								value: item.ten_thuoc,
							}))}
						/>
					</Form.Item>
					<div className='row'>
						<div className='col'>
							<Form.Item name='unit' label='Đơn vị'>
								<Select
									onChange={(value) => handleQuantity(value)}
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
						<div className='col'>
							<Form.Item
								name='quantity'
								label='Số lượng'
								rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
								<InputNumber
									ref={quantityRef}
									min={1}
									style={{
										width: '100%',
									}}
									placeholder='Nhập số lượng'
								/>
							</Form.Item>
						</div>
						<div className='col'>
							<Form.Item label='Số ngày'>
								<InputNumber
									min={1}
									value={days}
									onChange={(val) => setDays(val ?? 0)}
									style={{ width: '100%' }}
									placeholder='Nhập số ngày'
								/>
							</Form.Item>
						</div>
					</div>

					<Divider orientation='left'>Cách dùng</Divider>
					<div className='row'>
						<div className='col'>
							<Form.Item label='Sáng'>
								<InputNumber
									ref={sangref}
									min={0}
									value={dosages.sang}
									onChange={(val) => {
										setDosages({
											...dosages,
											sang: val,
										});
									}}
									style={{ width: '100%' }}
								/>
							</Form.Item>
						</div>
						<div className='col'>
							<Form.Item label='Trưa'>
								<InputNumber
									ref={truaRef}
									min={0}
									value={dosages.trua}
									onChange={(val) => {
										setDosages({
											...dosages,
											trua: val,
										});
									}}
									style={{ width: '100%' }}
								/>
							</Form.Item>
						</div>
						<div className='col'>
							<Form.Item label='Tối'>
								<InputNumber
									ref={toiRef}
									min={0}
									value={dosages.toi}
									onChange={(val) =>
										setDosages({
											...dosages,
											toi: val,
										})
									}
									style={{
										width: '100%',
									}}
								/>
							</Form.Item>
						</div>
					</div>

					<Form.Item name='instruction' label='Hướng dẫn sử dụng'>
						<Input.TextArea rows={2} placeholder='Nhập hướng dẫn sử dụng' />
					</Form.Item>
				</Form>
				<div className='mt-3 '>
					<Space>
						<Button danger onClick={() => setIsAddMedicine(false)}>
							Đóng
						</Button>
						<Divider type='vertical' size='large' />
						<Button
							type='default'
							onClick={() => {
								formPres.setFieldValue('isContinue', false);
								formPres.submit();
							}}>
							Thêm
						</Button>
						<Button
							type='primary'
							onClick={() => {
								formPres.setFieldValue('isContinue', true);
								formPres.submit();
							}}>
							Thêm và tiếp tục
						</Button>
					</Space>
				</div>
			</Drawer>
		</div>
	);
};

export default MedicinesList;
