/** @format */

import { Descriptions, Divider } from 'antd';
import type { PatientModel } from '../types/PatientModel';
import type { PrescriptionItem } from '../types/PrescriptionModel';
import { getYearOld } from '../utils/datetime';

interface MedicinePrintListProps {
	medicines: PrescriptionItem[];
	patient: PatientModel;
	prescriptionCode?: string;
	diagnostic?: string[];
}

const MedicinePrintList = ({
	medicines,
	patient,
	prescriptionCode,
	diagnostic,
}: MedicinePrintListProps) => {
	return (
		<div className='prescription-print'>
			<div className='text-center'>
				<h3 className='mb-0'>Danh sách thuốc</h3>
				<p>
					<i>Mã đơn: {prescriptionCode?.toUpperCase()}</i>
				</p>
			</div>
			<Descriptions column={4} className='my-3'>
				<Descriptions.Item label='Họ và tên' span={2}>
					{patient.name}
				</Descriptions.Item>
				<Descriptions.Item label='Tuổi'>
					{patient.age ? getYearOld(new Date(patient.age).toISOString()) : ''}
				</Descriptions.Item>
				<Descriptions.Item label='Giới tính'>
					{patient.gender ? (patient.gender === 'female' ? 'Nữ' : 'Nam') : ''}
				</Descriptions.Item>
				<Descriptions.Item label='Chẩn đoán' span={4}>
					{diagnostic?.join('/ ')}
				</Descriptions.Item>
			</Descriptions>
			<Divider />
			{medicines.length > 0 ? (
				<>
					<table className='table table-bordered'>
						<thead>
							<tr className='text-center'>
								<th>Mã thuốc</th>
								<th style={{ width: '60%' }}>Tên thuốc</th>
								<th>Số lượng</th>
							</tr>
						</thead>
						<tbody>
							{medicines.map((item) => (
								<tr key={item.ma_thuoc?.toUpperCase()}>
									<td>{item.ma_thuoc}</td>
									<td style={{ width: '60%' }}>{item.ten_thuoc}</td>
									<td className='text-end'>{item.quantity}</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			) : (
				<>Không có thuốc nào được kê đơn</>
			)}
		</div>
	);
};

export default MedicinePrintList;
