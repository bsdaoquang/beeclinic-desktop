/** @format */

import { Tabs } from 'antd';
import { ClinicBackup, ClinicInfos, HTDTQG } from '../components';

const Settings = () => {
	return (
		<div className='container-fluid'>
			<div className='container py-5'>
				<Tabs
					defaultActiveKey='clinic-infos'
					className='settings-tabs'
					tabPosition='left'
					size='small'
					items={[
						{
							key: 'clinic-infos',
							label: 'Thông tin',
							children: <ClinicInfos />,
						},
						{
							key: 'clinic-appearance',
							label: 'Đơn thuốc Quốc Gia',
							children: <HTDTQG />,
						},
						{
							key: 'clinic-backup',
							label: 'Sao lưu & Phục hồi',
							children: <ClinicBackup />,
						},
					]}
				/>
			</div>
		</div>
	);
};

export default Settings;
