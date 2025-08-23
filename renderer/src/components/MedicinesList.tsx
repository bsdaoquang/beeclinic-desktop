/** @format */

import {
	AutoComplete,
	Button,
	Divider,
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
import { BiEdit } from 'react-icons/bi';
import { IoIosAdd } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import type { ClinicModel } from '../types/ClinicModel';
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { randomAlnum } from '../utils/prescriptions';

export interface MedicineListProps {
	prescriptionItems: PrescriptionItem[];
	onChange: (prescriptionItems: PrescriptionItem[]) => void;
	clinic?: ClinicModel;
}

const MedicinesList = ({ prescriptionItems, onChange }: MedicineListProps) => {
	const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);

	const [messageAPI, messHolder] = message.useMessage();
	const quantityRef = useRef<any>(null);
	const medicineNameRef = useRef<any>(null);
	const [formPres] = Form.useForm();

	useEffect(() => {
		getAllMedicines();
	}, []);

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
		} else {
			const newPresItems = [...prescriptionItems];
			newPresItems[indexMedicine] = vals;
			onChange(newPresItems);
		}

		formPres.resetFields();
		medicineNameRef.current.focus();
	};

	return (
		<div>
			{messHolder}
			<List
				header={
					<>
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
															(element) => element.ten_thuoc === name
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
												<InputNumber ref={quantityRef} placeholder='' min={0} />
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
											<Form.Item name={'instruction'} label='Cách dùng'>
												<AutoComplete
													onSelect={handleAddMedicine}
													allowClear
													options={[
														{
															label: 'Uống sau ăn, sáng 1 viên, chiều 1 viên',
															value: 'Uống sau ăn, sáng 1 viên, chiều 1 viên',
														},
														{
															label: 'Uống trước ăn, sáng 1 viên',
															value: 'Uống trước ăn, sáng 1 viên',
														},
														{
															label: 'Uống sau ăn, ngày 2 lần, mỗi lần 1 viên',
															value: 'Uống sau ăn, ngày 2 lần, mỗi lần 1 viên',
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
								<div className='d-none'>
									<Form.Item name={'gia_ban'}>
										<InputNumber />
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
						key={`prescription-item-${index}`}
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
									type='secondary'
									style={{
										fontSize: 13,
									}}>{`${item.instruction}`}</Typography.Text>
							}
						/>
					</List.Item>
				)}
			/>
		</div>
	);
};

export default MedicinesList;
