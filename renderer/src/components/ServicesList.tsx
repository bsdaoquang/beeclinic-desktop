/** @format */

import { useEffect, useRef, useState } from 'react';
import type { ServiceModel } from '../types/ServiceModel';
import { AutoComplete, Button, List } from 'antd';
import { IoClose } from 'react-icons/io5';

export interface ServicesListProps {
	prescriptionItems: ServiceModel[];
	onChange: (items: ServiceModel[]) => void;
}

const ServicesList = ({ prescriptionItems, onChange }: ServicesListProps) => {
	const [services, setServices] = useState<ServiceModel[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');

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
					<AutoComplete
						notFoundContent={<div>Không tìm thấy dịch vụ</div>}
						ref={inpRef}
						style={{
							width: '100%',
						}}
						value={searchValue}
						allowClear
						onChange={(text) => setSearchValue(text)}
						options={services.map((service) => ({
							value: service.id,
							label: service.ten_dich_vu,
						}))}
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
									onChange(
										prescriptionItems.filter((item) => item.id !== item.id)
									);
									setServices([...services, item]);
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
		</div>
	);
};

export default ServicesList;
