/** @format */

import { Button, Input } from 'antd';
import { useState } from 'react';
import { IoIosSearch } from 'react-icons/io';
import { IoAdd } from 'react-icons/io5';
import { AddPatient } from '../modals';

const Patients = () => {
	const [isVisibleModalAddPatient, setIsVisibleModalAddPatient] =
		useState(false);

	return (
		<div>
			<div className='container py-2'>
				<div className='row py-3'>
					<div className='col-6 text-center'>
						<Input.Search
							enterButton='Tìm kiếm'
							size='large'
							placeholder='Tìm kiếm bệnh nhân theo tên, số điện thoại hoặc số CMND/CCCD...'
							prefix={<IoIosSearch className='text-muted' size={20} />}
							allowClear
							onPressEnter={(e) => {
								alert(`Tìm kiếm: ${e.currentTarget.value}`);
							}}
							variant='filled'
						/>
					</div>
					<div className='col text-end'>
						<Button
							type='primary'
							onClick={() => setIsVisibleModalAddPatient(true)}
							size='large'
							icon={<IoAdd size={18} />}>
							Thêm mới
						</Button>
					</div>
				</div>
			</div>

			<AddPatient
				visible={isVisibleModalAddPatient}
				onClose={() => setIsVisibleModalAddPatient(false)}
			/>
		</div>
	);
};

export default Patients;
