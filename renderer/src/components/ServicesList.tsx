/** @format */

import { Button, Divider, List, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { IoIosAdd } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import { AddService } from '../modals';
import type { ServiceModel } from '../types/ServiceModel';
import { replaceName } from '../utils/replaceName';

export interface ServicesListProps {
	prescriptionItems: ServiceModel[];
	onChange: (items: ServiceModel[]) => void;
}

const ServicesList = ({ prescriptionItems, onChange }: ServicesListProps) => {
	const [services, setServices] = useState<ServiceModel[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');
	const [isAddService, setIsAddService] = useState(false);

	const inpRef = useRef<any>(null);

	useEffect(() => {
		getAllServices();
	}, []);

	const handleAddService = (id: string) => {
		const service = services.find((s) => `${s.id}` === `${id}`);
		if (service) {
			onChange([...prescriptionItems, service]);

			const index = services.findIndex((s) => `${s.id}` === `${id}`);
			if (index !== -1) {
				services.splice(index, 1);
			}
		}

		setSearchValue('');
		inpRef.current?.focus();
	};

	const getAllServices = async () => {
		try {
			const res = await (window as any).beeclinicAPI.getServices();
			setServices(res);
		} catch (error) {
			console.log(`Can not get services: `, error);
		}
	};

	return (
		<div>
			<List
				header={
					<Select
						notFoundContent={<div>Không tìm thấy dịch vụ</div>}
						ref={inpRef}
						style={{
							width: '100%',
						}}
						showSearch
						value={searchValue}
						allowClear
						onChange={(text) => setSearchValue(text)}
						options={services.map((service) => ({
							value: service.id,
							label: service.ten_dich_vu,
						}))}
						filterSort={(optionA, optionB) =>
							(optionA.label ?? '')
								.toLowerCase()
								.localeCompare((optionB.label ?? '').toLowerCase())
						}
						popupRender={(menus) => (
							<>
								{menus}
								<Divider className='p-0 m-2' />
								<Button
									icon={<IoIosAdd size={22} />}
									onClick={() => setIsAddService(true)}
									type='link'>
									Thêm dịch vụ mới
								</Button>
							</>
						)}
						filterOption={(inputValue, option) =>
							option?.label
								? replaceName(option?.label).includes(replaceName(inputValue))
								: false
						}
						onSelect={(val) => handleAddService(val)}
						placeholder='Chọn dịch vụ'
					/>
				}
				dataSource={prescriptionItems}
				rowKey={(item) => `service-${item.id}`}
				locale={{ emptyText: 'Không có dịch vụ nào được chọn' }}
				renderItem={(item) => (
					<List.Item
						extra={
							<Button
								type='text'
								size='small'
								icon={<IoClose size={24} />}
								danger
								onClick={() => {
									const newItems = prescriptionItems.filter(
										(i) => i.id !== item.id
									);
									onChange(newItems);
									setServices([item, ...services]);
								}}
							/>
						}>
						<List.Item.Meta
							title={item.ten_dich_vu}
							description={(item.gia ?? 0).toLocaleString('vi-VN', {
								style: 'currency',
								currency: 'VND',
							})}
						/>
					</List.Item>
				)}
			/>

			<AddService
				visible={isAddService}
				onClose={() => setIsAddService(false)}
				onOK={() => {
					// setIsAddService(false);
					// getAllServices();
				}}
				onAdd={(service) => {
					setIsAddService(false);
					// getAllServices();
					onChange([...prescriptionItems, service]);
					setSearchValue('');
				}}
			/>
		</div>
	);
};

export default ServicesList;
