/** @format */

import type { PrescriptionItem } from '../modals/PrescriptionModel';
import type { PatientModel } from '../types/PatientModel';
import {
	formatDateToString,
	getDateTimeString,
	getYearOld,
} from '../utils/datetime';
import { numToString } from '../utils/numToString';

interface PrescriptionPrintProps {
	patient: PatientModel;
	prescriptionItems: PrescriptionItem[];
	diagnostic?: string;
	prescriptionCode?: string;
}

const PrescriptionPrint = ({
	patient,
	prescriptionItems,
	diagnostic,
	prescriptionCode = '',
}: PrescriptionPrintProps) => {
	const clinicDetail = {
		name: 'Phòng Khám Đa Khoa BeeClinic',
		phone: '0123 456 789',
		address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
		logo: 'https://beeclinic.vn/logo.png',
		doctor: 'BS. Nguyễn Văn A',
	};

	return (
		<div className='prescription-print'>
			<div className='text-center py-3'>
				<h2>Đơn Thuốc</h2>
				<p>Mã đơn: {prescriptionCode.toUpperCase()}</p>
			</div>
			<div className='patient-info'>
				<p>
					Họ và tên:{' '}
					<span
						style={{
							fontWeight: 'bold',
							fontSize: '1.2em',
						}}>
						{patient.name}
					</span>
				</p>
				<div className='row'>
					<div className='col'>
						<p>
							Ngày sinh:{' '}
							{patient.age
								? `${formatDateToString(new Date(patient.age))} (${getYearOld(
										new Date(patient.age).toISOString()
								  )} tuổi)`
								: ''}
						</p>
					</div>
					<div className='col'>
						<p>Giới tính: {patient.gender === 'male' ? 'Nam' : 'Nữ'}</p>
					</div>
				</div>
				<p>Số điện thoại: {patient.phone}</p>
				<p>Địa chỉ: {patient.address}</p>
				<p>Chẩn đoán: {diagnostic}</p>
			</div>
			<div className='medicine-content py-3'>
				<p>Thuốc điều trị:</p>
				{prescriptionItems.length > 0 ? (
					<>
						{prescriptionItems.map((item, index) => (
							<div className='mb-3'>
								<div
									className='row'
									style={{
										fontWeight: 'bold',
									}}>
									<div className='col-8'>
										<p>
											<b>
												{index + 1}. {item.ten_thuoc}
											</b>
										</p>
									</div>
									<div className='col-4'>{`${numToString(item.quantity)} ${
										item.unit
									}`}</div>
								</div>
								<p style={{ marginLeft: '1rem' }}>
									<i>{`  ${item.instruction}`}</i>
								</p>
							</div>
						))}
					</>
				) : null}
			</div>
			<div className='footer' style={{ height: '120px' }}>
				<div className='row'>
					<div className='col'>
						<p>
							<b>Lời dặn:</b>
						</p>
					</div>
					<div className='col text-center'>
						<p>
							<i>{getDateTimeString()}</i>
						</p>
						<p>
							<b>Bác sĩ khám bệnh</b>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrescriptionPrint;
