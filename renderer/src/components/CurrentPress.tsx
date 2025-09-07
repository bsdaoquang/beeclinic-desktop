/** @format */

import { Button, List, Popover } from 'antd';
import { useSelector } from 'react-redux';
import { clinicSelector } from '../store/reducers/clinic-reducer';
import type { ClinicModel } from '../types/ClinicModel';
import type {
	PrescriptionItem,
	PrescriptionModel,
} from '../types/PrescriptionModel';
import type { ServiceModel } from '../types/ServiceModel';
import { getShortDateTime } from '../utils/datetime';

export interface CurrentPressProps {
	prescription: PrescriptionModel;
	onAddMedicine: (vals: PrescriptionItem[]) => void;
	onAddService: (vals: ServiceModel[]) => void;
	placement?:
		| 'top'
		| 'left'
		| 'right'
		| 'bottom'
		| 'topLeft'
		| 'topRight'
		| 'bottomLeft'
		| 'bottomRight'
		| 'leftTop'
		| 'leftBottom'
		| 'rightTop'
		| 'rightBottom'
		| undefined;
}

const CurrentPress = (props: CurrentPressProps) => {
	const {
		prescription,
		onAddMedicine,
		onAddService,
		placement = 'topRight',
	} = props;

	const clinic: ClinicModel = useSelector(clinicSelector);
	const isTrial =
		clinic &&
		new Date(clinic.CreatedAt).getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now();
	const isActive = (clinic && clinic.ActivationKey) || isTrial;

	const medicines: PrescriptionItem[] = prescription.thong_tin_don_thuoc_json
		? JSON.parse(prescription.thong_tin_don_thuoc_json)
		: [];

	const services: ServiceModel[] = prescription.thong_tin_dich_vu_json
		? JSON.parse(prescription.thong_tin_dich_vu_json)
		: [];

	const renderPopoverContent = (type: 'medicines' | 'services') => {
		return (type === 'medicines' && medicines.length > 0) ||
			(type === 'services' && services.length > 0) ? (
			<Popover
				placement={placement}
				key={`${prescription.id}-${type}`}
				content={
					<div style={{ minWidth: 300 }}>
						{type === 'medicines' ? (
							<>
								<List
									dataSource={medicines}
									renderItem={(item) => (
										<List.Item key={item.id}>
											<List.Item.Meta
												title={`${item.ten_thuoc} x ${item.quantity} ${item.unit}`}
												description={`${item.instruction}`}
											/>
										</List.Item>
									)}
								/>
							</>
						) : (
							<>
								<List
									dataSource={services}
									renderItem={(item) => (
										<List.Item key={item.id}>
											<List.Item.Meta
												title={`${item.ten_dich_vu}`}
												description={`${
													item.gia
														? item.gia.toLocaleString('vi-VN', {
																style: 'currency',
																currency: 'VND',
														  })
														: null
												}`}
											/>
										</List.Item>
									)}
								/>
							</>
						)}
						<div className='mt-3 text-end'>
							<Button
								disabled={!isActive}
								type='link'
								onClick={() =>
									type === 'medicines'
										? onAddMedicine(medicines)
										: onAddService(services)
								}>
								Sử dụng lại
							</Button>
						</div>
					</div>
				}>
				{type === 'medicines'
					? `Thuốc: ${medicines.length}`
					: `Dịch vụ: ${services.length}`}
			</Popover>
		) : null;
	};

	return (
		<List.Item
			key={prescription.id}
			actions={[
				renderPopoverContent('medicines'),
				renderPopoverContent('services'),
			]}>
			<List.Item.Meta
				description={getShortDateTime(
					new Date(prescription.ngay_gio_ke_don).toISOString()
				)}
				title={prescription.diagnosis.replace(/,/g, ' / ')}
			/>
		</List.Item>
	);
};

export default CurrentPress;
