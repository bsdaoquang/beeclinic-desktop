/** @format */

import { Modal } from 'antd';

export interface AddPatientProps {
	visible: boolean;
	onClose: () => void;
	patient?: any;
}

const AddPatient = (props: AddPatientProps) => {
	const { visible, onClose } = props;

	return (
		<Modal
			footer={null}
			width='50%'
			open={visible}
			onCancel={onClose}
			centered
			onOk={() => {}}
			title='Thêm bệnh nhân mới'>
			<div>
				{/* Form to add a new patient will go here */}
				<p>Form content goes here...</p>
			</div>
		</Modal>
	);
};

export default AddPatient;
